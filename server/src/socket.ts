import { Server as SocketIOServer, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from './middleware/auth.js'
import { MessageService } from './services/messages.js'
import { WhiteboardService } from './services/whiteboard.js'
import { RoomService } from './services/rooms.js'
import { SocketEvents } from '@collabchat/shared'

// Track room connections
const roomConnections = new Map<string, Set<string>>()
const roomPresence = new Map<string, Map<string, any>>()
const typingUsers = new Map<string, Set<string>>()

// Shared drawing state (single source of truth)
const roomObjects = new Map<string, Map<string, any>>()

export default function setupSocketEvents(
  io: SocketIOServer,
  prisma: PrismaClient
) {
  io.use((socket: any, next: any) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('No token'))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return next(new Error('Invalid token'))
    }

    socket.data.userId = decoded.userId
    next()
  })

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId

    console.log(`User ${userId} connected`)

    // ============ ROOM EVENTS ============
    socket.on(SocketEvents.ROOM_JOIN, async (data: any) => {
      try {
        const { roomId } = data
        socket.join(roomId)

        // Initialize room tracking
        if (!roomConnections.has(roomId)) {
          roomConnections.set(roomId, new Set())
          roomPresence.set(roomId, new Map())
          typingUsers.set(roomId, new Set())
        }

        roomConnections.get(roomId)!.add(userId)

        // Get user info
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, avatarColor: true },
        })

        // Update presence
        const presence = {
          userId,
          userName: user?.name,
          avatarColor: user?.avatarColor,
          online: true,
        }
        roomPresence.get(roomId)!.set(userId, presence)

        // Broadcast presence update
        io.to(roomId).emit(SocketEvents.ROOM_PRESENCE, presence)

        // Send board init state
        if (!roomObjects.has(roomId)) {
          const latestSnapshot = await WhiteboardService.getLatestSnapshot(roomId)
          const boardState = latestSnapshot
            ? JSON.parse(latestSnapshot.canvasJson)
            : { objects: [] }
          
          const objectsMap = new Map<string, any>()
          if (Array.isArray(boardState.objects)) {
            boardState.objects.forEach((obj: any) => {
              if (obj.id) objectsMap.set(obj.id, obj)
            })
          }
          roomObjects.set(roomId, objectsMap)
        }

        socket.emit(SocketEvents.BOARD_STATE_INIT, {
          objects: Array.from(roomObjects.get(roomId)!.values()),
          presences: Array.from(roomPresence.get(roomId)!.values()),
        })

        // Send chat history
        const messages = await MessageService.getRoomMessages(roomId, 50)
        socket.emit(SocketEvents.CHAT_HISTORY, messages)
      } catch (error) {
        console.error('Room join error:', error)
        socket.emit(SocketEvents.ROOM_ERROR, { message: 'Failed to join room' })
      }
    })

    socket.on(SocketEvents.ROOM_LEAVE, (data: any) => {
      try {
        const { roomId } = data
        socket.leave(roomId)

        const connections = roomConnections.get(roomId)
        if (connections) {
          connections.delete(userId)
        }

        const presence = roomPresence.get(roomId)?.get(userId)
        if (presence) {
          io.to(roomId).emit(SocketEvents.ROOM_PRESENCE, {
            ...presence,
            online: false,
          })
          roomPresence.get(roomId)?.delete(userId)
        }

        typingUsers.get(roomId)?.delete(userId)
      } catch (error) {
        console.error('Room leave error:', error)
      }
    })

    // ============ CHAT EVENTS ============
    socket.on(SocketEvents.CHAT_MESSAGE_SEND, async (data: any) => {
      try {
        const { roomId, clientMessageId } = data ?? {}
        const incomingText =
          typeof data?.content === 'string'
            ? data.content
            : typeof data?.text === 'string'
              ? data.text
              : ''
        const content = incomingText.trim()

        if (typeof roomId !== 'string' || content.length === 0) {
          return
        }

        // Verify membership
        const isMember = await RoomService.isRoomMember(userId, roomId)
        if (!isMember) {
          socket.emit(SocketEvents.ROOM_ERROR, { message: 'Not a member' })
          return
        }

        // Save and broadcast message
        const message = await MessageService.createMessage(roomId, userId, { content })

        const broadcastMessage = {
          type: 'chat',
          username: message.senderName,
          text: message.content,
          time: message.createdAt,
          id: message.id,
          roomId: message.roomId,
          senderId: message.senderId,
          senderAvatar: message.senderAvatar,
          clientMessageId:
            typeof clientMessageId === 'string' && clientMessageId.length > 0
              ? clientMessageId
              : undefined,
        }

        io.to(roomId).emit(SocketEvents.CHAT_MESSAGE_NEW, {
          ...broadcastMessage,
        })

        // Clear typing indicator
        typingUsers.get(roomId)?.delete(userId)
        io.to(roomId).emit(SocketEvents.CHAT_TYPING, {
          userId,
          isTyping: false,
        })
      } catch (error) {
        console.error('Chat message error:', error)
        socket.emit(SocketEvents.ROOM_ERROR, { message: 'Failed to send message' })
      }
    })

    socket.on(SocketEvents.CHAT_TYPING, (data: any) => {
      const { roomId, isTyping } = data
      const user = roomPresence.get(roomId)?.get(userId)

      if (isTyping) {
        typingUsers.get(roomId)?.add(userId)
      } else {
        typingUsers.get(roomId)?.delete(userId)
      }

      io.to(roomId).emit(SocketEvents.CHAT_TYPING, {
        userId,
        userName: user?.userName,
        isTyping,
      })
    })

    // ============ WHITEBOARD EVENTS ============
    socket.on(SocketEvents.BOARD_DRAW, (data: any) => {
      // Legacy or smooth pointer sync (optional depending on needs, unused in current batch implementation)
      const { roomId, type, x, y, prevX, prevY, color, width } = data ?? {}
      if (typeof roomId !== 'string' || type !== 'draw') return

      if (
        typeof x !== 'number' ||
        typeof y !== 'number' ||
        typeof prevX !== 'number' ||
        typeof prevY !== 'number'
      ) {
        return
      }

      socket.to(roomId).emit(SocketEvents.BOARD_DRAW, {
        type: 'draw',
        x,
        y,
        prevX,
        prevY,
        color: typeof color === 'string' ? color : undefined,
        width: typeof width === 'number' ? width : undefined,
      })
    })

    socket.on(SocketEvents.BOARD_OBJECT_ADD, (data: any) => {
      const { roomId, object } = data
      if (typeof roomId === 'string' && object && object.id) {
        if (!roomObjects.has(roomId)) {
          roomObjects.set(roomId, new Map())
        }
        roomObjects.get(roomId)!.set(object.id, object)
        socket.broadcast.to(roomId).emit(SocketEvents.BOARD_OBJECT_ADD, { object })
      }
    })

    socket.on(SocketEvents.BOARD_OBJECT_UPDATE, (data: any) => {
      const { roomId, id, updates } = data
      if (typeof roomId === 'string' && id) {
        const obj = roomObjects.get(roomId)?.get(id)
        if (obj) {
          Object.assign(obj, updates)
        }
        socket.broadcast.to(roomId).emit(SocketEvents.BOARD_OBJECT_UPDATE, { id, updates })
      }
    })

    socket.on(SocketEvents.BOARD_OBJECT_DELETE, (data: any) => {
      const { roomId, id } = data
      if (typeof roomId === 'string' && id) {
        roomObjects.get(roomId)?.delete(id)
        socket.broadcast.to(roomId).emit(SocketEvents.BOARD_OBJECT_DELETE, { id })
      }
    })

    socket.on(SocketEvents.BOARD_CLEAR, (data: any) => {
      const { roomId } = data
      if (typeof roomId === 'string') {
        roomObjects.set(roomId, new Map())
        socket.broadcast.to(roomId).emit(SocketEvents.BOARD_CLEAR, {})
      }
    })

    socket.on(SocketEvents.BOARD_CURSOR, (data: any) => {
      const { roomId, x, y } = data
      socket.broadcast.to(roomId).emit(SocketEvents.BOARD_CURSOR, {
        userId,
        x,
        y,
      })
    })

    socket.on(SocketEvents.BOARD_SNAPSHOT_SAVE, async (data: any) => {
      try {
        const { roomId, canvasJson } = data

        // Verify membership
        const isMember = await RoomService.isRoomMember(userId, roomId)
        if (!isMember) {
          socket.emit(SocketEvents.ROOM_ERROR, { message: 'Not a member' })
          return
        }

        const jsonToSave = canvasJson || JSON.stringify({ objects: Array.from(roomObjects.get(roomId)?.values() || []) })
        await WhiteboardService.saveSnapshot(roomId, userId, jsonToSave)
      } catch (error) {
        console.error('Snapshot save error:', error)
      }
    })

    socket.on('disconnect', () => {
      try {
        console.log(`User ${userId} disconnected`)

        // Clean up presence from all rooms
        for (const [roomId, connections] of roomConnections.entries()) {
          if (connections.has(userId)) {
            connections.delete(userId)

            const presence = roomPresence.get(roomId)?.get(userId)
            if (presence) {
              io.to(roomId).emit(SocketEvents.ROOM_PRESENCE, {
                ...presence,
                online: false,
              })
              roomPresence.get(roomId)?.delete(userId)
            }

            typingUsers.get(roomId)?.delete(userId)
          }
        }
      } catch (error) {
        console.error('Socket disconnect cleanup error:', error)
      }
    })
  })
}

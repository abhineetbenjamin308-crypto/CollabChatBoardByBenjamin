import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useRoomsStore } from '@/stores/rooms'
import { useSocketStore } from '@/stores/socket'
import { useChatStore } from '@/stores/chat'
import { useWhiteboardStore } from '@/stores/whiteboard'
import { SocketEvents } from '@collabchat/shared'
import Whiteboard from '@/components/Whiteboard'
import ChatPanel from '@/components/ChatPanel'
import AISidebar from '@/components/AISidebar'

type BoardObjectPayload = Record<string, unknown> & { id?: string; type?: string }

const createBoardObjectId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `obj_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const normalizeBoardObject = (
  object: BoardObjectPayload
): Record<string, unknown> & { id: string; type: string } => ({
  ...object,
  id:
    typeof object.id === 'string' && object.id.length > 0
      ? object.id
      : createBoardObjectId(),
  type:
    typeof object.type === 'string' && object.type.length > 0
      ? object.type
      : 'path',
})

const normalizeIncomingChatMessage = (
  message: any,
  roomId: string
): {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  type: 'text'
  createdAt: string
  clientMessageId?: string
} | null => {
  if (!message || typeof message !== 'object') return null

  if (message.type === 'chat') {
    const text = typeof message.text === 'string' ? message.text : ''
    const createdAt = typeof message.time === 'string' ? message.time : new Date().toISOString()
    const username =
      typeof message.username === 'string' && message.username.length > 0
        ? message.username
        : 'User'

    return {
      id:
        typeof message.id === 'string' && message.id.length > 0
          ? message.id
          : `${username}-${createdAt}`,
      roomId:
        typeof message.roomId === 'string' && message.roomId.length > 0
          ? message.roomId
          : roomId,
      senderId:
        typeof message.senderId === 'string' && message.senderId.length > 0
          ? message.senderId
          : username,
      senderName: username,
      senderAvatar:
        typeof message.senderAvatar === 'string' && message.senderAvatar.length > 0
          ? message.senderAvatar
          : '#4f46e5',
      content: text,
      type: 'text',
      createdAt,
      clientMessageId:
        typeof message.clientMessageId === 'string' && message.clientMessageId.length > 0
          ? message.clientMessageId
          : undefined,
    }
  }

  if (typeof message.content !== 'string') return null

  return {
    id: typeof message.id === 'string' ? message.id : `${Date.now()}-${message.content}`,
    roomId:
      typeof message.roomId === 'string' && message.roomId.length > 0
        ? message.roomId
        : roomId,
    senderId: typeof message.senderId === 'string' ? message.senderId : 'user',
    senderName: typeof message.senderName === 'string' ? message.senderName : 'User',
    senderAvatar:
      typeof message.senderAvatar === 'string' && message.senderAvatar.length > 0
        ? message.senderAvatar
        : '#4f46e5',
    content: message.content,
    type: 'text',
    createdAt:
      typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString(),
    clientMessageId:
      typeof message.clientMessageId === 'string' && message.clientMessageId.length > 0
        ? message.clientMessageId
        : undefined,
  }
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const { currentRoom, fetchRoom, loading } = useRoomsStore()
  const { socket, connected, emit, on, off, connect } = useSocketStore()
  const { addMessage, setMessages, setTypingIndicator } = useChatStore()
  const {
    presences,
    addObject,
    updateObject,
    deleteObject,
    clear,
    setObjects,
    addPresence,
    setPresences,
  } = useWhiteboardStore()

  const [showAI, setShowAI] = useState(false)
  const [activeTab, setActiveTab] = useState<'board' | 'chat' | 'ai'>('board')

  useEffect(() => {
    if (!showAI && activeTab === 'ai') {
      setActiveTab('board')
    }
  }, [showAI, activeTab])

  useEffect(() => {
    if (!token || !user || !roomId) {
      navigate('/dashboard')
      return
    }

    fetchRoom(roomId, token).catch(() => {
      navigate('/dashboard')
    })
  }, [roomId, token, user, fetchRoom, navigate])

  useEffect(() => {
    if (!token) return
    if (socket && connected) return
    connect(token)
  }, [token, socket, connected, connect])

  // Socket events
  useEffect(() => {
    if (!socket || !connected || !roomId) return

    // Chat events
    const handleChatHistory = (data: any[]) => {
      const normalizedMessages = data
        .map((message) => normalizeIncomingChatMessage(message, roomId))
        .filter((message): message is NonNullable<typeof message> => message !== null)
      setMessages(normalizedMessages)
    }

    const handleNewMessage = (message: any) => {
      const normalizedMessage = normalizeIncomingChatMessage(message, roomId)
      if (!normalizedMessage) return
      addMessage(normalizedMessage)
    }

    const handleTyping = (data: any) => {
      if (!data?.userId || data.userId === user?.id) return
      setTypingIndicator({
        userId: data.userId,
        userName: data.userName || 'Someone',
        isTyping: Boolean(data.isTyping),
      })
    }

    // Whiteboard events
    const handleBoardStateInit = (data: {
      objects?: BoardObjectPayload[]
      presences?: Array<{
        userId: string
        userName: string
        avatarColor: string
        online: boolean
      }>
    }) => {
      const normalizedObjects = (data.objects ?? []).map(normalizeBoardObject)
      setObjects(normalizedObjects)
      setPresences(data.presences ?? [])
    }

    const handleObjectAdd = (data: { object?: BoardObjectPayload }) => {
      if (!data.object) return
      addObject(normalizeBoardObject(data.object))
    }

    const handleObjectUpdate = (data: { id: string; updates: Record<string, unknown> }) => {
      updateObject(data.id, data.updates)
    }

    const handleObjectDelete = (data: { id: string }) => {
      deleteObject(data.id)
    }

    const handleBoardClear = () => {
      clear()
    }

    const handlePresence = (data: any) => {
      addPresence(data)
    }

    on(SocketEvents.CHAT_HISTORY, handleChatHistory)
    on(SocketEvents.CHAT_MESSAGE_NEW, handleNewMessage)
    on(SocketEvents.CHAT_TYPING, handleTyping)
    on(SocketEvents.BOARD_STATE_INIT, handleBoardStateInit)
    on(SocketEvents.BOARD_OBJECT_ADD, handleObjectAdd)
    on(SocketEvents.BOARD_OBJECT_UPDATE, handleObjectUpdate)
    on(SocketEvents.BOARD_OBJECT_DELETE, handleObjectDelete)
    on(SocketEvents.BOARD_CLEAR, handleBoardClear)
    on(SocketEvents.ROOM_PRESENCE, handlePresence)

    // Join room after listeners are attached to avoid dropped events.
    emit(SocketEvents.ROOM_JOIN, { roomId })

    return () => {
      emit(SocketEvents.ROOM_LEAVE, { roomId })
      off(SocketEvents.CHAT_HISTORY, handleChatHistory)
      off(SocketEvents.CHAT_MESSAGE_NEW, handleNewMessage)
      off(SocketEvents.CHAT_TYPING, handleTyping)
      off(SocketEvents.BOARD_STATE_INIT, handleBoardStateInit)
      off(SocketEvents.BOARD_OBJECT_ADD, handleObjectAdd)
      off(SocketEvents.BOARD_OBJECT_UPDATE, handleObjectUpdate)
      off(SocketEvents.BOARD_OBJECT_DELETE, handleObjectDelete)
      off(SocketEvents.BOARD_CLEAR, handleBoardClear)
      off(SocketEvents.ROOM_PRESENCE, handlePresence)
    }
  }, [
    socket,
    connected,
    roomId,
    user?.id,
    setMessages,
    addMessage,
    setTypingIndicator,
    setObjects,
    setPresences,
    addObject,
    updateObject,
    deleteObject,
    clear,
    addPresence,
    emit,
    on,
    off,
    connect,
  ])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    )
  }

  if (!currentRoom) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Room not found</p>
      </div>
    )
  }

  return (
    <div className="h-screen min-h-0 flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{currentRoom.name}</h1>
          <p className="text-sm text-gray-500">Invite code: {currentRoom.inviteCode}</p>
        </div>
        <div>
          <button
            onClick={() => setShowAI(!showAI)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            {showAI ? 'Hide AI' : 'Show AI'}
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex gap-0 bg-white border-b border-gray-200 shrink-0">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex-1 py-2 text-center font-medium transition ${
            activeTab === 'board'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600'
          }`}
        >
          Board
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-center font-medium transition ${
            activeTab === 'chat'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 text-center font-medium transition ${
            activeTab === 'ai'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600'
          }`}
        >
          AI
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden md:p-4">
        {/* Whiteboard (desktop) */}
        <div className="hidden md:flex flex-1 min-w-0 min-h-0 flex-col">
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden shadow-lg">
            <Whiteboard roomId={roomId!} />
          </div>
        </div>

        {/* Mobile board view */}
        {activeTab === 'board' && (
          <div className="md:hidden flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden shadow-lg">
            <Whiteboard roomId={roomId!} />
          </div>
        )}

        {/* Chat panel (desktop) */}
        <div className="hidden md:flex w-80 shrink-0 min-h-0 flex-col">
          <ChatPanel roomId={roomId!} />
        </div>

        {/* Mobile chat view */}
        {activeTab === 'chat' && (
          <div className="md:hidden flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden">
            <ChatPanel roomId={roomId!} />
          </div>
        )}

        {/* AI Sidebar (desktop) */}
        {showAI && (
          <div className="hidden md:flex w-80 shrink-0 min-h-0 flex-col">
            <AISidebar roomId={roomId!} />
          </div>
        )}

        {/* Mobile AI view */}
        {activeTab === 'ai' && showAI && (
          <div className="md:hidden flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden">
            <AISidebar roomId={roomId!} />
          </div>
        )}
      </div>

      {/* Presence avatars (bottom) */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex gap-2 shrink-0">
        {Array.from(presences.values()).map((presence) => (
          <div
            key={presence.userId}
            title={presence.userName}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              presence.online ? '' : 'opacity-50'
            }`}
            style={{ backgroundColor: presence.avatarColor }}
          >
            {presence.userName?.charAt(0).toUpperCase() || '?'}
          </div>
        ))}
      </div>
    </div>
  )
}

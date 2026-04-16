import { prisma } from '../server'
import { CreateRoomSchema, JoinRoomSchema } from '@collabchat/shared'

export class RoomService {
  static async createRoom(userId: string, data: any) {
    const validated = CreateRoomSchema.parse(data)

    const room = await prisma.room.create({
      data: {
        name: validated.name,
        ownerId: userId,
      },
    })

    // Add creator as a member with owner role
    await prisma.roomMember.create({
      data: {
        roomId: room.id,
        userId,
        role: 'owner',
      },
    })

    return room
  }

  static async getUserRooms(userId: string) {
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarColor: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return rooms
  }

  static async getRoomById(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarColor: true,
              },
            },
          },
        },
      },
    })

    if (!room) {
      throw { statusCode: 404, message: 'Room not found' }
    }

    // Verify user is a member
    const isMember = room.members.some((m) => m.userId === userId)
    if (!isMember) {
      throw { statusCode: 403, message: 'Not a member of this room' }
    }

    return room
  }

  static async joinRoom(userId: string, data: any) {
    const validated = JoinRoomSchema.parse(data)

    const room = await prisma.room.findUnique({
      where: { inviteCode: validated.inviteCode },
    })

    if (!room) {
      throw { statusCode: 404, message: 'Room not found' }
    }

    // Check if already a member
    const existingMember = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    })

    if (existingMember) {
      throw { statusCode: 409, message: 'Already a member' }
    }

    await prisma.roomMember.create({
      data: {
        roomId: room.id,
        userId,
        role: 'member',
      },
    })

    return room
  }

  static async isRoomMember(userId: string, roomId: string): Promise<boolean> {
    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    })
    return !!member
  }
}

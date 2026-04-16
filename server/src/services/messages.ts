import { prisma } from '../server.js'
import { SendMessageSchema } from '@collabchat/shared'

export class MessageService {
  static async getRoomMessages(roomId: string, limit: number = 50) {
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return messages.map((msg) => ({
      id: msg.id,
      roomId: msg.roomId,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      senderAvatar: msg.sender.avatarColor,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt.toISOString(),
    }))
  }

  static async createMessage(roomId: string, senderId: string, data: any) {
    const validated = SendMessageSchema.parse(data)

    const message = await prisma.message.create({
      data: {
        roomId,
        senderId,
        content: validated.content,
        type: 'text',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
          },
        },
      },
    })

    return {
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderAvatar: message.sender.avatarColor,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt.toISOString(),
    }
  }

  static async createSystemMessage(
    roomId: string,
    content: string
  ) {
    const message = await prisma.message.create({
      data: {
        roomId,
        senderId: 'system', // Special system user ID
        content,
        type: 'system',
      },
    })

    return message
  }
}

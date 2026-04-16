import { prisma } from '../server.js'

export class WhiteboardService {
  static async saveSnapshot(roomId: string, userId: string, canvasJson: string) {
    const snapshot = await prisma.whiteboardSnapshot.create({
      data: {
        roomId,
        canvasJson,
        createdById: userId,
      },
    })

    return snapshot
  }

  static async getLatestSnapshot(roomId: string) {
    const snapshot = await prisma.whiteboardSnapshot.findFirst({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    })

    return snapshot
  }

  static async getSnapshotHistory(roomId: string, limit: number = 10) {
    const snapshots = await prisma.whiteboardSnapshot.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return snapshots
  }
}

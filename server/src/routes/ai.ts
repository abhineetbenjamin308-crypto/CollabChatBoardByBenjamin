import express, { Router } from 'express'
import { AIService } from '../services/ai'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { RoomService } from '../services/rooms'

const router: Router = express.Router()

// Helper to verify room membership
const checkRoomAccess = async (userId: string, roomId: string) => {
  const isMember = await RoomService.isRoomMember(userId, roomId)
  if (!isMember) {
    throw { statusCode: 403, message: 'Not a member of this room' }
  }
}

router.post(
  '/summarize-room',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const { roomId } = req.body
      await checkRoomAccess(req.userId!, roomId)

      const result = await AIService.summarizeRoom(roomId, req.userId!)
      await AIService.logAction(roomId, req.userId!, 'summarize-room', { roomId }, result)

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  }
)

router.post(
  '/extract-actions',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const { roomId } = req.body
      await checkRoomAccess(req.userId!, roomId)

      const result = await AIService.extractActions(roomId, req.userId!)
      await AIService.logAction(roomId, req.userId!, 'extract-actions', { roomId }, result)

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  }
)

router.post(
  '/suggest-diagram',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const { roomId } = req.body
      await checkRoomAccess(req.userId!, roomId)

      const result = await AIService.suggestDiagram(roomId, req.userId!)
      await AIService.logAction(roomId, req.userId!, 'suggest-diagram', { roomId }, result)

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  }
)

router.post(
  '/generate-plan',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const { roomId } = req.body
      await checkRoomAccess(req.userId!, roomId)

      const result = await AIService.generatePlan(roomId, req.userId!)
      await AIService.logAction(roomId, req.userId!, 'generate-plan', { roomId }, result)

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  }
)

export default router

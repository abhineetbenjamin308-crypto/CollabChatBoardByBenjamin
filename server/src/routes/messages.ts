import express, { Router } from 'express'
import { MessageService } from '../services/messages.js'
import { AuthRequest, authMiddleware } from '../middleware/auth.js'
import { RoomService } from '../services/rooms.js'

const router: Router = express.Router()

router.get(
  '/room/:roomId',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      // Verify user is member
      const isMember = await RoomService.isRoomMember(
        req.userId!,
        req.params.roomId
      )
      if (!isMember) {
        return res.status(403).json({ error: 'Not a member' })
      }

      const messages = await MessageService.getRoomMessages(req.params.roomId)
      res.json(messages)
    } catch (error: any) {
      next(error)
    }
  }
)

export default router

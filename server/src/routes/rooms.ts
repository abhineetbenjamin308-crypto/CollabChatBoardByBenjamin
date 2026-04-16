import express, { Router } from 'express'
import { RoomService } from '../services/rooms.js'
import { AuthRequest, authMiddleware } from '../middleware/auth.js'

const router: Router = express.Router()

router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const room = await RoomService.createRoom(req.userId!, req.body)
    res.status(201).json(room)
  } catch (error: any) {
    next(error)
  }
})

router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const rooms = await RoomService.getUserRooms(req.userId!)
    res.json(rooms)
  } catch (error: any) {
    next(error)
  }
})

router.get('/:roomId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const room = await RoomService.getRoomById(req.params.roomId, req.userId!)
    res.json(room)
  } catch (error: any) {
    next(error)
  }
})

router.post('/join/:inviteCode', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const room = await RoomService.joinRoom(req.userId!, {
      inviteCode: req.params.inviteCode,
    })
    res.json(room)
  } catch (error: any) {
    next(error)
  }
})

export default router

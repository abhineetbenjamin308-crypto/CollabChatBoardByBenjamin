import express, { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthService } from '../services/auth.js'
import { AuthRequest, authMiddleware } from '../middleware/auth.js'

const router: Router = express.Router()

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.signup(req.body)
    res.status(201).json(result)
  } catch (error: any) {
    next(error)
  }
})

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.login(req.body)
    res.json(result)
  } catch (error: any) {
    next(error)
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
      },
    })
    res.json(user)
  } catch (error: any) {
    next(error)
  }
})

export default router

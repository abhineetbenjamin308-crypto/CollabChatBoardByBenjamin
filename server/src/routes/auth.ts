import express, { Router } from 'express'
import { AuthService } from '../services/auth'
import { AuthRequest, authMiddleware } from '../middleware/auth'

const router: Router = express.Router()

router.post('/signup', async (req, res, next) => {
  try {
    const result = await AuthService.signup(req.body)
    res.status(201).json(result)
  } catch (error: any) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body)
    res.json(result)
  } catch (error: any) {
    next(error)
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { prisma } = await import('../server')
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

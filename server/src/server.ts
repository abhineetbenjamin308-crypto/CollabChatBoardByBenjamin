import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

dotenv.config()

const prisma = new PrismaClient()
const app: Express = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Export app and prisma for use in route handlers
export { app, prisma }

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err)
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(statusCode).json({ error: message })
})

// Import routes
import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'
import messageRoutes from './routes/messages.js'
import aiRoutes from './routes/ai.js'

// Register routes
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/ai', aiRoutes)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' })
})

// Start server
const httpServer = createServer(app)

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})

// Socket.IO events setup
import setupSocketEvents from './socket.js'
setupSocketEvents(io, prisma)

// Export io for socket event emitters
export { io }

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...')
  await prisma.$disconnect()
  process.exit(0)
})

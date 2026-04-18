import express, { Express, Request, Response, NextFunction } from 'express'
import cors, { CorsOptions } from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

// 1. ALL IMPORTS MUST BE AT THE TOP
import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'
import messageRoutes from './routes/messages.js'
import aiRoutes from './routes/ai.js'
import setupSocketEvents from './socket.js'

dotenv.config()

const prisma = new PrismaClient()
const app: Express = express()
const port = process.env.PORT || 3001

const allowedOrigins = [
  'http://localhost:5173',
  'https://collab-chat-board-by-benjamin.vercel.app'
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// 2. GENERAL MIDDLEWARE
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Enable pre-flight for all routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Export app and prisma for use in route handlers
export { app, prisma }

// 3. ROUTES
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/ai', aiRoutes)

// 4. 404 HANDLER (Catches requests that didn't match any routes above)
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' })
})

// 5. GLOBAL ERROR HANDLER (Must be the absolute last app.use)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err)
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(statusCode).json({ error: message })
})

// 6. SERVER AND SOCKET INITIALIZATION
const httpServer = createServer(app)

const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
})

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

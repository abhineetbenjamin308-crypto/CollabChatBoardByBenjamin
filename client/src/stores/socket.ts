import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://collabchatboardbybenjamin-production.up.railway.app://localhost:3001'

interface SocketState {
  socket: Socket | null
  socketToken: string | null
  connected: boolean
  error: string | null
  connect: (token: string) => void
  disconnect: () => void
  emit: (event: string, data: any) => void
  off: (event: string, callback?: any) => void
  on: (event: string, callback: (data: any) => void) => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  socketToken: null,
  connected: false,
  error: null,

  connect: (token) => {
    const existingSocket = get().socket
    const existingToken = get().socketToken

    if (existingSocket && existingSocket.connected && existingToken === token) {
      return
    }

    if (existingSocket && existingToken === token) {
      existingSocket.connect()
      set({ socket: existingSocket, connected: existingSocket.connected, error: null })
      return
    }

    if (existingSocket && existingToken !== token) {
      existingSocket.disconnect()
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('Socket connected')
      set({ connected: true, error: null })
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      set({ connected: false })
    })

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err)
      set({ error: err.message })
    })

    set({ socket, socketToken: token, error: null })
  },

  disconnect: () => {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
      set({ socket: null, socketToken: null, connected: false })
    }
  },

  emit: (event, data) => {
    const socket = get().socket
    if (socket && socket.connected) {
      socket.emit(event, data)
    }
  },

  off: (event, callback) => {
    const socket = get().socket
    if (socket) {
      socket.off(event, callback)
    }
  },

  on: (event, callback) => {
    const socket = get().socket
    if (socket) {
      socket.on(event, callback)
    }
  },
}))

import { create } from 'zustand'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface RoomsState {
  rooms: any[]
  currentRoom: any | null
  loading: boolean
  error: string | null
  createRoom: (name: string, token: string) => Promise<void>
  fetchRooms: (token: string) => Promise<void>
  fetchRoom: (roomId: string, token: string) => Promise<void>
  joinRoom: (inviteCode: string, token: string) => Promise<void>
  clearError: () => void
}

export const useRoomsStore = create<RoomsState>((set) => ({
  rooms: [],
  currentRoom: null,
  loading: false,
  error: null,

  createRoom: async (name, token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.post(`${API_URL}/api/rooms`, { name }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set((state) => ({
        rooms: [data, ...state.rooms],
        loading: false,
      }))
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to create room' })
      throw err
    }
  },

  fetchRooms: async (token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.get(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ rooms: data, loading: false })
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to fetch rooms' })
    }
  },

  fetchRoom: async (roomId, token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.get(`${API_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ currentRoom: data, loading: false })
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to fetch room' })
      throw err
    }
  },

  joinRoom: async (inviteCode, token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.post(
        `${API_URL}/api/rooms/join/${inviteCode}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      set((state) => ({
        rooms: [data, ...state.rooms],
        currentRoom: data,
        loading: false,
      }))
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to join room' })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))

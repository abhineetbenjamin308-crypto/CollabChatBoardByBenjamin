import { create } from 'zustand'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface AuthState {
  user: any | null
  token: string | null
  loading: boolean
  error: string | null
  signup: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  signup: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/signup`, {
        name,
        email,
        password,
      })
      set({ user: data.user, token: data.accessToken, loading: false })
      localStorage.setItem('token', data.accessToken)
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Signup failed' })
      throw err
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      })
      set({ user: data.user, token: data.accessToken, loading: false })
      localStorage.setItem('token', data.accessToken)
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Login failed' })
      throw err
    }
  },

  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem('token')
  },

  hydrate: () => {
    const token = localStorage.getItem('token')
    if (token) {
      set({ token })
      // In a real app, verify token validity here
    }
  },
}))

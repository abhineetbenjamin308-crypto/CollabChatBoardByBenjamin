import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useSocketStore } from '@/stores/socket'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const { disconnect } = useSocketStore()

  const handleLogout = () => {
    disconnect()
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-lg dark:bg-slate-950/80 light:bg-white/80 light:border-gray-200">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
          >
            CollabChat
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="rounded-full bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 dark:text-gray-400 dark:hover:text-white light:text-gray-600 light:hover:bg-gray-100"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <div 
              className="h-8 w-8 rounded-full border border-white/20"
              style={{ backgroundColor: user?.avatarColor || '#4f46e5' }}
            />
            <span className="text-sm font-medium text-gray-200 dark:text-gray-200 light:text-gray-700">{user?.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-500 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

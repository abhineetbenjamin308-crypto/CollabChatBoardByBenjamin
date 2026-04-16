import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useRoomsStore } from '@/stores/rooms'
import { useSocketStore } from '@/stores/socket'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuthStore()
  const { rooms, createRoom, fetchRooms, joinRoom, loading, error, clearError } = useRoomsStore()
  const { connect, disconnect } = useSocketStore()
  const [showCreate, setShowCreate] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)

  useEffect(() => {
    if (!token || !user) {
      navigate('/login')
      return
    }

    // Initialize socket
    connect(token)

    // Fetch rooms
    fetchRooms(token)
  }, [token, user, navigate, connect, fetchRooms])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRoom(roomName, token!)
      setRoomName('')
      setShowCreate(false)
    } catch (err) {
      // Error handled in store
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await joinRoom(inviteCode, token!)
      setInviteCode('')
      setShowJoin(false)
    } catch (err) {
      // Error handled in store
    }
  }

  const handleSelectRoom = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-300">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-950 p-4 md:flex md:flex-col">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-300">{user?.name}</p>
          </div>
          <nav className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              className="border-l-2 border-indigo-500 bg-indigo-500/20 px-4 py-3 text-left text-indigo-400 transition-all duration-200"
            >
              Dashboard
            </button>
            <button
              type="button"
              className="px-4 py-3 text-left text-gray-400 transition-all duration-200 hover:bg-white/10"
            >
              Your Rooms
            </button>
            <button
              type="button"
              className="px-4 py-3 text-left text-gray-400 transition-all duration-200 hover:bg-white/10"
            >
              + Create Room
            </button>
          </nav>
          <button
            onClick={() => {
              disconnect()
              logout()
              navigate('/')
            }}
            className="mt-auto rounded-full bg-red-500 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-red-600 hover:shadow-md"
          >
            Logout
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="rounded-b-xl border-b border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-300">Welcome, {user?.name}!</p>
              </div>
              <button
                onClick={() => {
                  disconnect()
                  logout()
                  navigate('/')
                }}
                className="rounded-full bg-red-500 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-red-600 hover:shadow-md md:hidden"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-red-100">
                <p>{error}</p>
                <button
                  onClick={clearError}
                  className="font-bold text-red-200 transition-all duration-200 hover:text-white"
                >
                  &times;
                </button>
              </div>
            )}

            <div className="mb-8 flex flex-col gap-4 md:flex-row">
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-full bg-indigo-500 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-indigo-600 hover:shadow-md"
              >
                + Create Room
              </button>
              <button
                onClick={() => setShowJoin(true)}
                className="rounded-full bg-purple-500 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-purple-600 hover:shadow-md"
              >
                + Join Room
              </button>
            </div>

            {/* Create Room Modal */}
            {showCreate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md">
                  <h2 className="mb-4 text-2xl font-bold text-white">Create Room</h2>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                      <label htmlFor="roomName" className="mb-1 block text-sm font-medium text-gray-200">
                        Room Name
                      </label>
                      <input
                        id="roomName"
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-full bg-indigo-500 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-indigo-600 hover:shadow-md disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreate(false)}
                        className="flex-1 rounded-full bg-white/10 px-6 py-2.5 font-medium text-gray-200 transition-all duration-200 hover:scale-105 hover:bg-white/20 hover:shadow-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Join Room Modal */}
            {showJoin && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md">
                  <h2 className="mb-4 text-2xl font-bold text-white">Join Room</h2>
                  <form onSubmit={handleJoinRoom} className="space-y-4">
                    <div>
                      <label htmlFor="inviteCode" className="mb-1 block text-sm font-medium text-gray-200">
                        Invite Code
                      </label>
                      <input
                        id="inviteCode"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        required
                        placeholder="Enter invite code"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-full bg-indigo-500 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-indigo-600 hover:shadow-md disabled:opacity-50"
                      >
                        {loading ? 'Joining...' : 'Join'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowJoin(false)}
                        className="flex-1 rounded-full bg-white/10 px-6 py-2.5 font-medium text-gray-200 transition-all duration-200 hover:scale-105 hover:bg-white/20 hover:shadow-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Rooms Grid */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Your Rooms</h2>
              {rooms.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/10 p-8 text-center shadow-md backdrop-blur-md">
                  <p className="text-gray-300">No rooms yet. Create one or join using an invite code!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleSelectRoom(room.id)}
                      className="cursor-pointer rounded-xl border border-white/10 bg-white/10 p-6 shadow-sm transition-all duration-200 hover:bg-white/15 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{room.name}</h3>
                          <p className="text-sm text-gray-400">Members</p>
                        </div>
                        <p className="text-3xl font-bold text-white">{room.members?.length || 0}</p>
                      </div>
                      <div className="my-4 flex flex-wrap gap-2">
                        {room.members?.slice(0, 3).map((member: any) => (
                          <div
                            key={member.userId}
                            title={member.user.name}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: member.user.avatarColor }}
                          >
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          // Copy invite code to clipboard
                          navigator.clipboard.writeText(room.inviteCode)
                          alert('Invite code copied to clipboard!')
                        }}
                        className="text-xs font-semibold text-gray-300 transition-all duration-200 hover:text-indigo-400"
                      >
                        Copy invite code
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

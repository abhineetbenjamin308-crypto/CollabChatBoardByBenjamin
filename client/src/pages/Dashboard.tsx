import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useRoomsStore } from '@/stores/rooms'
import { useSocketStore } from '@/stores/socket'
import Navbar from '@/components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const { rooms, createRoom, fetchRooms, joinRoom, loading, error, clearError } = useRoomsStore()
  const { connect } = useSocketStore()
  const [showCreate, setShowCreate] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [copyingId, setCopyingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !user) {
      navigate('/login')
      return
    }

    connect(token)
    fetchRooms(token)
  }, [token, user, navigate, connect, fetchRooms])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRoom(roomName, token!)
      setRoomName('')
      setShowCreate(false)
    } catch (err) {
      console.error('Failed to create room:', err)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await joinRoom(inviteCode, token!)
      setInviteCode('')
      setShowJoin(false)
    } catch (err) {
      console.error('Failed to join room:', err)
    }
  }

  const handleSelectRoom = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  const handleCopyCode = (e: React.MouseEvent, code: string, roomId: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopyingId(roomId)
    setTimeout(() => setCopyingId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
        {/* Welcome Section */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Your Dashboard</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Welcome back, {user?.name}. Ready to collaborate?</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-3 font-semibold text-indigo-600 transition-all hover:bg-indigo-500 hover:text-white dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join Room
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button onClick={clearError} className="text-xl font-bold">&times;</button>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleSelectRoom(room.id)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl dark:border-white/10 dark:bg-slate-900 dark:hover:border-indigo-500/30"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    {room.name}
                  </h3>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 dark:bg-white/5 dark:text-slate-400">
                    {room.members?.length || 0}
                  </div>
                </div>
                
                <div className="mt-4 flex -space-x-2">
                  {room.members?.slice(0, 5).map((member: any) => (
                    <div
                      key={member.userId}
                      className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 ring-2 ring-white transition-transform hover:z-10 hover:scale-110 dark:border-slate-900 dark:ring-slate-900"
                      style={{ backgroundColor: member.user.avatarColor }}
                      title={member.user.name}
                    />
                  ))}
                  {room.members?.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white dark:border-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-900">
                      +{room.members.length - 5}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Code:</span>
                  <span className="font-mono text-sm font-bold text-indigo-500">{room.inviteCode}</span>
                </div>
                <button
                  onClick={(e) => handleCopyCode(e, room.inviteCode, room.id)}
                  className="relative flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-indigo-500 hover:text-white dark:bg-white/5 dark:text-slate-400 dark:hover:bg-indigo-500 dark:hover:text-white"
                >
                  {copyingId === room.id ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {rooms.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-20 dark:border-white/10 dark:bg-white/5">
              <div className="rounded-full bg-slate-100 p-6 dark:bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-slate-500">No rooms found</p>
              <button onClick={() => setShowCreate(true)} className="mt-2 text-indigo-500 hover:underline">Create your first room</button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {(showCreate || showJoin) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md scale-100 overflow-hidden rounded-3xl border border-white/20 bg-white p-8 shadow-2xl transition-all dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              {showCreate ? 'Start a Session' : 'Join a Session'}
            </h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {showCreate ? 'Give your room a name to begin.' : 'Enter the invite code shared with you.'}
            </p>
            
            <form onSubmit={showCreate ? handleCreateRoom : handleJoinRoom} className="mt-8 space-y-6">
              <div>
                <label className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  {showCreate ? 'Room Name' : 'Invite Code'}
                </label>
                <input
                  autoFocus
                  type="text"
                  value={showCreate ? roomName : inviteCode}
                  onChange={(e) => showCreate ? setRoomName(e.target.value) : setInviteCode(e.target.value)}
                  required
                  placeholder={showCreate ? "Marketing Sync" : "e.g. ABC-123"}
                  className="mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-lg font-medium transition-all focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/5 dark:bg-white/5 dark:focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setShowJoin(false); }}
                  className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-slate-600 transition-all hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (showCreate ? 'Create Room' : 'Join Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

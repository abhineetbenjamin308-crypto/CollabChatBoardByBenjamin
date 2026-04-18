import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useRoomsStore } from '@/stores/rooms'
import { useSocketStore } from '@/stores/socket'
import { useChatStore } from '@/stores/chat'
import { useWhiteboardStore } from '@/stores/whiteboard'
import { SocketEvents } from '@collabchat/shared'
import Whiteboard from '@/components/Whiteboard'
import ChatPanel from '@/components/ChatPanel'
import AISidebar from '@/components/AISidebar'
import Navbar from '@/components/Navbar'

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user, token, hasPaidForAI, setHasPaidForAI } = useAuthStore()
  const { currentRoom, fetchRoom, loading } = useRoomsStore()
  const { socket, connected, emit, on, off, connect } = useSocketStore()
  const { addMessage, setMessages } = useChatStore()
  const {
    presences,
    addObject,
    clear,
    setObjects,
    addPresence,
    setPresences,
  } = useWhiteboardStore()

  const [showAI, setShowAI] = useState(false)
  const [showChatMobile, setShowChatMobile] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [roomFullError, setRoomFullError] = useState(false)

  useEffect(() => {
    if (!token || !user || !roomId) {
      navigate('/dashboard')
      return
    }

    fetchRoom(roomId, token).catch(() => {
      navigate('/dashboard')
    })
  }, [roomId, token, user, fetchRoom, navigate])

  useEffect(() => {
    if (!token) return
    if (socket && connected) return
    connect(token)
  }, [token, socket, connected, connect])

  useEffect(() => {
    if (!socket || !connected || !roomId || !currentRoom) return

    const memberCount = currentRoom.members?.length || 0
    const isAlreadyMember = currentRoom.members?.some((m: any) => m.userId === user?.id)
    
    if (memberCount >= 10 && !isAlreadyMember) {
      setRoomFullError(true)
      return
    }

    on(SocketEvents.CHAT_HISTORY, (data: any[]) => setMessages(data))
    on(SocketEvents.CHAT_MESSAGE_NEW, (m: any) => addMessage(m))
    on(SocketEvents.BOARD_STATE_INIT, (data: any) => {
      if (data.objects) setObjects(data.objects)
      if (data.presences) setPresences(data.presences)
    })
    on(SocketEvents.BOARD_OBJECT_ADD, (data: any) => data.object && addObject(data.object))
    on(SocketEvents.BOARD_CLEAR, () => clear())
    on(SocketEvents.ROOM_PRESENCE, (data: any) => addPresence(data))

    emit(SocketEvents.ROOM_JOIN, { roomId })

    return () => {
      emit(SocketEvents.ROOM_LEAVE, { roomId })
      off(SocketEvents.CHAT_HISTORY)
      off(SocketEvents.CHAT_MESSAGE_NEW)
    }
  }, [socket, connected, roomId, currentRoom, user?.id])

  const handlePurchase = () => {
    setPaymentSuccess(true)
    setTimeout(() => {
      setHasPaidForAI(true)
      setPaymentSuccess(false)
      setShowPaywall(false)
      setShowAI(true)
    }, 2000)
  }

  if (roomFullError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-xl dark:border-white/10 dark:bg-slate-900">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl dark:bg-red-900/30">🚫</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Room is Full</h1>
          <button onClick={() => navigate('/dashboard')} className="mt-8 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  if (loading || !currentRoom) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 transition-colors duration-300 dark:bg-slate-950 overflow-hidden">
      <Navbar />

      {/* Room Header Overlay */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 transition-colors dark:border-white/5 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            {currentRoom.name.charAt(0)}
          </div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px] md:max-w-none">{currentRoom.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChatMobile(!showChatMobile)}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
          >
            💬
          </button>
          <button
            onClick={() => !hasPaidForAI ? setShowPaywall(true) : setShowAI(!showAI)}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              showAI ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
            }`}
          >
            ✨ <span className="hidden sm:inline">AI</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        {/* Whiteboard Area - Grows to fill available space */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-200 dark:bg-slate-800">
          <Whiteboard roomId={roomId!} />
        </div>

        {/* Chat Panel - Sidebar on Desktop, Overlay on Mobile */}
        <div className={`
          ${showChatMobile ? 'absolute inset-0 z-50 flex' : 'hidden'} 
          md:relative md:flex md:w-80 md:border-l border-slate-200 dark:border-white/5 transition-all
        `}>
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative">
            <button 
              onClick={() => setShowChatMobile(false)}
              className="md:hidden absolute top-2 right-2 z-10 p-2 text-slate-400"
            >
              ✕
            </button>
            <ChatPanel roomId={roomId!} />
          </div>
        </div>

        {/* AI Sidebar - Similar to Chat */}
        {showAI && (
          <div className="absolute inset-0 z-50 md:relative md:flex md:w-80 md:border-l border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900">
            <button 
              onClick={() => setShowAI(false)}
              className="md:hidden absolute top-2 right-2 z-10 p-2 text-slate-400"
            >
              ✕
            </button>
            <AISidebar roomId={roomId!} />
          </div>
        )}
      </div>

      {/* Footer Presence Bar - Compact for Mobile */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-1.5 transition-colors dark:border-white/5 dark:bg-slate-900/80 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live</span>
        <div className="flex -space-x-1 overflow-x-auto no-scrollbar">
          {Array.from(presences.values()).map((p: any) => (
            <div
              key={p.userId}
              title={p.userName}
              className={`h-6 w-6 rounded-full border-2 border-white dark:border-slate-900 shrink-0 ${p.online ? 'ring-1 ring-green-500' : 'opacity-40 grayscale'}`}
              style={{ backgroundColor: p.avatarColor }}
            />
          ))}
        </div>
      </div>

      {/* AI Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Unlock AI Magic</h2>
              <button onClick={() => setShowPaywall(false)} className="text-2xl text-slate-400">&times;</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Basic', duration: '1 Month', price: '₹200', id: 'm1' },
                { label: 'Popular', duration: '6 Months', price: '₹500', id: 'm6', highlight: true },
              ].map((plan) => (
                <button 
                  key={plan.id}
                  onClick={() => handlePurchase()}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                    plan.highlight ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">{plan.duration}</p>
                    <p className="text-xs opacity-70">Full Access</p>
                  </div>
                  <span className="text-xl font-black">{plan.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

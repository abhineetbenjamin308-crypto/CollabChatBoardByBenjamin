import React, { useEffect, useState, useRef } from 'react'
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
  const { addMessage, setMessages, setTypingIndicator } = useChatStore()
  const {
    presences,
    addObject,
    updateObject,
    deleteObject,
    clear,
    setObjects,
    addPresence,
    setPresences,
  } = useWhiteboardStore()

  const [showAI, setShowAI] = useState(false)
  const [activeTab, setActiveTab] = useState<'board' | 'chat' | 'ai'>('board')
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

    // Frontend enforcement of 10 user limit
    const memberCount = currentRoom.members?.length || 0
    const isAlreadyMember = currentRoom.members?.some((m: any) => m.userId === user?.id)
    
    if (memberCount >= 10 && !isAlreadyMember) {
      setRoomFullError(true)
      return
    }

    const handleChatHistory = (data: any[]) => {
      // Basic normalization
      setMessages(data.map(m => ({
        ...m,
        id: m.id || Math.random().toString(),
        senderName: m.username || m.senderName || 'User',
        content: m.text || m.content || '',
        createdAt: m.time || m.createdAt || new Date().toISOString()
      })))
    }

    const handleNewMessage = (m: any) => {
      addMessage({
        ...m,
        id: m.id || Math.random().toString(),
        senderName: m.username || m.senderName || 'User',
        content: m.text || m.content || '',
        createdAt: m.time || m.createdAt || new Date().toISOString()
      })
    }

    on(SocketEvents.CHAT_HISTORY, handleChatHistory)
    on(SocketEvents.CHAT_MESSAGE_NEW, handleNewMessage)
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
      off(SocketEvents.CHAT_HISTORY, handleChatHistory)
      off(SocketEvents.CHAT_MESSAGE_NEW, handleNewMessage)
    }
  }, [socket, connected, roomId, currentRoom, user?.id])

  const handleAIClick = () => {
    if (!hasPaidForAI) {
      setShowPaywall(true)
    } else {
      setShowAI(!showAI)
    }
  }

  const handlePurchase = (plan: string) => {
    // Mock payment flow
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
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
            This room has reached its maximum capacity of 10 members. Please contact the owner or join a different room.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-8 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
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
    <div className="flex h-screen flex-col bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      <Navbar />

      {/* Room Header Overlay */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 transition-colors dark:border-white/5 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            {currentRoom.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{currentRoom.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono">{currentRoom.inviteCode}</span>
              <span>•</span>
              <span>{currentRoom.members?.length || 0}/10 members</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAIClick}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all ${
              showAI 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400'
            }`}
          >
            <span className="text-lg">✨</span>
            {showAI ? 'Hide AI' : 'AI Assistant'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Whiteboard Area */}
        <div className={`flex-1 flex flex-col min-w-0 ${activeTab !== 'board' ? 'hidden md:flex' : 'flex'}`}>
          <Whiteboard roomId={roomId!} />
        </div>

        {/* Chat Panel */}
        <div className={`w-80 flex-col border-l border-slate-200 transition-colors dark:border-white/5 ${activeTab !== 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <ChatPanel roomId={roomId!} />
        </div>

        {/* AI Sidebar */}
        {showAI && (
          <div className={`w-80 flex-col border-l border-slate-200 transition-colors dark:border-white/5 ${activeTab !== 'ai' ? 'hidden md:flex' : 'flex'}`}>
            <AISidebar roomId={roomId!} />
          </div>
        )}
      </div>

      {/* Footer Presence Bar */}
      <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-6 py-2 transition-colors dark:border-white/5 dark:bg-slate-900/80">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Online Now</span>
        <div className="flex -space-x-2">
          {Array.from(presences.values()).map((p: any) => (
            <div
              key={p.userId}
              title={p.userName}
              className={`h-7 w-7 rounded-full border-2 border-white transition-all hover:z-10 hover:scale-110 dark:border-slate-900 ${p.online ? 'ring-2 ring-green-500' : 'opacity-40 grayscale'}`}
              style={{ backgroundColor: p.avatarColor }}
            />
          ))}
        </div>
      </div>

      {/* AI Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-2xl transition-all dark:border-white/10 dark:bg-slate-900">
            {paymentSuccess ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-5xl text-white shadow-xl shadow-green-500/40">✓</div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white">Payment Successful!</h2>
                <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">Unlocking AI Magic for you...</p>
              </div>
            ) : (
              <div className="p-10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">Premium Feature</span>
                    <h2 className="mt-4 text-4xl font-black text-slate-900 dark:text-white">Unlock AI Assistant</h2>
                  </div>
                  <button onClick={() => setShowPaywall(false)} className="text-3xl text-slate-300 hover:text-slate-600 dark:hover:text-white">&times;</button>
                </div>
                <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
                  Get high-quality summaries, action items, and project plans generated instantly from your collaboration.
                </p>

                <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    { label: 'Basic', duration: '1 Month', price: '₹200', id: 'm1' },
                    { label: 'Popular', duration: '6 Months', price: '₹500', id: 'm6', highlight: true },
                    { label: 'Best Value', duration: '1 Year', price: '₹1000', id: 'y1' },
                  ].map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => handlePurchase(plan.id)}
                      className={`cursor-pointer flex flex-col rounded-3xl p-6 transition-all hover:scale-[1.05] ${
                        plan.highlight 
                          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40' 
                          : 'bg-slate-50 text-slate-900 dark:bg-white/5 dark:text-white'
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {plan.label}
                      </span>
                      <span className="mt-4 text-2xl font-black">{plan.duration}</span>
                      <span className={`mt-1 text-sm ${plan.highlight ? 'text-indigo-100' : 'text-slate-500'}`}>Full Access</span>
                      <div className="mt-8 flex items-baseline gap-1">
                        <span className="text-3xl font-black">{plan.price}</span>
                      </div>
                      <button className={`mt-6 w-full rounded-2xl py-3 text-sm font-bold transition-all ${
                        plan.highlight ? 'bg-white text-indigo-600 hover:bg-slate-100' : 'bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700'
                      }`}>
                        Choose Plan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

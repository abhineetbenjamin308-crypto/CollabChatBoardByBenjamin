import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/stores/chat'
import { useSocketStore } from '@/stores/socket'
import { useAuthStore } from '@/stores/auth'
import { SocketEvents } from '@collabchat/shared'

interface ChatPanelProps {
  roomId: string
}

const createClientMessageId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

export default function ChatPanel({ roomId }: ChatPanelProps) {
  const { messages, typingIndicators, addMessage, clearMessages } = useChatStore()
  const { user } = useAuthStore()
  const { emit } = useSocketStore()
  const [input, setInput] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const frame = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [messages])

  const sendMessage = () => {
    const content = input.trim()
    if (!content) return

    const clientMessageId = createClientMessageId()
    const now = new Date().toISOString()

    addMessage({
      id: clientMessageId,
      clientMessageId,
      roomId,
      senderId: user?.id ?? 'local-user',
      senderName: user?.name ?? 'You',
      senderAvatar: user?.avatarColor ?? '#4f46e5',
      content,
      type: 'text',
      createdAt: now,
      pending: true,
    })

    emit(SocketEvents.CHAT_MESSAGE_SEND, {
      roomId,
      type: 'text',
      senderId: user?.id ?? 'local-user',
      senderName: user?.name ?? 'You',
      senderAvatar: user?.avatarColor ?? '#4f46e5',
      username: user?.name ?? 'You', // Keep for backward compatibility if needed
      text: content, // Keep for backward compatibility if needed
      time: now, // Keep for backward compatibility if needed
      content,
      createdAt: now,
      clientMessageId,
    })

    setInput('')
    emit(SocketEvents.CHAT_TYPING, {
      roomId,
      isTyping: false,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const handleSendButtonClick = () => {
    sendMessage()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    sendMessage()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    emit(SocketEvents.CHAT_TYPING, {
      roomId,
      isTyping: e.target.value.length > 0,
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/15 bg-slate-900/55 font-['Inter'] shadow-lg shadow-black/10 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 light:border-slate-200 light:bg-white light:shadow-slate-200/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/10 px-4 py-3 font-semibold text-gray-100 light:bg-slate-50 light:text-slate-800">
        <span>Chat</span>
        <button 
          onClick={() => clearMessages()}
          className="text-[10px] uppercase tracking-wider text-gray-400 transition-colors hover:text-white light:text-slate-400 light:hover:text-slate-600"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isSender = msg.senderId === (user?.id ?? 'local-user')
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 py-1 ${isSender ? 'items-end' : 'items-start'}`}
                >
                  <p
                    className={`max-w-xs rounded-xl px-4 py-2.5 text-sm leading-relaxed transition-all duration-200 ${
                      isSender
                        ? 'self-end bg-indigo-500/85 text-white shadow-sm shadow-indigo-500/20'
                        : 'self-start border border-white/10 bg-white/10 text-gray-100'
                    }`}
                  >
                    {msg.content}
                  </p>
                  <div className={`flex items-center gap-2 ${isSender ? 'self-end' : 'self-start'}`}>
                    <span className="text-xs text-gray-300">{msg.senderName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Typing indicators */}
      {typingIndicators.size > 0 && (
        <div className="border-t border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-400">
          {Array.from(typingIndicators.values())
            .map((t) => t.userName)
            .join(', ')}{' '}
          {typingIndicators.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 bg-white/5 p-4">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Type a message..."
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder:text-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="button"
          onClick={handleSendButtonClick}
          disabled={!input.trim()}
          className="shrink-0 rounded-full bg-indigo-500 px-4 py-2.5 font-medium text-white shadow-sm shadow-indigo-500/25 transition-all duration-200 hover:scale-105 hover:bg-indigo-600 hover:shadow-md disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

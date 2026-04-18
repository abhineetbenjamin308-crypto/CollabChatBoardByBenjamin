import { create } from 'zustand'

interface Message {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  type: string
  createdAt: string
  clientMessageId?: string
  pending?: boolean
}

interface TypingIndicator {
  userId: string
  userName: string
  isTyping: boolean
}

interface ChatState {
  messages: Message[]
  typingIndicators: Map<string, TypingIndicator>
  loading: boolean
  error: string | null
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setTypingIndicator: (indicator: TypingIndicator) => void
  clearRoom: () => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  typingIndicators: new Map(),
  loading: false,
  error: null,

  clearMessages: () => set({ messages: [] }),

  addMessage: (message) =>
    set((state) => {
      const existingById = state.messages.findIndex((m) => m.id === message.id)
      if (existingById >= 0) {
        const nextMessages = [...state.messages]
        nextMessages[existingById] = {
          ...nextMessages[existingById],
          ...message,
          pending: false,
        }
        return { messages: nextMessages }
      }

      const clientMessageId = message.clientMessageId
      if (clientMessageId) {
        const optimisticIndex = state.messages.findIndex(
          (m) => m.clientMessageId === clientMessageId || m.id === clientMessageId
        )
        if (optimisticIndex >= 0) {
          const nextMessages = [...state.messages]
          nextMessages[optimisticIndex] = {
            ...nextMessages[optimisticIndex],
            ...message,
            pending: false,
          }
          return { messages: nextMessages }
        }
      }

      return { messages: [...state.messages, message] }
    }),

  setMessages: (messages) =>
    set({ messages }),

  setTypingIndicator: (indicator) =>
    set((state) => {
      const newMap = new Map(state.typingIndicators)
      if (indicator.isTyping) {
        newMap.set(indicator.userId, indicator)
      } else {
        newMap.delete(indicator.userId)
      }
      return { typingIndicators: newMap }
    }),

  clearRoom: () =>
    set({ messages: [], typingIndicators: new Map() }),
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SubscriptionPlan = 'monthly' | '6-months' | 'yearly'

interface Subscription {
  plan: SubscriptionPlan
  startDate: string
  endDate: string
  active: boolean
}

interface SubscriptionState {
  subscription: Subscription | null
  subscribe: (plan: SubscriptionPlan) => void
  isSubscribed: () => boolean
  checkExpiry: () => void
  cancelSubscription: () => void
}

const PLAN_DAYS: Record<SubscriptionPlan, number> = {
  'monthly': 30,
  '6-months': 180,
  'yearly': 365
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,

      subscribe: (plan: SubscriptionPlan) => {
        const now = new Date()
        const endDate = new Date()
        endDate.setDate(now.getDate() + PLAN_DAYS[plan])

        const newSub: Subscription = {
          plan,
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          active: true
        }

        set({ subscription: newSub })
      },

      isSubscribed: () => {
        const sub = get().subscription
        if (!sub || !sub.active) return false

        const now = new Date()
        const expiry = new Date(sub.endDate)
        
        if (now > expiry) {
          set({ subscription: { ...sub, active: false } })
          return false
        }
        
        return true
      },

      checkExpiry: () => {
        const sub = get().subscription
        if (sub && sub.active) {
          const now = new Date()
          const expiry = new Date(sub.endDate)
          if (now > expiry) {
            set({ subscription: { ...sub, active: false } })
          }
        }
      },

      cancelSubscription: () => {
        set({ subscription: null })
      }
    }),
    {
      name: 'subscription-storage',
    }
  )
)

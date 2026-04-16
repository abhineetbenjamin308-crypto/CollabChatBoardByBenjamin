import { create } from 'zustand'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://collabchatboardbybenjamin-production.up.railway.app'

export interface ActionItem {
  task: string
  owner: string | null
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
}

export interface AIState {
  summary: string[] | null
  decisions: string[] | null
  openQuestions: string[] | null
  actionItems: ActionItem[] | null
  diagramTitle: string | null
  diagramNodes: any[] | null
  diagramEdges: any[] | null
  planGoal: string | null
  planPhases: any[] | null
  loading: boolean
  error: string | null
  summarizeRoom: (roomId: string, token: string) => Promise<void>
  extractActions: (roomId: string, token: string) => Promise<void>
  suggestDiagram: (roomId: string, token: string) => Promise<void>
  generatePlan: (roomId: string, token: string) => Promise<void>
  clear: () => void
}

export const useAIStore = create<AIState>((set) => ({
  summary: null,
  decisions: null,
  openQuestions: null,
  actionItems: null,
  diagramTitle: null,
  diagramNodes: null,
  diagramEdges: null,
  planGoal: null,
  planPhases: null,
  loading: false,
  error: null,

  summarizeRoom: async (roomId, token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.post(
        `${API_URL}/api/ai/summarize-room`,
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      set({
        summary: data.summary,
        decisions: data.decisions,
        openQuestions: data.openQuestions,
        loading: false,
      })
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to summarize' })
    }
  },

  extractActions: async (roomId, token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.post(
        `${API_URL}/api/ai/extract-actions`,
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      set({
        actionItems: data.actionItems,
        loading: false,
      })
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to extract actions' })
    }
  },

  suggestDiagram: async (roomId, token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.post(
        `${API_URL}/api/ai/suggest-diagram`,
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      set({
        diagramTitle: data.title,
        diagramNodes: data.nodes,
        diagramEdges: data.edges,
        loading: false,
      })
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to suggest diagram' })
    }
  },

  generatePlan: async (roomId, token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.post(
        `${API_URL}/api/ai/generate-plan`,
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      set({
        planGoal: data.goal,
        planPhases: data.phases,
        loading: false,
      })
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to generate plan' })
    }
  },

  clear: () =>
    set({
      summary: null,
      decisions: null,
      openQuestions: null,
      actionItems: null,
      diagramTitle: null,
      diagramNodes: null,
      diagramEdges: null,
      planGoal: null,
      planPhases: null,
      error: null,
    }),
}))

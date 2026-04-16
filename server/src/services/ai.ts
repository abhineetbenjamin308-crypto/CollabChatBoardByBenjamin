import { prisma } from '../server.js'
import {
  SummarizeRoomResponseSchema,
  ExtractActionsResponseSchema,
  SuggestDiagramResponseSchema,
  GeneratePlanResponseSchema,
} from '@collabchat/shared'

// Mock AI responses for now - will integrate OpenAI later
const createMockSummarize = () => ({
  summary: [
    'Team discussed project scope and timeline',
    'Identified key technical challenges',
  ],
  decisions: ['Use React for frontend', 'PostgreSQL for database'],
  openQuestions: ['Budget allocation?', 'Timeline constraints?'],
})

const createMockExtractActions = () => ({
  actionItems: [
    {
      task: 'Set up development environment',
      owner: null,
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      task: 'Create API specification',
      owner: null,
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
  ],
})

const createMockSuggestDiagram = () => ({
  title: 'System Architecture',
  nodes: [
    {
      id: 'frontend',
      label: 'React Frontend',
      type: 'process' as const,
      x: 100,
      y: 100,
    },
    {
      id: 'backend',
      label: 'Express API',
      type: 'process' as const,
      x: 300,
      y: 100,
    },
    {
      id: 'db',
      label: 'PostgreSQL',
      type: 'data' as const,
      x: 500,
      y: 100,
    },
  ],
  edges: [
    {
      from: 'frontend',
      to: 'backend',
      label: 'REST/WS',
    },
    {
      from: 'backend',
      to: 'db',
      label: 'queries',
    },
  ],
})

const createMockGeneratePlan = () => ({
  goal: 'Build and launch CollabChat Board MVP',
  phases: [
    {
      name: 'Phase 1: Setup & Infrastructure',
      steps: [
        'Configure development environment',
        'Set up database and migrations',
        'Implement authentication system',
      ],
    },
    {
      name: 'Phase 2: Core Features',
      steps: [
        'Build real-time chat system',
        'Implement collaborative whiteboard',
        'Add presence tracking',
      ],
    },
    {
      name: 'Phase 3: AI & Polish',
      steps: [
        'Integrate AI assistant endpoints',
        'Polish UI and UX',
        'Performance optimization',
      ],
    },
  ],
})

export class AIService {
  static async logAction(
    roomId: string,
    userId: string,
    actionType: string,
    request: any,
    response: any
  ) {
    await prisma.aIActionLog.create({
      data: {
        roomId,
        userId,
        actionType,
        requestPayload: JSON.stringify(request),
        responsePayload: JSON.stringify(response),
      },
    })
  }

  static async summarizeRoom(roomId: string, _userId: string) {
    try {
      // Get recent messages and whiteboard data
      await prisma.message.findMany({
        where: { roomId, type: 'text' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      // For MVP: return mock response
      // TODO: Integrate OpenAI API
      const response = createMockSummarize()
      const validated = SummarizeRoomResponseSchema.parse(response)

      return validated
    } catch (error) {
      console.error('AI summarize error:', error)
      throw { statusCode: 500, message: 'Failed to summarize room' }
    }
  }

  static async extractActions(roomId: string, _userId: string) {
    try {
      await prisma.message.findMany({
        where: { roomId, type: 'text' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      // For MVP: return mock response
      // TODO: Integrate OpenAI API
      const response = createMockExtractActions()
      const validated = ExtractActionsResponseSchema.parse(response)

      return validated
    } catch (error) {
      console.error('AI extract actions error:', error)
      throw { statusCode: 500, message: 'Failed to extract actions' }
    }
  }

  static async suggestDiagram(roomId: string, _userId: string) {
    try {
      await prisma.message.findMany({
        where: { roomId, type: 'text' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      // For MVP: return mock response
      // TODO: Integrate OpenAI API
      const response = createMockSuggestDiagram()
      const validated = SuggestDiagramResponseSchema.parse(response)

      return validated
    } catch (error) {
      console.error('AI suggest diagram error:', error)
      throw { statusCode: 500, message: 'Failed to suggest diagram' }
    }
  }

  static async generatePlan(roomId: string, _userId: string) {
    try {
      await prisma.message.findMany({
        where: { roomId, type: 'text' },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })

      // For MVP: return mock response
      // TODO: Integrate OpenAI API
      const response = createMockGeneratePlan()
      const validated = GeneratePlanResponseSchema.parse(response)

      return validated
    } catch (error) {
      console.error('AI generate plan error:', error)
      throw { statusCode: 500, message: 'Failed to generate plan' }
    }
  }
}

import { z } from 'zod'

// ============ AUTH ============
export const SignupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatarColor: z.string(),
  }),
})

export type AuthToken = z.infer<typeof AuthTokenSchema>

// ============ ROOMS ============
export const CreateRoomSchema = z.object({
  name: z.string().min(1).max(100),
})

export const JoinRoomSchema = z.object({
  inviteCode: z.string(),
})

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  inviteCode: z.string(),
  ownerId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const RoomWithMembersSchema = RoomSchema.extend({
  members: z.array(z.object({
    id: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      avatarColor: z.string(),
    }),
    role: z.string(),
    joinedAt: z.string().datetime(),
  })),
})

export type Room = z.infer<typeof RoomSchema>
export type RoomWithMembers = z.infer<typeof RoomWithMembersSchema>

// ============ MESSAGES ============
export const MessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderAvatar: z.string(),
  content: z.string(),
  type: z.enum(['text', 'system']),
  createdAt: z.string().datetime(),
  clientMessageId: z.string().optional(),
})

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
})

export type Message = z.infer<typeof MessageSchema>

// ============ WHITEBOARD ============
export const WhiteboardObjectSchema = z.object({
  id: z.string(),
  type: z.string(), // path, group, rect, circle, line, text, etc
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  text: z.string().optional(),
  angle: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  points: z.array(z.number()).optional(),
})

export const WhiteboardSnapshotSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  canvasJson: z.string(),
  createdById: z.string(),
  createdAt: z.string().datetime(),
})

export type WhiteboardSnapshot = z.infer<typeof WhiteboardSnapshotSchema>

// ============ AI ============
export const SummarizeRoomResponseSchema = z.object({
  summary: z.array(z.string()),
  decisions: z.array(z.string()),
  openQuestions: z.array(z.string()),
})

export const ExtractActionsResponseSchema = z.object({
  actionItems: z.array(z.object({
    task: z.string(),
    owner: z.string().nullable(),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().datetime().nullable(),
  })),
})

export const SuggestDiagramResponseSchema = z.object({
  title: z.string(),
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['process', 'decision', 'data', 'note']),
    x: z.number(),
    y: z.number(),
  })),
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
  })),
})

export const GeneratePlanResponseSchema = z.object({
  goal: z.string(),
  phases: z.array(z.object({
    name: z.string(),
    steps: z.array(z.string()),
  })),
})

export type SummarizeRoomResponse = z.infer<typeof SummarizeRoomResponseSchema>
export type ExtractActionsResponse = z.infer<typeof ExtractActionsResponseSchema>
export type SuggestDiagramResponse = z.infer<typeof SuggestDiagramResponseSchema>
export type GeneratePlanResponse = z.infer<typeof GeneratePlanResponseSchema>

// ============ SOCKET EVENTS ============
export const SocketEvents = {
  // Room
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_PRESENCE: 'room:presence',
  ROOM_ERROR: 'room:error',

  // Chat
  CHAT_MESSAGE_SEND: 'chat:message:send',
  CHAT_MESSAGE_NEW: 'chat:message:new',
  CHAT_TYPING: 'chat:typing',
  CHAT_HISTORY: 'chat:history',

  // Board
  BOARD_CURSOR: 'board:cursor',
  BOARD_DRAW: 'board:draw',
  BOARD_OBJECT_ADD: 'board:object:add',
  BOARD_OBJECT_UPDATE: 'board:object:update',
  BOARD_OBJECT_DELETE: 'board:object:delete',
  BOARD_CLEAR: 'board:clear',
  BOARD_STATE_INIT: 'board:state:init',
  BOARD_SNAPSHOT_SAVE: 'board:snapshot:save',

  // AI
  AI_STATUS: 'ai:status',
} as const

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents]

// Socket event payloads
export const RoomJoinPayloadSchema = z.object({
  roomId: z.string(),
})

export const RoomPresencePayloadSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  avatarColor: z.string(),
  online: z.boolean(),
})

export const ChatMessageSendPayloadSchema = z.object({
  content: z.string(),
  clientMessageId: z.string().optional(),
})

export const ChatTypingPayloadSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  isTyping: z.boolean(),
})

export const ChatRealtimeMessageSchema = z.object({
  type: z.literal('chat'),
  username: z.string(),
  text: z.string(),
  time: z.string(),
  id: z.string().optional(),
  roomId: z.string().optional(),
  senderId: z.string().optional(),
  senderAvatar: z.string().optional(),
  clientMessageId: z.string().optional(),
})

export const BoardCursorPayloadSchema = z.object({
  userId: z.string(),
  x: z.number(),
  y: z.number(),
})

export const BoardDrawPayloadSchema = z.object({
  type: z.literal('draw'),
  x: z.number(),
  y: z.number(),
  prevX: z.number(),
  prevY: z.number(),
  color: z.string().optional(),
  width: z.number().optional(),
})

export const BoardObjectAddPayloadSchema = z.object({
  object: WhiteboardObjectSchema,
})

export const BoardObjectUpdatePayloadSchema = z.object({
  id: z.string(),
  updates: z.record(z.any()),
})

export const BoardObjectDeletePayloadSchema = z.object({
  id: z.string(),
})

export const BoardStateInitPayloadSchema = z.object({
  objects: z.array(WhiteboardObjectSchema),
  presences: z.array(RoomPresencePayloadSchema),
})

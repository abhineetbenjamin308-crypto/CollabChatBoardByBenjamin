import { create } from 'zustand'

interface Presence {
  userId: string
  userName: string
  avatarColor: string
  online: boolean
}

interface Cursor {
  userId: string
  x: number
  y: number
}

interface WhiteboardObject {
  id: string
  type: string
  [key: string]: any
}

interface WhiteboardState {
  objects: Map<string, WhiteboardObject>
  presences: Map<string, Presence>
  cursors: Map<string, Cursor>
  loading: boolean
  error: string | null
  addObject: (object: WhiteboardObject) => void
  updateObject: (id: string, updates: any) => void
  deleteObject: (id: string) => void
  setObjects: (objects: WhiteboardObject[]) => void
  addPresence: (presence: Presence) => void
  setPresences: (presences: Presence[]) => void
  setCursor: (userId: string, cursor: Cursor) => void
  clearCursor: (userId: string) => void
  clear: () => void
  clearRoom: () => void
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  objects: new Map(),
  presences: new Map(),
  cursors: new Map(),
  loading: false,
  error: null,

  addObject: (object) =>
    set((state) => {
      const newObjects = new Map(state.objects)
      newObjects.set(object.id, object)
      return { objects: newObjects }
    }),

  updateObject: (id, updates) =>
    set((state) => {
      const newObjects = new Map(state.objects)
      const obj = newObjects.get(id)
      if (obj) {
        newObjects.set(id, { ...obj, ...updates })
      }
      return { objects: newObjects }
    }),

  deleteObject: (id) =>
    set((state) => {
      const newObjects = new Map(state.objects)
      newObjects.delete(id)
      return { objects: newObjects }
    }),

  setObjects: (objects) =>
    set({
      objects: new Map(objects.map((obj) => [obj.id, obj])),
    }),

  addPresence: (presence) =>
    set((state) => {
      const newPresences = new Map(state.presences)
      newPresences.set(presence.userId, presence)
      return { presences: newPresences }
    }),

  setPresences: (presences) =>
    set({
      presences: new Map(presences.map((p) => [p.userId, p])),
    }),

  setCursor: (userId, cursor) =>
    set((state) => {
      const newCursors = new Map(state.cursors)
      newCursors.set(userId, cursor)
      return { cursors: newCursors }
    }),

  clearCursor: (userId) =>
    set((state) => {
      const newCursors = new Map(state.cursors)
      newCursors.delete(userId)
      return { cursors: newCursors }
    }),

  clear: () =>
    set({
      objects: new Map(),
      cursors: new Map(),
    }),

  clearRoom: () =>
    set({
      objects: new Map(),
      presences: new Map(),
      cursors: new Map(),
    }),
}))

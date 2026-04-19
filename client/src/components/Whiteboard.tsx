import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { useWhiteboardStore } from '@/stores/whiteboard'
import { useSocketStore } from '@/stores/socket'
import { SocketEvents } from '@collabchat/shared'

interface WhiteboardProps {
  roomId: string
}

type Tool = 'select' | 'pen' | 'eraser' | 'rect' | 'circle' | 'line'

const DRAW_TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖️' },
  { id: 'pen', label: 'Pencil', icon: '✏️' },
  { id: 'eraser', label: 'Eraser', icon: '🧽' },
  { id: 'rect', label: 'Rectangle', icon: '⬛' },
  { id: 'circle', label: 'Circle', icon: '⭕' },
  { id: 'line', label: 'Line', icon: '📏' },
]

const COLORS = [
  '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
  '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'
]

// CORE REQUIREMENT: Fixed logical canvas dimensions for 100% sync consistency
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800

function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  } as T;
}

export default function Whiteboard({ roomId }: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(3)
  
  const addObject = useWhiteboardStore(state => state.addObject)
  const clearStore = useWhiteboardStore(state => state.clear)
  const { emit, on, off } = useSocketStore()

  // 1. INITIALIZATION: Run ONLY ONCE on mount
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return

    // Handle high-DPI (Retina) screens natively
    // @ts-expect-error - fabric 5.x types might not expose this directly but it exists
    fabric.devicePixelRatio = window.devicePixelRatio || 1

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true, // Prevents z-index jumping during collaboration
    })

    fabricCanvasRef.current = canvas

    // Responsive scaling logic that preserves internal 1200x800 coordinate system
    const updateDimensions = () => {
      if (!containerRef.current) return
      const { clientWidth, clientHeight } = containerRef.current
      
      const scaleX = clientWidth / CANVAS_WIDTH
      const scaleY = clientHeight / CANVAS_HEIGHT
      const scale = Math.min(scaleX, scaleY) * 0.98 // 2% padding

      // Set physical size for the DOM elements
      canvas.setWidth(CANVAS_WIDTH * scale)
      canvas.setHeight(CANVAS_HEIGHT * scale)
      
      // Set logical zoom so coordinates map accurately to exactly 1200x800
      canvas.setZoom(scale)
      canvas.calcOffset()
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    updateDimensions()

    // Remote Sync - Broadcast added objects incrementally
    canvas.on('object:added', (e: any) => {
      const target = e.target
      if (!target || target._remote) return
      
      if (!target.id) target.set('id', `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      
      // canvas.toJSON cleanly preserves identical logical bounds mapping on all clients
      const objData = target.toObject(['id', 'selectable', 'evented'])
      addObject(objData)
      emit(SocketEvents.BOARD_OBJECT_ADD, { roomId, object: objData })
    })

    canvas.on('object:modified', (e: any) => {
      const target = e.target
      if (!target || target._remote) return
      const updates = target.toObject(['id'])
      emit(SocketEvents.BOARD_OBJECT_UPDATE, { roomId, id: target.id, updates })
    })

    // Pointer presence sync (normalized 0-1 range for reliable cursors)
    const syncPointer = throttle((e: fabric.IEvent) => {
      const pointer = canvas.getPointer(e.e)
      emit(SocketEvents.BOARD_CURSOR, {
        roomId,
        x: pointer.x / CANVAS_WIDTH,
        y: pointer.y / CANVAS_HEIGHT,
      })
    }, 50)

    canvas.on('mouse:move', syncPointer)

    // Initial Hydration from DB Snapshot (Zustand Store)
    const storeObjects = Array.from(useWhiteboardStore.getState().objects.values())
    if (storeObjects && storeObjects.length > 0) {
      fabric.util.enlivenObjects(storeObjects, (enlivened: fabric.Object[]) => {
        enlivened.forEach(obj => {
          const remoteObj = obj as any
          remoteObj._remote = true
          canvas.add(obj)
        })
        canvas.renderAll()
      }, '')
    }

    return () => {
      resizeObserver.disconnect()
      canvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [roomId, emit, addObject])

  // 2. STATE REFS (Avoid re-registering handlers)
  const stateRef = useRef({ tool, color, lineWidth })
  useEffect(() => {
    stateRef.current = { tool, color, lineWidth }
  }, [tool, color, lineWidth])

  // 3. SHAPE DRAWING (Lines, Rects, Circles)
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    let isDown = false
    let origX = 0
    let origY = 0
    let activeShape: fabric.Object | null = null

    const onMouseDown = (o: fabric.IEvent) => {
      const { tool, color, lineWidth } = stateRef.current
      if (canvas.isDrawingMode || tool === 'select') return
      
      isDown = true
      const pointer = canvas.getPointer(o.e)
      origX = pointer.x
      origY = pointer.y

      if (tool === 'rect') {
        activeShape = new fabric.Rect({
          left: origX, top: origY, originX: 'left', originY: 'top',
          width: 0, height: 0, fill: 'transparent',
          stroke: color, strokeWidth: lineWidth, selectable: true,
        })
      } else if (tool === 'circle') {
        activeShape = new fabric.Circle({
          left: origX, top: origY, originX: 'left', originY: 'top',
          radius: 0, fill: 'transparent',
          stroke: color, strokeWidth: lineWidth, selectable: true,
        })
      } else if (tool === 'line') {
        activeShape = new fabric.Line([origX, origY, origX, origY], {
          stroke: color, strokeWidth: lineWidth, selectable: true,
        })
      }

      if (activeShape) {
        const shapeObj = activeShape as any
        shapeObj._remote = true // Prevents socket echo until creation is complete
        canvas.add(activeShape)
      }
    }

    const onMouseMove = (o: fabric.IEvent) => {
      if (!isDown || !activeShape) return
      const { tool } = stateRef.current
      const pointer = canvas.getPointer(o.e)

      if (tool === 'rect') {
        activeShape.set({
          width: Math.abs(origX - pointer.x),
          height: Math.abs(origY - pointer.y)
        })
        if (origX > pointer.x) activeShape.set({ left: pointer.x })
        if (origY > pointer.y) activeShape.set({ top: pointer.y })
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(origX - pointer.x, 2) + Math.pow(origY - pointer.y, 2)) / 2
        const circle = activeShape as fabric.Circle
        circle.set({ radius })
        if (origX > pointer.x) activeShape.set({ left: pointer.x })
        if (origY > pointer.y) activeShape.set({ top: pointer.y })
      } else if (tool === 'line') {
        const line = activeShape as fabric.Line
        line.set({ x2: pointer.x, y2: pointer.y })
      }

      canvas.renderAll()
    }

    const onMouseUp = () => {
      if (isDown && activeShape) {
        const shapeObj = activeShape as any
        shapeObj.setCoords()
        shapeObj._remote = false
        if (!shapeObj.id) {
          shapeObj.set('id', `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
        }
        
        const objData = shapeObj.toObject(['id', 'selectable', 'evented'])
        addObject(objData)
        emit(SocketEvents.BOARD_OBJECT_ADD, { roomId, object: objData })
      }
      isDown = false
      activeShape = null
    }

    canvas.on('mouse:down', onMouseDown)
    canvas.on('mouse:move', onMouseMove)
    canvas.on('mouse:up', onMouseUp)

    return () => {
      canvas.off('mouse:down', onMouseDown)
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)
    }
  }, [roomId, emit, addObject])

  // 4. TOOL UPDATES & PEN BRUSH
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    canvas.isDrawingMode = tool === 'pen' || tool === 'eraser'
    canvas.selection = tool === 'select'
    
    canvas.getObjects().forEach(obj => {
      obj.selectable = tool === 'select'
      obj.evented = tool === 'select'
    })

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      canvas.freeDrawingBrush.color = tool === 'eraser' ? '#ffffff' : color
      canvas.freeDrawingBrush.width = tool === 'eraser' ? 20 : lineWidth
      // Decimate optimizes real-time drawings by smoothing and discarding unnecessary vertices
      const brush = canvas.freeDrawingBrush as any
      brush.decimate = 2 
    }

    canvas.renderAll()
  }, [tool, color, lineWidth])

  // 5. REMOTE EVENT RECEIVERS
  useEffect(() => {
    const handleRemoteAdd = (data: any) => {
      const canvas = fabricCanvasRef.current
      if (!canvas || !data.object) return
      
      const existing = canvas.getObjects().find((obj: any) => (obj as any).id === data.object.id)
      if (existing) return

      fabric.util.enlivenObjects([data.object], (enlivened: fabric.Object[]) => {
        enlivened.forEach(obj => {
          const remoteObj = obj as any
          remoteObj._remote = true
          canvas.add(obj)
          remoteObj.setCoords() // Guarantee bounds are correctly calculated
        })
        canvas.renderAll()
      }, '')
    }

    const handleRemoteUpdate = (data: any) => {
      const canvas = fabricCanvasRef.current
      if (!canvas || !data.id || !data.updates) return

      const existing = canvas.getObjects().find((o: any) => o.id === data.id)
      if (existing) {
        existing.set(data.updates)
        existing.setCoords()
        canvas.renderAll()
      }
    }

    const handleClear = () => {
      fabricCanvasRef.current?.clear()
      fabricCanvasRef.current?.setBackgroundColor('#ffffff', () => fabricCanvasRef.current?.renderAll())
      clearStore()
    }

    on(SocketEvents.BOARD_OBJECT_ADD, handleRemoteAdd)
    on(SocketEvents.BOARD_OBJECT_UPDATE, handleRemoteUpdate)
    on(SocketEvents.BOARD_CLEAR, handleClear)

    return () => {
      off(SocketEvents.BOARD_OBJECT_ADD, handleRemoteAdd)
      off(SocketEvents.BOARD_OBJECT_UPDATE, handleRemoteUpdate)
      off(SocketEvents.BOARD_CLEAR, handleClear)
    }
  }, [on, off, clearStore])

  const handleClearAll = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear()
      fabricCanvasRef.current.setBackgroundColor('#ffffff', () => fabricCanvasRef.current!.renderAll())
      clearStore()
      emit(SocketEvents.BOARD_CLEAR, { roomId })
    }
  }

  const handleSave = () => {
    if (fabricCanvasRef.current) {
      // Create Database Snapshot String
      const canvasJson = JSON.stringify({ objects: fabricCanvasRef.current.getObjects().map(obj => obj.toObject(['id'])) })
      emit(SocketEvents.BOARD_SNAPSHOT_SAVE, { roomId, canvasJson })

      // Download High-Res Image
      const dataURL = fabricCanvasRef.current.toDataURL({ format: 'png', multiplier: 2 })
      const link = document.createElement('a')
      link.download = `whiteboard-${roomId}.png`
      link.href = dataURL
      link.click()
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className="flex flex-nowrap items-stretch gap-px border-b border-slate-300 bg-slate-200 p-1 dark:border-slate-800 dark:bg-slate-950 overflow-x-auto no-scrollbar shrink-0 z-10">
        <div className="flex flex-col items-center px-3 py-1 border-r border-slate-300 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-1">
            {DRAW_TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex h-8 w-8 items-center justify-center rounded border transition-all ${tool === t.id ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10'}`}
                title={t.label}
              >
                <span className="text-base">{t.icon}</span>
              </button>
            ))}
            <button onClick={handleClearAll} className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white hover:bg-red-50 dark:bg-white/5 dark:border-white/10" title="Clear All">
              <span className="text-base">🗑️</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Tools</div>
        </div>

        <div className="flex flex-col items-center px-3 py-1 border-r border-slate-300 dark:border-slate-800 shrink-0">
          <div className="flex flex-col gap-2 justify-center h-full">
            <select 
              value={lineWidth} 
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="rounded border border-slate-300 bg-white px-1 py-1 text-xs dark:bg-white/5 dark:border-white/10 font-bold"
            >
              {[1, 3, 5, 8, 12, 20].map(v => <option key={v} value={v}>{v}px</option>)}
            </select>
          </div>
          <div className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Size</div>
        </div>

        <div className="flex flex-col items-center px-3 py-1 shrink-0">
          <div className="flex gap-2">
            <div className="flex flex-col items-center justify-center mr-1">
              <div className="h-8 w-8 rounded border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
            </div>
            <div className="grid grid-cols-10 gap-0.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-4 w-4 rounded-sm border border-slate-300 dark:border-white/20 transition-transform hover:scale-110 ${color === c ? 'ring-1 ring-indigo-500' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Colors</div>
        </div>

        <div className="flex flex-col items-center px-3 py-1 border-l border-slate-300 dark:border-slate-800 shrink-0">
          <button 
            onClick={handleSave}
            className="flex flex-col items-center gap-1 p-1 hover:bg-slate-300 dark:hover:bg-white/5 rounded h-full justify-center"
          >
            <span className="text-xl">💾</span>
            <span className="text-[10px] font-bold uppercase">Save</span>
          </button>
        </div>
      </div>

      {/* Responsive centered wrapper for identical Fabric coordination */}
      <div 
        ref={containerRef}
        className="relative flex-1 bg-slate-400 dark:bg-slate-900 flex items-center justify-center overflow-hidden touch-none"
      >
        <div className="shadow-2xl bg-white transition-shadow ring-1 ring-slate-900/5">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}

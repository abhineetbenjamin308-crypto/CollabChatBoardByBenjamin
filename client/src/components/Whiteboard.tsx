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

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: containerRef.current?.clientWidth || 800,
      height: containerRef.current?.clientHeight || 600,
      backgroundColor: '#ffffff',
      selection: true,
    })

    fabricCanvasRef.current = canvas

    // Sync objects to store/socket when added
    canvas.on('object:added', (options: any) => {
      if (options.target && !options.target._remote) {
        const obj = options.target.toObject(['id'])
        if (!obj.id) obj.id = `obj_${Date.now()}`
        options.target.set('id', obj.id)
        
        addObject(obj)
        emit(SocketEvents.BOARD_OBJECT_ADD, { roomId, object: obj })
      }
    })

    // Resize Handler
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && fabricCanvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        fabricCanvasRef.current.setDimensions({
          width: clientWidth,
          height: clientHeight
        })
        fabricCanvasRef.current.calcOffset()
        fabricCanvasRef.current.renderAll()
      }
    })

    if (containerRef.current) resizeObserver.observe(containerRef.current)

    // Drawing shapes logic (persisted via closure or refs if needed, but here simple events work)
    let isDown = false
    let origX = 0
    let origY = 0
    let activeShape: fabric.Object | null = null

    const onMouseDown = (o: any) => {
      const canvas = fabricCanvasRef.current
      if (!canvas || canvas.isDrawingMode || canvas.selection) return
      
      isDown = true
      const pointer = canvas.getPointer(o.e)
      origX = pointer.x
      origY = pointer.y

      // These refs are captured in the closure, so we use the current state values
      // Note: Since this is inside an effect with empty deps, we need to handle 
      // getting the latest tool/color values. We'll move the event listeners to a 
      // separate effect or use a ref for state.
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect()
      canvas.dispose()
      fabricCanvasRef.current = null
    }
  }, []) // Empty dependency array ensures it only runs once

  // 2. STATE REFS: Keep latest values for event listeners without re-initializing canvas
  const stateRef = useRef({ tool, color, lineWidth })
  useEffect(() => {
    stateRef.current = { tool, color, lineWidth }
  }, [tool, color, lineWidth])

  // 3. EVENT LISTENERS: Update based on stateRef
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    let isDown = false
    let origX = 0
    let origY = 0
    let activeShape: fabric.Object | null = null

    const onMouseDown = (o: any) => {
      const { tool, color, lineWidth } = stateRef.current
      if (canvas.isDrawingMode || tool === 'select') return
      
      isDown = true
      const pointer = canvas.getPointer(o.e)
      origX = pointer.x
      origY = pointer.y

      if (tool === 'rect') {
        activeShape = new fabric.Rect({
          left: origX,
          top: origY,
          originX: 'left',
          originY: 'top',
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: color,
          strokeWidth: lineWidth,
          selectable: true,
        })
      } else if (tool === 'circle') {
        activeShape = new fabric.Circle({
          left: origX,
          top: origY,
          originX: 'left',
          originY: 'top',
          radius: 0,
          fill: 'transparent',
          stroke: color,
          strokeWidth: lineWidth,
          selectable: true,
        })
      } else if (tool === 'line') {
        activeShape = new fabric.Line([origX, origY, origX, origY], {
          stroke: color,
          strokeWidth: lineWidth,
          selectable: true,
        })
      }

      if (activeShape) canvas.add(activeShape)
    }

    const onMouseMove = (o: any) => {
      if (!isDown || !activeShape) return
      const { tool } = stateRef.current
      const pointer = canvas.getPointer(o.e)

      if (tool === 'rect') {
        if (origX > pointer.x) activeShape.set({ left: Math.abs(pointer.x) })
        if (origY > pointer.y) activeShape.set({ top: Math.abs(pointer.y) })
        activeShape.set({ width: Math.abs(origX - pointer.x) })
        activeShape.set({ height: Math.abs(origY - pointer.y) })
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(origX - pointer.x, 2) + Math.pow(origY - pointer.y, 2)) / 2
        if (origX > pointer.x) activeShape.set({ left: Math.abs(pointer.x) })
        if (origY > pointer.y) activeShape.set({ top: Math.abs(pointer.y) })
        ;(activeShape as fabric.Circle).set({ radius: radius })
      } else if (tool === 'line') {
        ;(activeShape as fabric.Line).set({ x2: pointer.x, y2: pointer.y })
      }

      canvas.renderAll()
    }

    const onMouseUp = () => {
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
  }, [roomId]) // Only reset listeners if roomId changes

  // 4. TOOL UPDATES: Separate effect for tool/color/width
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    canvas.isDrawingMode = tool === 'pen' || tool === 'eraser'
    canvas.selection = tool === 'select'
    
    // Ensure all objects are selectable if tool is select
    canvas.getObjects().forEach(obj => {
      obj.selectable = tool === 'select'
      obj.evented = tool === 'select'
    })

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      canvas.freeDrawingBrush.color = tool === 'eraser' ? '#ffffff' : color
      canvas.freeDrawingBrush.width = tool === 'eraser' ? 20 : lineWidth
    }

    canvas.renderAll()
  }, [tool, color, lineWidth])

  // 5. REMOTE UPDATES
  useEffect(() => {
    const handleRemoteAdd = (data: any) => {
      if (!fabricCanvasRef.current || !data.object) return
      const exists = fabricCanvasRef.current.getObjects().some((obj: any) => obj.id === data.object.id)
      if (exists) return

      fabric.util.enlivenObjects([data.object], (objects: any[]) => {
        objects.forEach(obj => {
          obj._remote = true
          fabricCanvasRef.current?.add(obj)
        })
      }, '')
    }

    const handleClear = () => {
      fabricCanvasRef.current?.clear()
      fabricCanvasRef.current?.setBackgroundColor('#ffffff', () => fabricCanvasRef.current?.renderAll())
      clearStore()
    }

    on(SocketEvents.BOARD_OBJECT_ADD, handleRemoteAdd)
    on(SocketEvents.BOARD_CLEAR, handleClear)

    return () => {
      off(SocketEvents.BOARD_OBJECT_ADD, handleRemoteAdd)
      off(SocketEvents.BOARD_CLEAR, handleClear)
    }
  }, [on, off, clearStore])

  const handleClearAll = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear()
      fabricCanvasRef.current.setBackgroundColor('#ffffff', () => fabricCanvasRef.current.renderAll())
      clearStore()
      emit(SocketEvents.BOARD_CLEAR, { roomId })
    }
  }

  const handleSave = () => {
    if (fabricCanvasRef.current) {
      const dataURL = fabricCanvasRef.current.toDataURL({ format: 'png' })
      const link = document.createElement('a')
      link.download = `whiteboard-${roomId}.png`
      link.href = dataURL
      link.click()
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Ribbon */}
      <div className="flex flex-nowrap items-stretch gap-px border-b border-slate-300 bg-slate-200 p-1 dark:border-slate-800 dark:bg-slate-950 overflow-x-auto no-scrollbar shrink-0">
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

      <div 
        ref={containerRef}
        className="relative flex-1 bg-slate-200 dark:bg-slate-800 overflow-hidden touch-none"
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

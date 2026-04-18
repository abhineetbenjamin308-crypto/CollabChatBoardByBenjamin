import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWhiteboardStore } from '@/stores/whiteboard'
import { useSocketStore } from '@/stores/socket'
import { SocketEvents } from '@collabchat/shared'

interface WhiteboardProps {
  roomId: string
}

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'line'

const DRAW_TOOLS: { id: Tool; label: string; icon: string }[] = [
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

const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

export default function Whiteboard({ roomId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(3)
  
  const objects = useWhiteboardStore(state => state.objects)
  const setObjects = useWhiteboardStore(state => state.setObjects)
  const addObject = useWhiteboardStore(state => state.addObject)
  const clear = useWhiteboardStore(state => state.clear)
  
  const { emit, on, off } = useSocketStore()
  const objectsList = useMemo(() => Array.from(objects.values()), [objects])
  
  const isDrawing = useRef(false)
  const startPos = useRef<{x: number, y: number} | null>(null)
  const pendingObjectRef = useRef<any | null>(null)
  const canvasRectRef = useRef<DOMRect | null>(null)
  const requestedFrameRef = useRef<boolean>(false)

  useEffect(() => {
    const handleInit = (data: any) => data?.objects && setObjects(data.objects)
    const handleObjectAdd = (data: any) => data?.object && addObject(data.object)
    const handleClear = () => clear()

    on(SocketEvents.BOARD_STATE_INIT, handleInit)
    on(SocketEvents.BOARD_OBJECT_ADD, handleObjectAdd)
    on(SocketEvents.BOARD_CLEAR, handleClear)

    return () => {
      off(SocketEvents.BOARD_STATE_INIT, handleInit)
      off(SocketEvents.BOARD_OBJECT_ADD, handleObjectAdd)
      off(SocketEvents.BOARD_CLEAR, handleClear)
    }
  }, [roomId, on, off, setObjects, addObject, clear])

  const redrawBackground = useCallback(() => {
    const canvas = bgCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    objectsList.forEach((obj: any) => {
      ctx.strokeStyle = obj.stroke || '#000000'
      ctx.fillStyle = obj.fill || 'transparent'
      ctx.lineWidth = obj.strokeWidth || 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      
      if (obj.type === 'path' && obj.points) {
        ctx.moveTo(obj.points[0] * width, obj.points[1] * height)
        for (let i = 2; i < obj.points.length; i += 2) ctx.lineTo(obj.points[i] * width, obj.points[i + 1] * height)
        ctx.stroke()
      } else if (obj.type === 'line') {
        ctx.moveTo(obj.x * width, obj.y * height)
        ctx.lineTo((obj.width || obj.x) * width, (obj.height || obj.y) * height)
        ctx.stroke()
      } else if (obj.type === 'rect') {
        ctx.rect(obj.x * width, obj.y * height, (obj.width || 0) * width, (obj.height || 0) * height)
        if (obj.fill && obj.fill !== 'transparent') ctx.fill()
        ctx.stroke()
      } else if (obj.type === 'circle') {
        const r = (obj.width || 0) * Math.max(width, height)
        ctx.arc(obj.x * width, obj.y * height, r, 0, 2 * Math.PI)
        if (obj.fill && obj.fill !== 'transparent') ctx.fill()
        ctx.stroke()
      }
    })
  }, [objectsList])

  const redrawForeground = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    ctx.clearRect(0, 0, width, height)

    if (pendingObjectRef.current) {
      const obj = pendingObjectRef.current
      ctx.strokeStyle = obj.stroke
      ctx.fillStyle = obj.fill || 'transparent'
      ctx.lineWidth = obj.strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      if (obj.type === 'path') {
        ctx.moveTo(obj.points[0] * width, obj.points[1] * height)
        for (let i = 2; i < obj.points.length; i += 2) ctx.lineTo(obj.points[i] * width, obj.points[i + 1] * height)
        ctx.stroke()
      } else if (obj.type === 'line') {
        ctx.moveTo(obj.x * width, obj.y * height)
        ctx.lineTo((obj.width || obj.x) * width, (obj.height || obj.y) * height)
        ctx.stroke()
      } else if (obj.type === 'rect') {
        ctx.rect(obj.x * width, obj.y * height, (obj.width || 0) * width, (obj.height || 0) * height)
        ctx.stroke()
      } else if (obj.type === 'circle') {
        const r = (obj.width || 0) * Math.max(width, height)
        ctx.arc(obj.x * width, obj.y * height, r, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
    requestedFrameRef.current = false
  }, [])

  useEffect(() => {
    const resize = () => {
      const container = canvasContainerRef.current
      if (!container || !canvasRef.current || !bgCanvasRef.current) return
      const rect = container.getBoundingClientRect()
      canvasRectRef.current = rect
      const dpr = window.devicePixelRatio || 1
      
      canvasRef.current.width = rect.width * dpr
      canvasRef.current.height = rect.height * dpr
      bgCanvasRef.current.width = rect.width * dpr
      bgCanvasRef.current.height = rect.height * dpr
      
      canvasRef.current.getContext('2d')?.scale(dpr, dpr)
      bgCanvasRef.current.getContext('2d')?.scale(dpr, dpr)
      redrawBackground()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [redrawBackground])

  useEffect(() => redrawBackground(), [objectsList, redrawBackground])

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRectRef.current
    if (!rect) return
    isDrawing.current = true
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    startPos.current = { x: nx, y: ny }
    
    const strokeColor = tool === 'eraser' ? '#ffffff' : color
    const strokeWidth = tool === 'eraser' ? 20 : lineWidth

    pendingObjectRef.current = tool === 'pen' || tool === 'eraser' 
      ? { id: generateId(), type: 'path', x: 0, y: 0, stroke: strokeColor, strokeWidth, points: [nx, ny] }
      : { id: generateId(), type: tool, x: nx, y: ny, stroke: strokeColor, strokeWidth, fill: 'transparent' }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current || !pendingObjectRef.current || !canvasRectRef.current) return
    const rect = canvasRectRef.current
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    const obj = pendingObjectRef.current

    if (obj.type === 'path') {
      obj.points.push(nx, ny)
    } else if (obj.type === 'line') {
      obj.width = nx
      obj.height = ny
    } else if (obj.type === 'rect') {
      obj.x = Math.min(startPos.current!.x, nx)
      obj.y = Math.min(startPos.current!.y, ny)
      obj.width = Math.abs(nx - startPos.current!.x)
      obj.height = Math.abs(ny - startPos.current!.y)
    } else if (obj.type === 'circle') {
      obj.width = Math.sqrt(Math.pow(nx - startPos.current!.x, 2) + Math.pow(ny - startPos.current!.y, 2))
    }
    
    if (!requestedFrameRef.current) {
      requestedFrameRef.current = true
      requestAnimationFrame(redrawForeground)
    }
  }

  const handlePointerUp = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (pendingObjectRef.current) {
      addObject(pendingObjectRef.current)
      emit(SocketEvents.BOARD_OBJECT_ADD, { roomId, object: pendingObjectRef.current })
      pendingObjectRef.current = null
      redrawForeground()
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* MS Paint Style Ribbon */}
      <div className="flex flex-wrap items-stretch gap-px border-b border-slate-300 bg-slate-200 p-1 dark:border-slate-800 dark:bg-slate-950">
        
        {/* Clipboard Section */}
        <div className="flex flex-col items-center justify-between px-3 py-1 border-r border-slate-300 dark:border-slate-800">
          <button onClick={() => {}} className="flex flex-col items-center gap-1 p-1 hover:bg-slate-300 dark:hover:bg-white/5 rounded">
            <span className="text-xl">📋</span>
            <span className="text-[10px] font-medium uppercase">Paste</span>
          </button>
          <div className="text-[10px] text-slate-500 uppercase mt-auto">Clipboard</div>
        </div>

        {/* Tools Section */}
        <div className="flex flex-col items-center px-3 py-1 border-r border-slate-300 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-1">
            {DRAW_TOOLS.slice(0, 3).map(t => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex h-7 w-7 items-center justify-center rounded border transition-all ${tool === t.id ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10'}`}
                title={t.label}
              >
                <span className="text-sm">{t.icon}</span>
              </button>
            ))}
            {DRAW_TOOLS.slice(3).map(t => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex h-7 w-7 items-center justify-center rounded border transition-all ${tool === t.id ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10'}`}
                title={t.label}
              >
                <span className="text-sm">{t.icon}</span>
              </button>
            ))}
            <button onClick={() => clear()} className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white hover:bg-red-50 dark:bg-white/5 dark:border-white/10" title="Clear All">
              <span className="text-sm">🗑️</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-500 uppercase mt-auto">Tools</div>
        </div>

        {/* Brushes/Size Section */}
        <div className="flex flex-col items-center px-3 py-1 border-r border-slate-300 dark:border-slate-800">
          <div className="flex flex-col gap-2">
            <select 
              value={lineWidth} 
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs dark:bg-white/5 dark:border-white/10"
            >
              <option value="1">1px</option>
              <option value="3">3px</option>
              <option value="5">5px</option>
              <option value="8">8px</option>
              <option value="12">12px</option>
            </select>
            <div className="h-1 w-full bg-slate-400 rounded" style={{ height: lineWidth / 2 + 'px' }} />
          </div>
          <div className="text-[10px] text-slate-500 uppercase mt-auto">Size</div>
        </div>

        {/* Colors Section */}
        <div className="flex flex-col items-center px-3 py-1 flex-1">
          <div className="flex flex-wrap gap-1 max-w-[240px]">
            <div className="flex flex-col items-center justify-center mr-2 border-r pr-2 border-slate-300 dark:border-slate-800">
              <div className="h-8 w-8 rounded border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-[10px] mt-1 uppercase">Color 1</span>
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
          <div className="text-[10px] text-slate-500 uppercase mt-auto">Colors</div>
        </div>

        {/* Save/Actions Section */}
        <div className="flex flex-col items-center px-3 py-1 border-l border-slate-300 dark:border-slate-800">
          <button 
            onClick={() => {
              const canvas = bgCanvasRef.current;
              if (canvas) {
                const link = document.createElement('a');
                link.download = 'whiteboard.png';
                link.href = canvas.toDataURL();
                link.click();
              }
            }}
            className="flex flex-col items-center gap-1 p-1 hover:bg-slate-300 dark:hover:bg-white/5 rounded"
          >
            <span className="text-xl">💾</span>
            <span className="text-[10px] font-medium uppercase">Save</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasContainerRef}
        className="relative flex-1 bg-slate-300 dark:bg-slate-800 p-4 overflow-auto"
      >
        <div className="relative mx-auto bg-white shadow-2xl" style={{ width: '100%', height: '100%', minWidth: '800px', minHeight: '600px' }}>
          <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full" />
          <canvas 
            ref={canvasRef} 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none" 
          />
        </div>
      </div>
    </div>
  )
}

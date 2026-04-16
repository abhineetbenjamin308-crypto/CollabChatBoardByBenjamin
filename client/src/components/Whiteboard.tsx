import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWhiteboardStore } from '@/stores/whiteboard'
import { useSocketStore } from '@/stores/socket'
import { SocketEvents } from '@collabchat/shared'

interface WhiteboardProps {
  roomId: string
}

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'line'

const DRAW_TOOLS: Tool[] = ['pen', 'eraser', 'rect', 'circle', 'line']
const PEN_COLOR = '#111827'
const PEN_WIDTH = 3
const ERASER_WIDTH = 18

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `obj_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export default function Whiteboard({ roomId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  const [tool, setTool] = useState<Tool>('pen')
  
  // Optimized store subscriptions
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

  // 1. Setup Socket Listeners
  useEffect(() => {
    const handleInit = (data: any) => {
      if (data && Array.isArray(data.objects)) {
        setObjects(data.objects)
      }
    }

    const handleObjectAdd = (data: any) => {
      if (data && data.object) {
        addObject(data.object)
      }
    }

    const handleClear = () => {
      clear()
    }

    on(SocketEvents.BOARD_STATE_INIT, handleInit)
    on(SocketEvents.BOARD_OBJECT_ADD, handleObjectAdd)
    on(SocketEvents.BOARD_CLEAR, handleClear)

    emit(SocketEvents.ROOM_JOIN, { roomId })

    return () => {
      off(SocketEvents.BOARD_STATE_INIT, handleInit)
      off(SocketEvents.BOARD_OBJECT_ADD, handleObjectAdd)
      off(SocketEvents.BOARD_CLEAR, handleClear)
    }
  }, [roomId, on, off, emit, setObjects, addObject, clear])

  // 2. Redraw Functions
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

    const drawObj = (obj: any) => {
      ctx.strokeStyle = obj.stroke || '#111827'
      ctx.fillStyle = obj.fill || 'transparent'
      ctx.lineWidth = obj.strokeWidth || 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      
      if (obj.type === 'path' && obj.points && obj.points.length >= 2) {
        ctx.moveTo(obj.points[0] * width, obj.points[1] * height)
        for (let i = 2; i < obj.points.length; i += 2) {
          ctx.lineTo(obj.points[i] * width, obj.points[i + 1] * height)
        }
        ctx.stroke()
      } else if (obj.type === 'line') {
        const x1 = obj.x * width
        const y1 = obj.y * height
        const x2 = (obj.width || obj.x) * width
        const y2 = (obj.height || obj.y) * height
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      } else if (obj.type === 'rect') {
        const x = obj.x * width
        const y = obj.y * height
        const w = (obj.width || 0) * width
        const h = (obj.height || 0) * height
        ctx.rect(x, y, w, h)
        if (obj.fill && obj.fill !== 'transparent') ctx.fill()
        ctx.stroke()
      } else if (obj.type === 'circle') {
        const x = obj.x * width
        const y = obj.y * height
        const r = (obj.width || 0) * Math.max(width, height)
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        if (obj.fill && obj.fill !== 'transparent') ctx.fill()
        ctx.stroke()
      }
    }

    objectsList.forEach(drawObj)
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
      ctx.strokeStyle = obj.stroke || '#111827'
      ctx.fillStyle = obj.fill || 'transparent'
      ctx.lineWidth = obj.strokeWidth || 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      
      if (obj.type === 'path' && obj.points && obj.points.length >= 2) {
        ctx.moveTo(obj.points[0] * width, obj.points[1] * height)
        for (let i = 2; i < obj.points.length; i += 2) {
          ctx.lineTo(obj.points[i] * width, obj.points[i + 1] * height)
        }
        ctx.stroke()
      } else if (obj.type === 'line') {
        const x1 = obj.x * width
        const y1 = obj.y * height
        const x2 = (obj.width || obj.x) * width
        const y2 = (obj.height || obj.y) * height
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      } else if (obj.type === 'rect') {
        const x = obj.x * width
        const y = obj.y * height
        const w = (obj.width || 0) * width
        const h = (obj.height || 0) * height
        ctx.rect(x, y, w, h)
        if (obj.fill && obj.fill !== 'transparent') ctx.fill()
        ctx.stroke()
      } else if (obj.type === 'circle') {
        const x = obj.x * width
        const y = obj.y * height
        const r = (obj.width || 0) * Math.max(width, height)
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        if (obj.fill && obj.fill !== 'transparent') ctx.fill()
        ctx.stroke()
      }
    }
    requestedFrameRef.current = false
  }, [])

  const scheduleForegroundRedraw = useCallback(() => {
    if (requestedFrameRef.current) return
    requestedFrameRef.current = true
    requestAnimationFrame(redrawForeground)
  }, [redrawForeground])

  // 3. Handle Canvas Resize
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      const bgCanvas = bgCanvasRef.current
      const container = canvasContainerRef.current
      if (!canvas || !bgCanvas || !container) return
      
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvasRectRef.current = rect

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      bgCanvas.width = rect.width * dpr
      bgCanvas.height = rect.height * dpr

      const ctx = canvas.getContext('2d')
      const bgCtx = bgCanvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
      if (bgCtx) bgCtx.scale(dpr, dpr)

      redrawBackground()
      redrawForeground()
    }

    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    if (canvasContainerRef.current) observer.observe(canvasContainerRef.current)
    
    window.addEventListener('resize', resizeCanvas)
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      observer.disconnect()
    }
  }, [redrawBackground, redrawForeground])

  useEffect(() => {
    redrawBackground()
  }, [objectsList, redrawBackground])

  // 4. Pointer Events
  const getNormalizedPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRectRef.current) return { nx: 0, ny: 0 }
    const rect = canvasRectRef.current
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    return { nx, ny }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    
    isDrawing.current = true
    const { nx, ny } = getNormalizedPos(e)
    startPos.current = { x: nx, y: ny }

    const color = tool === 'eraser' ? '#ffffff' : PEN_COLOR
    const strokeWidth = tool === 'eraser' ? ERASER_WIDTH : PEN_WIDTH

    if (tool === 'pen' || tool === 'eraser') {
      pendingObjectRef.current = {
        id: generateId(),
        type: 'path',
        x: 0, y: 0,
        stroke: color,
        strokeWidth,
        points: [nx, ny]
      }
    } else {
      pendingObjectRef.current = {
        id: generateId(),
        type: tool,
        x: nx, y: ny,
        stroke: color,
        strokeWidth,
        fill: 'transparent',
      }
    }
    scheduleForegroundRedraw()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !pendingObjectRef.current || !startPos.current) return
    const { nx, ny } = getNormalizedPos(e)

    const obj = pendingObjectRef.current
    if (obj.type === 'path') {
      // Small optimization: only add point if it moved significantly
      const lastX = obj.points[obj.points.length - 2]
      const lastY = obj.points[obj.points.length - 1]
      const dist = Math.sqrt(Math.pow(nx - lastX, 2) + Math.pow(ny - lastY, 2))
      if (dist < 0.001) return
      obj.points.push(nx, ny)
    } else if (obj.type === 'line') {
      obj.width = nx
      obj.height = ny
    } else if (obj.type === 'rect') {
      const startX = startPos.current.x
      const startY = startPos.current.y
      obj.x = Math.min(startX, nx)
      obj.y = Math.min(startY, ny)
      obj.width = Math.abs(nx - startX)
      obj.height = Math.abs(ny - startY)
    } else if (obj.type === 'circle') {
      const startX = startPos.current.x
      const startY = startPos.current.y
      const dx = nx - startX
      const dy = ny - startY
      const radius = Math.sqrt(dx * dx + dy * dy)
      obj.width = radius
    }
    
    scheduleForegroundRedraw()
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch (err) {
        // Ignore
      }
    }

    if (!isDrawing.current || !pendingObjectRef.current) return
    isDrawing.current = false
    
    const objToSave = pendingObjectRef.current
    let shouldSave = true
    if (objToSave.type === 'path' && objToSave.points.length <= 2) shouldSave = false
    if (objToSave.type === 'rect' && objToSave.width === 0 && objToSave.height === 0) shouldSave = false

    if (shouldSave) {
      addObject(objToSave)
      emit(SocketEvents.BOARD_OBJECT_ADD, { roomId, object: objToSave })
    }
    
    pendingObjectRef.current = null
    scheduleForegroundRedraw()
  }

  // 5. Actions
  const handleClearBoard = () => {
    clear()
    emit(SocketEvents.BOARD_CLEAR, { roomId })
  }

  const handleSaveSnapshot = () => {
    const canvas = canvasRef.current
    const bgCanvas = bgCanvasRef.current
    if (!canvas || !bgCanvas) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = bgCanvas.width
    tempCanvas.height = bgCanvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCtx.drawImage(bgCanvas, 0, 0)
      tempCtx.drawImage(canvas, 0, 0)
      const link = document.createElement('a')
      link.href = tempCanvas.toDataURL('image/png')
      link.download = `whiteboard-${roomId}-${Date.now()}.png`
      link.click()
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-gray-200/10 bg-slate-900/40 p-4 font-['Inter']">
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/20 bg-gray-900/60 p-3 backdrop-blur-md shadow-lg shadow-black/10 transition-all duration-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">Tools:</span>
          {DRAW_TOOLS.map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                tool === t
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex gap-3">
          <button
            onClick={handleSaveSnapshot}
            className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-md shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/40"
          >
            Save
          </button>
          <button
            onClick={handleClearBoard}
            className="rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-6 py-2 text-sm font-medium text-white shadow-md shadow-rose-500/30 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/40"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={canvasContainerRef}
        className="relative flex min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200/20 bg-slate-900/70 shadow-lg shadow-black/20 transition-all duration-200"
        style={{ touchAction: 'none' }}
      >
        <canvas 
          ref={bgCanvasRef} 
          className="absolute inset-0 h-full w-full" 
        />
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none" 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  )
}

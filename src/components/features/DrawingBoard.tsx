import { useRef, useState, useEffect, useCallback } from 'react'
import type { ToolType } from './CanvasToolbar'

interface DrawingBoardProps {
  width: number
  height: number
  tool: ToolType
  color: string
  brushSize: number
  opacity: number
  onColorPicked?: (color: string) => void
  onAddRecentColor?: (color: string) => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

interface HistoryEntry {
  imageData: ImageData
}

export default function DrawingBoard({
  width, height, tool, color, brushSize, opacity,
  onColorPicked, onAddRecentColor, canvasRef,
}: DrawingBoardProps) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [previewImageData, setPreviewImageData] = useState<ImageData | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const bgCanvas = bgCanvasRef.current
    if (!canvas || !bgCanvas) return

    canvas.width = width
    canvas.height = height
    bgCanvas.width = width
    bgCanvas.height = height

    // White background
    const bgCtx = bgCanvas.getContext('2d')!
    bgCtx.fillStyle = '#ffffff'
    bgCtx.fillRect(0, 0, width, height)

    // Clear drawing layer
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, width, height)

    // Save initial state
    const imageData = ctx.getImageData(0, 0, width, height)
    setHistory([{ imageData }])
    setHistoryIndex(0)
  }, [width, height, canvasRef])

  const saveState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, width, height)
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ imageData })
      if (newHistory.length > 30) newHistory.shift()
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, 29))
  }, [canvasRef, width, height, historyIndex])

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (historyIndex > 0) {
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext('2d')!
          const newIndex = historyIndex - 1
          ctx.putImageData(history[newIndex].imageData, 0, 0)
          setHistoryIndex(newIndex)
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (historyIndex < history.length - 1) {
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext('2d')!
          const newIndex = historyIndex + 1
          ctx.putImageData(history[newIndex].imageData, 0, 0)
          setHistoryIndex(newIndex)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [history, historyIndex, canvasRef])

  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const setupCtx = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = opacity / 100
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    if (tool === 'eyedropper') {
      const imageData = ctx.getImageData(pos.x, pos.y, 1, 1)
      const [r, g, b] = imageData.data
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      onColorPicked?.(hex)
      return
    }

    if (tool === 'fill') {
      floodFill(ctx, Math.round(pos.x), Math.round(pos.y), color, canvas.width, canvas.height)
      saveState()
      return
    }

    if (tool === 'text') {
      const text = prompt('输入文字:')
      if (text) {
        setupCtx(ctx)
        ctx.font = `${brushSize * 2}px sans-serif`
        ctx.fillText(text, pos.x, pos.y)
        saveState()
        onAddRecentColor?.(color)
      }
      return
    }

    setIsDrawing(true)
    setStartPos(pos)

    // Save current state for shape preview
    setPreviewImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))

    if (tool === 'pen' || tool === 'eraser') {
      setupCtx(ctx)
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos) return
    const pos = getCanvasPos(e)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    if (tool === 'pen' || tool === 'eraser') {
      setupCtx(ctx)
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    } else if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      // Restore and redraw preview
      if (previewImageData) {
        ctx.putImageData(previewImageData, 0, 0)
      }
      setupCtx(ctx)
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      } else if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y)
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - startPos.x) / 2
        const ry = Math.abs(pos.y - startPos.y) / 2
        const cx = startPos.x + (pos.x - startPos.x) / 2
        const cy = startPos.y + (pos.y - startPos.y) / 2
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    setIsDrawing(false)
    setStartPos(null)
    setPreviewImageData(null)
    saveState()
    onAddRecentColor?.(color)
  }

  return (
    <div className="relative inline-block" style={{ width: '100%', maxWidth: width }}>
      <canvas
        ref={bgCanvasRef}
        className="absolute top-0 left-0 rounded-lg"
        style={{ width: '100%', height: 'auto' }}
      />
      <canvas
        ref={canvasRef}
        className="relative rounded-lg cursor-crosshair"
        style={{ width: '100%', height: 'auto' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number, startY: number,
  fillColor: string,
  width: number, height: number
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Parse fill color
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const tempCtx = canvas.getContext('2d')!
  tempCtx.fillStyle = fillColor
  tempCtx.fillRect(0, 0, 1, 1)
  const [fr, fg, fb, fa] = tempCtx.getImageData(0, 0, 1, 1).data

  const idx = (startY * width + startX) * 4
  const sr = data[idx], sg = data[idx + 1], sb = data[idx + 2], sa = data[idx + 3]

  if (sr === fr && sg === fg && sb === fb && sa === fa) return

  const tolerance = 30
  const stack: [number, number][] = [[startX, startY]]
  const visited = new Set<number>()

  const matches = (i: number) => {
    return Math.abs(data[i] - sr) <= tolerance &&
           Math.abs(data[i + 1] - sg) <= tolerance &&
           Math.abs(data[i + 2] - sb) <= tolerance &&
           Math.abs(data[i + 3] - sa) <= tolerance
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    const key = y * width + x
    if (visited.has(key)) continue
    if (x < 0 || x >= width || y < 0 || y >= height) continue

    const i = key * 4
    if (!matches(i)) continue

    visited.add(key)
    data[i] = fr
    data[i + 1] = fg
    data[i + 2] = fb
    data[i + 3] = fa

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  ctx.putImageData(imageData, 0, 0)
}

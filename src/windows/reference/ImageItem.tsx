import { useState, useRef, useCallback, useEffect } from 'react'
import type { RefBoardItem } from '../../types/reference'

interface ImageItemProps {
  item: RefBoardItem
  imageData: string
  grayscale: boolean
  selected: boolean
  zoom: number
  onUpdate: (id: string, updates: Partial<RefBoardItem>) => void
  onRemove: (id: string) => void
  onBringToFront: (id: string) => void
  onContextMenu: (id: string, x: number, y: number) => void
}

export default function ImageItem({ item, imageData, grayscale, selected, zoom, onUpdate, onRemove, onBringToFront, onContextMenu }: ImageItemProps) {
  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, itemX: 0, itemY: 0 })
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0, aspectRatio: 1 })
  const naturalSizeRef = useRef({ width: 0, height: 0 })
  const shiftHeldRef = useRef(false)

  // 记录图片原始尺寸
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    naturalSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight }
  }, [])

  // 双击恢复原始大小
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const { width, height } = naturalSizeRef.current
    if (width > 0 && height > 0) {
      onUpdate(item.id, { width, height })
    }
  }, [item.id, onUpdate])

  // 右键菜单
  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(item.id, e.clientX, e.clientY)
  }, [item.id, onContextMenu])

  // --- 拖拽移动（考虑 zoom） ---
  const onDragStart = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.dataset.resize) return
    if (target.closest('button')) return
    if (e.button !== 0) return // 只响应左键
    e.preventDefault()
    onBringToFront(item.id)
    setDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      itemX: item.x,
      itemY: item.y,
    }
  }, [item.id, item.x, item.y, onBringToFront])

  useEffect(() => {
    if (!dragging) return
    const onMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStartRef.current.mouseX) / zoom
      const dy = (e.clientY - dragStartRef.current.mouseY) / zoom
      onUpdate(item.id, {
        x: dragStartRef.current.itemX + dx,
        y: dragStartRef.current.itemY + dy,
      })
    }
    const onMouseUp = () => setDragging(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging, item.id, onUpdate, zoom])

  // --- 等比缩放（Shift 键自由缩放） ---
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onBringToFront(item.id)
    setResizing(true)
    shiftHeldRef.current = e.shiftKey
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: item.width,
      height: item.height,
      aspectRatio: item.width / item.height,
    }
  }, [item.id, item.width, item.height, onBringToFront])

  useEffect(() => {
    if (!resizing) return
    const onMouseMove = (e: MouseEvent) => {
      shiftHeldRef.current = e.shiftKey
      const dx = (e.clientX - resizeStartRef.current.mouseX) / zoom
      const dy = (e.clientY - resizeStartRef.current.mouseY) / zoom

      if (shiftHeldRef.current) {
        // Shift 键：自由缩放
        onUpdate(item.id, {
          width: Math.max(50, resizeStartRef.current.width + dx),
          height: Math.max(40, resizeStartRef.current.height + dy),
        })
      } else {
        // 默认：等比缩放（用对角线方向的投影）
        const { aspectRatio } = resizeStartRef.current
        const newWidth = Math.max(50, resizeStartRef.current.width + dx)
        const newHeight = newWidth / aspectRatio
        if (newHeight >= 40) {
          onUpdate(item.id, { width: newWidth, height: newHeight })
        }
      }
    }
    const onMouseUp = () => setResizing(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [resizing, item.id, onUpdate, zoom])

  const isInteracting = dragging || resizing

  return (
    <div
      onMouseDown={onDragStart}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: item.zIndex,
        cursor: dragging ? 'grabbing' : 'grab',
        transition: isInteracting ? 'none' : 'box-shadow 0.2s ease, filter 0.3s ease',
        boxShadow: selected
          ? '0 4px 20px rgba(0,0,0,0.5), 0 0 0 2px rgba(139,92,246,0.7)'
          : hovering
          ? '0 4px 20px rgba(0,0,0,0.5), 0 0 0 2px rgba(139,92,246,0.4)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        userSelect: 'none',
        filter: grayscale ? 'grayscale(100%)' : 'none',
      }}
    >
      <img
        src={imageData}
        alt=""
        draggable={false}
        onLoad={handleImageLoad}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          transform: (item.flipH || item.flipV)
            ? `scaleX(${item.flipH ? -1 : 1}) scaleY(${item.flipV ? -1 : 1})`
            : undefined,
        }}
      />

      {/* 删除按钮 */}
      {hovering && !isInteracting && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: 'rgba(239,68,68,0.8)',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >×</button>
      )}

      {/* 缩放手柄 */}
      <div
        data-resize="true"
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 20,
          height: 20,
          cursor: 'nwse-resize',
          background: hovering ? 'linear-gradient(135deg, transparent 40%, rgba(139,92,246,0.7) 40%)' : 'transparent',
          transition: 'background 0.2s ease',
        }}
      />

      {/* 尺寸指示 */}
      {isInteracting && (
        <div style={{
          position: 'absolute',
          bottom: 2,
          left: 2,
          padding: '1px 4px',
          borderRadius: 3,
          background: 'rgba(0,0,0,0.7)',
          color: '#ccc',
          fontSize: 10,
          pointerEvents: 'none',
        }}>{Math.round(item.width)}×{Math.round(item.height)}</div>
      )}
    </div>
  )
}

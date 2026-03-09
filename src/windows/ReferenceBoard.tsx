import { useState, useEffect, useCallback, useRef } from 'react'
import type { RefBoardItem, ReferenceBoard as RefBoard, ArtworkForPicker } from '../types/reference'
import BoardToolbar from './reference/BoardToolbar'
import ImageItem from './reference/ImageItem'
import ImagePicker from './reference/ImagePicker'
import ContextMenu from './reference/ContextMenu'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetItemId: string | null
}

export default function ReferenceBoard() {
  const [items, setItems] = useState<RefBoardItem[]>([])
  const [imageDataMap, setImageDataMap] = useState<Record<string, string>>({})
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [grayscale, setGrayscale] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, targetItemId: null,
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const boardDataRef = useRef<RefBoard>({ items: [], alwaysOnTop: false })
  const panStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // 加载画板
  useEffect(() => {
    const load = async () => {
      if (!window.referenceAPI) return
      const board = await window.referenceAPI.loadBoard()
      boardDataRef.current = board
      setItems(board.items || [])
      setAlwaysOnTop(board.alwaysOnTop || false)
      setPanX(board.panX || 0)
      setPanY(board.panY || 0)
      setZoom(board.zoom || 1)

      const dataMap: Record<string, string> = {}
      for (const item of board.items || []) {
        if (item.filePath) {
          const data = await window.referenceAPI.readImage(item.filePath)
          if (data) dataMap[item.id] = data
        }
      }
      setImageDataMap(dataMap)
    }
    load()
  }, [])

  // 防抖保存
  const debouncedSave = useCallback((newItems: RefBoardItem[], extraFields?: Partial<RefBoard>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (!window.referenceAPI) return
      const board: RefBoard = {
        ...boardDataRef.current,
        items: newItems,
        ...extraFields,
      }
      boardDataRef.current = board
      window.referenceAPI.saveBoard(board)
    }, 500)
  }, [])

  // 保存 pan/zoom
  const savePanZoom = useCallback((px: number, py: number, z: number, currentItems?: RefBoardItem[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (!window.referenceAPI) return
      const board: RefBoard = {
        ...boardDataRef.current,
        items: currentItems || boardDataRef.current.items,
        panX: px,
        panY: py,
        zoom: z,
      }
      boardDataRef.current = board
      window.referenceAPI.saveBoard(board)
    }, 500)
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<RefBoardItem>) => {
    setItems(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updates } : item)
      debouncedSave(next)
      return next
    })
  }, [debouncedSave])

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(item => item.id !== id)
      debouncedSave(next)
      return next
    })
    setImageDataMap(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (selectedItemId === id) setSelectedItemId(null)
  }, [debouncedSave, selectedItemId])

  const bringToFront = useCallback((id: string) => {
    setItems(prev => {
      const maxZ = Math.max(...prev.map(i => i.zIndex), 0)
      const target = prev.find(i => i.id === id)
      if (target && target.zIndex === maxZ) return prev
      const next = prev.map(item => item.id === id ? { ...item, zIndex: maxZ + 1 } : item)
      debouncedSave(next)
      return next
    })
    setSelectedItemId(id)
  }, [debouncedSave])

  const addFromPicker = useCallback((artwork: ArtworkForPicker) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 6)
    const maxZ = items.length > 0 ? Math.max(...items.map(i => i.zIndex), 0) + 1 : 1
    // 将画布中心转换到画布坐标
    const canvasEl = canvasRef.current
    const cx = canvasEl ? (canvasEl.clientWidth / 2 - panX) / zoom : 200
    const cy = canvasEl ? (canvasEl.clientHeight / 2 - panY) / zoom : 200
    const newItem: RefBoardItem = {
      id,
      artworkId: artwork.id,
      filePath: artwork.filePath || '',
      x: cx - 125 + Math.random() * 50,
      y: cy - 100 + Math.random() * 50,
      width: 250,
      height: 200,
      zIndex: maxZ,
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    if (artwork.imageData) {
      setImageDataMap(prev => ({ ...prev, [id]: artwork.imageData }))
    }
    debouncedSave(newItems)
    setShowPicker(false)
  }, [items, debouncedSave, panX, panY, zoom])

  // 批量导入图片
  const batchImport = useCallback(async () => {
    if (!window.referenceAPI?.selectImages) return
    try {
      const images = await window.referenceAPI.selectImages()
      if (!images || images.length === 0) return

      const canvasEl = canvasRef.current
      const baseCx = canvasEl ? (canvasEl.clientWidth / 2 - panX) / zoom : 200
      const baseCy = canvasEl ? (canvasEl.clientHeight / 2 - panY) / zoom : 200

      setItems(prev => {
        let maxZ = prev.length > 0 ? Math.max(...prev.map(i => i.zIndex), 0) : 0
        const newItems = [...prev]
        const newDataMap: Record<string, string> = {}

        images.forEach((img, idx) => {
          maxZ++
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 6) + idx
          const offsetX = (idx % 4) * 30 - 45
          const offsetY = Math.floor(idx / 4) * 30 - 45
          const newItem: RefBoardItem = {
            id,
            artworkId: '',
            filePath: img.filePath,
            x: baseCx - 125 + offsetX,
            y: baseCy - 100 + offsetY,
            width: 250,
            height: 200,
            zIndex: maxZ,
          }
          newItems.push(newItem)
          newDataMap[id] = img.imageData
        })

        debouncedSave(newItems)
        // 更新 imageDataMap（在 setState 回调外处理）
        setTimeout(() => {
          setImageDataMap(prev => ({ ...prev, ...newDataMap }))
        }, 0)
        return newItems
      })
    } catch { /* batch import failed */ }
  }, [panX, panY, zoom, debouncedSave])

  const toggleAlwaysOnTop = useCallback(async () => {
    const next = !alwaysOnTop
    setAlwaysOnTop(next)
    if (window.referenceAPI) {
      await window.referenceAPI.toggleAlwaysOnTop(next)
    }
    boardDataRef.current.alwaysOnTop = next
  }, [alwaysOnTop])

  // 滚轮缩放（以鼠标位置为中心）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor))

      // 保持鼠标指向的画布点不变
      const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom)
      const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom)

      setZoom(newZoom)
      setPanX(newPanX)
      setPanY(newPanY)
      savePanZoom(newPanX, newPanY, newZoom)
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [zoom, panX, panY, savePanZoom])

  // 中键 / 右键 / 空格+左键 拖拽平移
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      // 中键 或 右键 或 空格+左键
      if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceHeld)) {
        e.preventDefault()
        setIsPanning(true)
        panStartRef.current = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          panX,
          panY,
        }
      }
    }
    canvas.addEventListener('mousedown', handleMouseDown)
    return () => canvas.removeEventListener('mousedown', handleMouseDown)
  }, [panX, panY, spaceHeld])

  useEffect(() => {
    if (!isPanning) return
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStartRef.current.mouseX
      const dy = e.clientY - panStartRef.current.mouseY
      const newPanX = panStartRef.current.panX + dx
      const newPanY = panStartRef.current.panY + dy
      setPanX(newPanX)
      setPanY(newPanY)
    }
    const onMouseUp = () => {
      setIsPanning(false)
      savePanZoom(panX, panY, zoom)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isPanning, panX, panY, zoom, savePanZoom])

  // 禁用画布右键默认菜单
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handler = (e: MouseEvent) => e.preventDefault()
    canvas.addEventListener('contextmenu', handler)
    return () => canvas.removeEventListener('contextmenu', handler)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // 空格键（用于平移）
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setSpaceHeld(true)
        return
      }

      // Ctrl+V 粘贴
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        if (!window.referenceAPI?.pasteFromClipboard) return
        try {
          const result = await window.referenceAPI.pasteFromClipboard()
          if (!result.success || !result.artwork) return
          const id = Date.now().toString() + Math.random().toString(36).substr(2, 6)
          const maxZ = items.length > 0 ? Math.max(...items.map(i => i.zIndex), 0) + 1 : 1
          const canvasEl = canvasRef.current
          const cx = canvasEl ? (canvasEl.clientWidth / 2 - panX) / zoom : 200
          const cy = canvasEl ? (canvasEl.clientHeight / 2 - panY) / zoom : 200
          const newItem: RefBoardItem = {
            id,
            artworkId: result.artwork.id,
            filePath: result.artwork.filePath,
            x: cx - 125,
            y: cy - 100,
            width: 250,
            height: 200,
            zIndex: maxZ,
          }
          setItems(prev => {
            const next = [...prev, newItem]
            debouncedSave(next)
            return next
          })
          if (result.imageData) {
            setImageDataMap(prev => ({ ...prev, [id]: result.imageData! }))
          }
        } catch { /* clipboard read failed */ }
        return
      }

      // Delete / Backspace 删除选中
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        e.preventDefault()
        removeItem(selectedItemId)
        return
      }

      // Ctrl+0 重置缩放
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setZoom(1)
        setPanX(0)
        setPanY(0)
        savePanZoom(0, 0, 1)
        return
      }

      // Ctrl+Shift+F 全部适应
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        fitAll()
        return
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceHeld(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [items, selectedItemId, panX, panY, zoom, debouncedSave, removeItem, savePanZoom])

  // 适应全部
  const fitAll = useCallback(() => {
    if (items.length === 0) return
    const canvasEl = canvasRef.current
    if (!canvasEl) return

    const minX = Math.min(...items.map(i => i.x))
    const minY = Math.min(...items.map(i => i.y))
    const maxX = Math.max(...items.map(i => i.x + i.width))
    const maxY = Math.max(...items.map(i => i.y + i.height))

    const bboxW = maxX - minX
    const bboxH = maxY - minY
    if (bboxW === 0 || bboxH === 0) return

    const padding = 40
    const cw = canvasEl.clientWidth - padding * 2
    const ch = canvasEl.clientHeight - padding * 2

    const newZoom = Math.min(cw / bboxW, ch / bboxH, 2)
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const newPanX = canvasEl.clientWidth / 2 - centerX * newZoom
    const newPanY = canvasEl.clientHeight / 2 - centerY * newZoom

    setZoom(newZoom)
    setPanX(newPanX)
    setPanY(newPanY)
    savePanZoom(newPanX, newPanY, newZoom)
  }, [items, savePanZoom])

  // 文件拖拽到画布
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleDropActual = async (e: DragEvent) => {
      e.preventDefault()
      if (!e.dataTransfer?.files?.length) return

      const file = e.dataTransfer.files[0]
      if (!file.type.startsWith('image/')) return

      const rect = canvas.getBoundingClientRect()
      const dropX = (e.clientX - rect.left - panX) / zoom
      const dropY = (e.clientY - rect.top - panY) / zoom

      const filePath = (file as File & { path?: string }).path
      if (filePath && window.referenceAPI) {
        // Electron 环境：读取图片数据
        try {
          const imageData = await window.referenceAPI.readImage(filePath)
          if (imageData) {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 6)
            const maxZ = items.length > 0 ? Math.max(...items.map(i => i.zIndex), 0) + 1 : 1
            const newItem: RefBoardItem = {
              id,
              artworkId: '',
              filePath: filePath,
              x: dropX - 125,
              y: dropY - 100,
              width: 250,
              height: 200,
              zIndex: maxZ,
            }
            setItems(prev => {
              const next = [...prev, newItem]
              debouncedSave(next)
              return next
            })
            setImageDataMap(prev => ({ ...prev, [id]: imageData }))
          }
        } catch { /* failed */ }
        return
      }

      // Fallback：通过 FileReader 读取
      const reader = new FileReader()
      reader.onload = () => {
        const imageData = reader.result as string
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 6)
        const maxZ = items.length > 0 ? Math.max(...items.map(i => i.zIndex), 0) + 1 : 1
        const newItem: RefBoardItem = {
          id,
          artworkId: '',
          filePath: '',
          x: dropX - 125,
          y: dropY - 100,
          width: 250,
          height: 200,
          zIndex: maxZ,
        }
        setItems(prev => {
          const next = [...prev, newItem]
          debouncedSave(next)
          return next
        })
        setImageDataMap(prev => ({ ...prev, [id]: imageData }))
      }
      reader.readAsDataURL(file)
    }

    canvas.addEventListener('drop', handleDropActual)
    return () => canvas.removeEventListener('drop', handleDropActual)
  }, [items, panX, panY, zoom, debouncedSave])

  // 右键菜单处理
  const handleContextMenu = useCallback((itemId: string, x: number, y: number) => {
    setContextMenu({ visible: true, x, y, targetItemId: itemId })
    setSelectedItemId(itemId)
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  // 点击空白处取消选中和关闭菜单
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement) === canvasRef.current || (e.target as HTMLElement).dataset.canvasBg === 'true') {
      setSelectedItemId(null)
      closeContextMenu()
    }
  }, [closeContextMenu])

  // 上下文菜单操作
  const handleContextMenuAction = useCallback((action: string) => {
    const itemId = contextMenu.targetItemId
    closeContextMenu()
    if (!itemId) return

    switch (action) {
      case 'delete':
        removeItem(itemId)
        break
      case 'bringToFront':
        bringToFront(itemId)
        break
      case 'actualSize':
        updateItem(itemId, { width: 250, height: 200 })
        break
      case 'flipH': {
        const targetH = items.find(i => i.id === itemId)
        if (targetH) updateItem(itemId, { flipH: !targetH.flipH })
        break
      }
      case 'flipV': {
        const targetV = items.find(i => i.id === itemId)
        if (targetV) updateItem(itemId, { flipV: !targetV.flipV })
        break
      }
      case 'fitWindow': {
        const canvasEl = canvasRef.current
        if (canvasEl) {
          const w = canvasEl.clientWidth / zoom * 0.8
          const h = canvasEl.clientHeight / zoom * 0.8
          updateItem(itemId, { width: w, height: h })
        }
        break
      }
      case 'fitAll':
        fitAll()
        break
    }
  }, [contextMenu.targetItemId, closeContextMenu, removeItem, bringToFront, updateItem, zoom, fitAll])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BoardToolbar
        alwaysOnTop={alwaysOnTop}
        grayscale={grayscale}
        zoom={zoom}
        onToggleAlwaysOnTop={toggleAlwaysOnTop}
        onToggleGrayscale={() => setGrayscale(prev => !prev)}
        onAddImage={() => setShowPicker(true)}
        onBatchImport={batchImport}
        onFitAll={fitAll}
        onResetZoom={() => { setZoom(1); setPanX(0); setPanY(0); savePanZoom(0, 0, 1) }}
      />

      {/* 画布 */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%) 0 0 / 40px 40px',
          cursor: isPanning ? 'grabbing' : spaceHeld ? 'grab' : 'default',
        }}
      >
        {items.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: '#6b7280',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 40 }}>🖼</div>
            <div style={{ fontSize: 14 }}>Ctrl+V 粘贴 / 拖入图片 / 点击「+」添加</div>
          </div>
        )}

        {/* 变换容器 */}
        <div
          data-canvas-bg="true"
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '0 0',
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          }}
        >
          {items.map(item => (
            <ImageItem
              key={item.id}
              item={item}
              imageData={imageDataMap[item.id] || ''}
              grayscale={grayscale}
              selected={selectedItemId === item.id}
              zoom={zoom}
              onUpdate={updateItem}
              onRemove={removeItem}
              onBringToFront={bringToFront}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>

        {/* 右键菜单 */}
        {contextMenu.visible && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onAction={handleContextMenuAction}
            onClose={closeContextMenu}
          />
        )}
      </div>

      {showPicker && (
        <ImagePicker
          onSelect={addFromPicker}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

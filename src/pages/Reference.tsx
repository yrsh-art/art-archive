import { useState, useEffect, useCallback, useRef } from 'react'
import { useArtworks } from '../context/ArtworkContext'

interface BoardItem {
  id: string
  artworkId: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

const STORAGE_KEY = 'art-archive-reference-board'

function loadBoardFromStorage(): BoardItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

function saveBoardToStorage(items: BoardItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

// ---- 可拖拽图片组件 ----
function DraggableImage({ item, grayscale, onUpdate, onRemove, onBringToFront }: {
  item: BoardItem
  grayscale: boolean
  onUpdate: (id: string, u: Partial<BoardItem>) => void
  onRemove: (id: string) => void
  onBringToFront: (id: string) => void
}) {
  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragRef = useRef({ mx: 0, my: 0, ix: 0, iy: 0 })
  const resRef = useRef({ mx: 0, my: 0, w: 0, h: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.resize) return
    e.preventDefault()
    onBringToFront(item.id)
    setDragging(true)
    dragRef.current = { mx: e.clientX, my: e.clientY, ix: item.x, iy: item.y }
  }, [item.id, item.x, item.y, onBringToFront])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      onUpdate(item.id, {
        x: dragRef.current.ix + e.clientX - dragRef.current.mx,
        y: dragRef.current.iy + e.clientY - dragRef.current.my,
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, item.id, onUpdate])

  const onResizeDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onBringToFront(item.id)
    setResizing(true)
    resRef.current = { mx: e.clientX, my: e.clientY, w: item.width, h: item.height }
  }, [item.id, item.width, item.height, onBringToFront])

  useEffect(() => {
    if (!resizing) return
    const onMove = (e: MouseEvent) => {
      onUpdate(item.id, {
        width: Math.max(50, resRef.current.w + e.clientX - resRef.current.mx),
        height: Math.max(40, resRef.current.h + e.clientY - resRef.current.my),
      })
    }
    const onUp = () => setResizing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [resizing, item.id, onUpdate])

  const active = dragging || resizing

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: 'absolute',
        left: item.x, top: item.y,
        width: item.width, height: item.height,
        zIndex: item.zIndex,
        cursor: dragging ? 'grabbing' : 'grab',
        transition: active ? 'none' : 'box-shadow 0.2s ease, filter 0.3s ease',
        boxShadow: hovering
          ? '0 4px 20px rgba(0,0,0,0.5), 0 0 0 2px rgba(139,92,246,0.4)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        userSelect: 'none',
        filter: grayscale ? 'grayscale(100%)' : 'none',
      }}
    >
      <img src={item.imageUrl} alt="" draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />

      {hovering && !active && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(item.id) }}
          style={{
            position: 'absolute', top: 4, right: 4,
            width: 22, height: 22, borderRadius: 11,
            background: 'rgba(239,68,68,0.8)', color: '#fff',
            border: 'none', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}
        >×</button>
      )}

      <div
        data-resize="true"
        onMouseDown={onResizeDown}
        style={{
          position: 'absolute', right: 0, bottom: 0,
          width: 20, height: 20, cursor: 'nwse-resize',
          background: hovering ? 'linear-gradient(135deg, transparent 40%, rgba(139,92,246,0.7) 40%)' : 'transparent',
          transition: 'background 0.2s ease',
        }}
      />

      {active && (
        <div style={{
          position: 'absolute', bottom: 2, left: 2,
          padding: '1px 4px', borderRadius: 3,
          background: 'rgba(0,0,0,0.7)', color: '#ccc', fontSize: 10, pointerEvents: 'none',
        }}>{Math.round(item.width)}×{Math.round(item.height)}</div>
      )}
    </div>
  )
}

// ---- 选图弹窗 ----
function ArtworkPicker({ artworks, onSelect, onClose }: {
  artworks: { id: string; title: string; imageUrl: string; tags: string[] }[]
  onSelect: (a: { id: string; title: string; imageUrl: string }) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = artworks.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return a.title.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q))
  })

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '80%', maxWidth: 700, maxHeight: '70vh',
        background: 'var(--theme-gradient-start, #1e1e3a)',
        borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--theme-primary, #a78bfa)' }}>选择素材</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '10px 16px' }}>
          <input type="text" placeholder="搜索标题/标签..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              color: '#e2e8f0', fontSize: 13, outline: 'none',
            }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              {artworks.length === 0 ? '素材库为空，请先上传素材' : '无匹配结果'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
              {filtered.map(a => (
                <div key={a.id} onClick={() => onSelect(a)}
                  className="card-hover"
                  style={{
                    aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: '2px solid transparent', position: 'relative',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-primary, rgba(139,92,246,0.6))' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
                >
                  <img src={a.imageUrl} alt={a.title} draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '4px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    fontSize: 11, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{a.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- 主页面 ----
export default function Reference() {
  const { artworks } = useArtworks()
  const [items, setItems] = useState<BoardItem[]>([])
  const [grayscale, setGrayscale] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setItems(loadBoardFromStorage())
  }, [])

  const debouncedSave = useCallback((newItems: BoardItem[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveBoardToStorage(newItems), 300)
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<BoardItem>) => {
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
  }, [debouncedSave])

  const bringToFront = useCallback((id: string) => {
    setItems(prev => {
      const maxZ = Math.max(...prev.map(i => i.zIndex), 0)
      const target = prev.find(i => i.id === id)
      if (target && target.zIndex === maxZ) return prev
      const next = prev.map(item => item.id === id ? { ...item, zIndex: maxZ + 1 } : item)
      debouncedSave(next)
      return next
    })
  }, [debouncedSave])

  const addFromPicker = useCallback((artwork: { id: string; title: string; imageUrl: string }) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 6)
    const maxZ = items.length > 0 ? Math.max(...items.map(i => i.zIndex), 0) + 1 : 1
    const newItem: BoardItem = {
      id,
      artworkId: artwork.id,
      imageUrl: artwork.imageUrl,
      x: 30 + Math.random() * 200,
      y: 30 + Math.random() * 150,
      width: 250,
      height: 200,
      zIndex: maxZ,
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    debouncedSave(newItems)
    setShowPicker(false)
  }, [items, debouncedSave])

  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'background 0.2s',
  }

  return (
    <div className="pt-20 pb-4 px-4" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div className="glass rounded-xl mb-3 px-4 py-2 flex items-center justify-between" style={{ flexShrink: 0 }}>
        <span className="text-sm font-semibold gradient-text">Reference Board</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowPicker(true)}
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          >+ 添加</button>
          <button
            onClick={() => setGrayscale(prev => !prev)}
            style={{
              ...btnStyle,
              background: grayscale ? 'rgba(107,114,128,0.4)' : 'rgba(255,255,255,0.08)',
              borderColor: grayscale ? 'rgba(107,114,128,0.6)' : 'rgba(255,255,255,0.1)',
            }}
          >{grayscale ? '🎨 彩色' : '🩶 灰度'}</button>
          {items.length > 0 && (
            <span className="text-xs text-gray-500 self-center ml-2">{items.length} 张图片</span>
          )}
        </div>
      </div>

      {/* 画布 */}
      <div className="glass rounded-xl" style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'repeating-conic-gradient(rgba(255,255,255,0.02) 0% 25%, transparent 0% 50%) 0 0 / 40px 40px',
        minHeight: 400,
      }}>
        {items.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, color: '#6b7280',
          }}>
            <div style={{ fontSize: 48 }}>🖼</div>
            <div style={{ fontSize: 15 }}>点击「+ 添加」从素材库选择图片</div>
            <div style={{ fontSize: 12, color: '#4b5563' }}>图片可以自由拖拽移动、缩放大小</div>
          </div>
        )}

        {items.map(item => (
          <DraggableImage
            key={item.id}
            item={item}
            grayscale={grayscale}
            onUpdate={updateItem}
            onRemove={removeItem}
            onBringToFront={bringToFront}
          />
        ))}
      </div>

      {showPicker && (
        <ArtworkPicker
          artworks={artworks}
          onSelect={addFromPicker}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

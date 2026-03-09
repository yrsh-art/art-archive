import { useState, useEffect } from 'react'
import type { ArtworkForPicker } from '../../types/reference'

interface ImagePickerProps {
  onSelect: (artwork: ArtworkForPicker) => void
  onClose: () => void
}

export default function ImagePicker({ onSelect, onClose }: ImagePickerProps) {
  const [artworks, setArtworks] = useState<ArtworkForPicker[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!window.referenceAPI) return
      setLoading(true)
      const list = await window.referenceAPI.getArtworks()
      setArtworks(list)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = artworks.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return a.title.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '80%',
          maxWidth: 700,
          maxHeight: '80%',
          background: '#1e1e3a',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#a78bfa' }}>选择素材</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >×</button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px' }}>
          <input
            type="text"
            placeholder="搜索标题/标签..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        {/* Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 16px 16px',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>加载中...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              {artworks.length === 0 ? '素材库为空' : '无匹配结果'}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 10,
            }}>
              {filtered.map(a => (
                <div
                  key={a.id}
                  onClick={() => onSelect(a)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    position: 'relative',
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'
                    e.currentTarget.style.transform = 'scale(1.03)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {a.imageData ? (
                    <img
                      src={a.imageData}
                      alt={a.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      draggable={false}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: 12,
                    }}>无图片</div>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '4px 6px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    fontSize: 11,
                    color: '#e2e8f0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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

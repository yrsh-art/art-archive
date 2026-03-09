import { useEffect, useRef } from 'react'

interface ContextMenuProps {
  x: number
  y: number
  onAction: (action: string) => void
  onClose: () => void
}

const menuItems = [
  { action: 'bringToFront', label: '置顶图片' },
  { action: 'flipH', label: '水平翻转' },
  { action: 'flipV', label: '垂直翻转' },
  { action: 'actualSize', label: '实际大小' },
  { action: 'fitWindow', label: '适应窗口' },
  { action: 'fitAll', label: '全部适应' },
  { action: 'delete', label: '删除图片', danger: true },
]

export default function ContextMenu({ x, y, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // 延迟绑定，防止触发右键的 mousedown 立即关闭菜单
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick)
      window.addEventListener('keydown', handleKeyDown)
    }, 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // 确保菜单不超出视口
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const el = menuRef.current
    if (rect.right > window.innerWidth) {
      el.style.left = `${x - rect.width}px`
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${y - rect.height}px`
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 99999,
        minWidth: 140,
        background: 'rgba(30, 30, 46, 0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '4px 0',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {menuItems.map((item, i) => (
        <div key={item.action}>
          {item.danger && i > 0 && (
            <div style={{
              height: 1,
              background: 'rgba(255,255,255,0.08)',
              margin: '4px 8px',
            }} />
          )}
          <button
            onClick={() => onAction(item.action)}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 14px',
              background: 'none',
              border: 'none',
              color: item.danger ? '#f87171' : '#e2e8f0',
              fontSize: 12,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = item.danger
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(139,92,246,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none'
            }}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}

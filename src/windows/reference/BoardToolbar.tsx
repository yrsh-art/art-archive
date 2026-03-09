interface BoardToolbarProps {
  alwaysOnTop: boolean
  grayscale: boolean
  zoom: number
  onToggleAlwaysOnTop: () => void
  onToggleGrayscale: () => void
  onAddImage: () => void
  onBatchImport: () => void
  onFitAll: () => void
  onResetZoom: () => void
}

export default function BoardToolbar({ alwaysOnTop, grayscale, zoom, onToggleAlwaysOnTop, onToggleGrayscale, onAddImage, onBatchImport, onFitAll, onResetZoom }: BoardToolbarProps) {
  const btnBase: React.CSSProperties = {
    WebkitAppRegion: 'no-drag' as never,
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    padding: '1px 5px',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 11,
    lineHeight: '18px',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  }

  const controlBtn: React.CSSProperties = {
    WebkitAppRegion: 'no-drag' as never,
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: 13,
    width: 20,
    height: 20,
    borderRadius: 3,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '2px 4px',
      background: 'rgba(0,0,0,0.3)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      WebkitAppRegion: 'drag' as never,
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* 操作按钮 */}
      <button onClick={onAddImage}
        style={{ ...btnBase, background: 'rgba(255,255,255,0.08)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        title="添加图片"
      >+</button>

      <button onClick={onBatchImport}
        style={{ ...btnBase, background: 'rgba(255,255,255,0.08)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        title="批量导入图片"
      >📂</button>

      <button onClick={onToggleGrayscale}
        style={{
          ...btnBase,
          background: grayscale ? 'rgba(107,114,128,0.4)' : 'rgba(255,255,255,0.08)',
          borderColor: grayscale ? 'rgba(107,114,128,0.6)' : 'rgba(255,255,255,0.1)',
        }}
        title={grayscale ? '恢复彩色' : '灰度显示'}
      >{grayscale ? '🎨' : '🩶'}</button>

      <button onClick={onToggleAlwaysOnTop}
        style={{
          ...btnBase,
          background: alwaysOnTop ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)',
          borderColor: alwaysOnTop ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)',
        }}
        title={alwaysOnTop ? '取消置顶' : '置顶窗口'}
      >📌</button>

      <button onClick={onFitAll}
        style={{ ...btnBase, background: 'rgba(255,255,255,0.08)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        title="全部适应 (Ctrl+Shift+F)"
      >⊞</button>

      {/* 缩放指示 */}
      <button onClick={onResetZoom}
        style={{
          ...btnBase,
          background: 'rgba(255,255,255,0.05)',
          borderColor: 'rgba(255,255,255,0.08)',
          color: '#9ca3af',
          fontSize: 10,
          minWidth: 36,
          textAlign: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        title="重置缩放 (Ctrl+0)"
      >{Math.round(zoom * 100)}%</button>

      {/* 弹性空间 */}
      <div style={{ flex: 1, minWidth: 2 }} />

      {/* 窗口控制按钮 */}
      <button style={controlBtn}
        onClick={() => window.referenceAPI?.minimizeWindow()}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        title="最小化"
      >−</button>
      <button style={controlBtn}
        onClick={() => window.referenceAPI?.maximizeWindow()}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        title="最大化"
      >□</button>
      <button style={controlBtn}
        onClick={() => window.referenceAPI?.closeWindow()}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.5)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af' }}
        title="关闭"
      >×</button>
    </div>
  )
}

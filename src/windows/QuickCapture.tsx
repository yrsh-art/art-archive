import { useState, useCallback, useRef, useEffect } from 'react'
import type { CaptureResult } from '../types/capture'

type CaptureStatus = 'idle' | 'hover' | 'capturing' | 'success' | 'error'

const themeColors = [
  { name: '紫', bg: '#1a1a2e', border: '#8b5cf6', accent: '#a78bfa' },
  { name: '蓝', bg: '#0f172a', border: '#3b82f6', accent: '#60a5fa' },
  { name: '绿', bg: '#0f1f17', border: '#22c55e', accent: '#4ade80' },
  { name: '橙', bg: '#1a1008', border: '#f97316', accent: '#fb923c' },
  { name: '粉', bg: '#1f0f1a', border: '#ec4899', accent: '#f472b6' },
  { name: '暗', bg: '#111111', border: '#555555', accent: '#999999' },
]

function extractUrlFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim())
}

export default function QuickCapture() {
  const [status, setStatus] = useState<CaptureStatus>('idle')
  const [message, setMessage] = useState('')
  const [themeIndex, setThemeIndex] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [captureCount, setCaptureCount] = useState(0)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const theme = themeColors[themeIndex]

  const resetAfterDelay = useCallback((delay = 2000) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      setStatus('idle')
      setMessage('')
    }, delay)
  }, [])

  const handleCapture = useCallback(async (result: CaptureResult) => {
    if (result.success) {
      setStatus('success')
      setMessage(result.artwork?.title || '已保存')
      setCaptureCount(prev => prev + 1)
    } else {
      setStatus('error')
      setMessage(result.error || '采集失败')
    }
    resetAfterDelay()
  }, [resetAfterDelay])

  // Ctrl+V 剪贴板粘贴
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        if (!window.captureAPI?.captureFromClipboard) return
        setStatus('capturing')
        setMessage('读取剪贴板...')
        try {
          const result = await window.captureAPI.captureFromClipboard()
          handleCapture(result)
        } catch {
          setStatus('error')
          setMessage('剪贴板读取失败')
          resetAfterDelay()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCapture, resetAfterDelay])

  // 用原生 event listener 处理 drop
  useEffect(() => {
    const zone = dropZoneRef.current
    if (!zone) return

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      setStatus(prev => (prev === 'capturing' || prev === 'success') ? prev : 'hover')
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setStatus(prev => prev === 'hover' ? 'idle' : prev)
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!window.captureAPI || !e.dataTransfer) return

      setStatus('capturing')
      setMessage('处理中...')

      try {
        const dt = e.dataTransfer

        // 优先级 1: 本地文件
        if (dt.files && dt.files.length > 0) {
          const file = dt.files[0]
          if (!file.type.startsWith('image/')) {
            setStatus('error')
            setMessage('不是图片文件')
            resetAfterDelay()
            return
          }
          const filePath = (file as File & { path?: string }).path
          if (filePath) {
            const result = await window.captureAPI.captureFromFile({ filePath })
            handleCapture(result)
            return
          }
          const reader = new FileReader()
          reader.onload = async () => {
            const result = await window.captureAPI!.captureFromBase64({ imageData: reader.result as string })
            handleCapture(result)
          }
          reader.readAsDataURL(file)
          return
        }

        // 优先级 2: text/uri-list
        const uriList = dt.getData('text/uri-list')
        if (uriList) {
          const url = uriList.split('\n').find(line => isUrl(line))
          if (url) {
            const result = await window.captureAPI.captureFromUrl(url.trim())
            handleCapture(result)
            return
          }
        }

        // 优先级 3: text/html（浏览器拖拽图片）
        const html = dt.getData('text/html')
        if (html) {
          const imgUrl = extractUrlFromHtml(html)
          if (imgUrl && isUrl(imgUrl)) {
            const result = await window.captureAPI.captureFromUrl(imgUrl)
            handleCapture(result)
            return
          }
        }

        // 优先级 4: text/plain URL
        const text = dt.getData('text/plain')
        if (text && isUrl(text)) {
          const result = await window.captureAPI.captureFromUrl(text.trim())
          handleCapture(result)
          return
        }

        setStatus('error')
        setMessage('无法识别内容')
        resetAfterDelay()
      } catch {
        setStatus('error')
        setMessage('采集出错')
        resetAfterDelay()
      }
    }

    zone.addEventListener('dragenter', handleDragEnter)
    zone.addEventListener('dragover', handleDragOver)
    zone.addEventListener('dragleave', handleDragLeave)
    zone.addEventListener('drop', handleDrop)
    return () => {
      zone.removeEventListener('dragenter', handleDragEnter)
      zone.removeEventListener('dragover', handleDragOver)
      zone.removeEventListener('dragleave', handleDragLeave)
      zone.removeEventListener('drop', handleDrop)
    }
  }, [handleCapture, resetAfterDelay])

  // 文件选择处理
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !window.captureAPI) return

    setStatus('capturing')
    setMessage('处理中...')

    try {
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        setStatus('error')
        setMessage('不是图片文件')
        resetAfterDelay()
        return
      }
      const filePath = (file as File & { path?: string }).path
      if (filePath) {
        const result = await window.captureAPI.captureFromFile({ filePath })
        handleCapture(result)
      } else {
        const reader = new FileReader()
        reader.onload = async () => {
          const result = await window.captureAPI!.captureFromBase64({ imageData: reader.result as string })
          handleCapture(result)
        }
        reader.readAsDataURL(file)
      }
    } catch {
      setStatus('error')
      setMessage('文件读取失败')
      resetAfterDelay()
    }

    // 重置 input 以便重复选择同一文件
    e.target.value = ''
  }, [handleCapture, resetAfterDelay])

  const statusBorderColor =
    status === 'hover' ? theme.accent :
    status === 'capturing' ? '#3b82f6' :
    status === 'success' ? '#22c55e' :
    status === 'error' ? '#ef4444' :
    theme.border

  const statusBg =
    status === 'hover' ? `${theme.border}33` :
    status === 'capturing' ? 'rgba(59,130,246,0.15)' :
    status === 'success' ? 'rgba(34,197,94,0.15)' :
    status === 'error' ? 'rgba(239,68,68,0.15)' :
    'transparent'

  const statusTextColor =
    status === 'success' ? '#86efac' :
    status === 'error' ? '#fca5a5' :
    status === 'capturing' ? '#93c5fd' :
    theme.accent

  const statusIcon =
    status === 'hover' ? '🎯' :
    status === 'capturing' ? '⏳' :
    status === 'success' ? '✅' :
    status === 'error' ? '❌' :
    '📥'

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme.bg,
      border: `2px solid ${statusBorderColor}`,
      transition: 'border-color 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* 标题栏 */}
      <div style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px 0 10px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: `1px solid ${theme.border}44`,
        WebkitAppRegion: 'drag' as never,
        cursor: 'move',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}>
          Quick Capture
          {captureCount > 0 && (
            <span style={{
              marginLeft: 6,
              padding: '0 5px',
              borderRadius: 8,
              background: `${theme.border}33`,
              fontSize: 10,
            }}>{captureCount}</span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 3, WebkitAppRegion: 'no-drag' as never }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? `${theme.border}33` : 'rgba(255,255,255,0.06)',
              border: 'none', color: theme.accent, fontSize: 12,
              width: 20, height: 20, borderRadius: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="配色设置"
          >⚙</button>
          <button
            onClick={() => window.captureAPI?.closeWindow()}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', color: '#999',
              fontSize: 14, width: 20, height: 20, borderRadius: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.5)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#999' }}
          >×</button>
        </div>
      </div>

      {/* 配色面板 */}
      {showSettings && (
        <div style={{
          display: 'flex', gap: 4, padding: '6px 10px',
          background: 'rgba(0,0,0,0.2)', borderBottom: `1px solid ${theme.border}33`,
          flexShrink: 0, flexWrap: 'wrap',
        }}>
          {themeColors.map((t, i) => (
            <button key={i} onClick={() => { setThemeIndex(i); setShowSettings(false) }}
              style={{
                width: 22, height: 22, borderRadius: 4, background: t.bg,
                border: `2px solid ${i === themeIndex ? t.border : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', position: 'relative',
              }} title={t.name}>
              <div style={{ position: 'absolute', inset: 3, borderRadius: 2, background: t.border, opacity: 0.6 }} />
            </button>
          ))}
        </div>
      )}

      {/* 拖拽区域 */}
      <div ref={dropZoneRef} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
        margin: 8, borderRadius: 10,
        border: `2px dashed ${statusBorderColor}88`,
        background: statusBg, transition: 'all 0.3s ease',
        cursor: 'default', WebkitAppRegion: 'no-drag' as never,
      }}>
        <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 32 }}>{statusIcon}</div>
          <div style={{ fontSize: 11, color: statusTextColor, textAlign: 'center', padding: '0 8px', wordBreak: 'break-all' }}>
            {status === 'idle' && 'Ctrl+V 粘贴 / 拖入图片'}
            {status === 'hover' && '松开以采集'}
            {status === 'capturing' && (message || '处理中...')}
            {status === 'success' && (message || '已保存')}
            {status === 'error' && (message || '采集失败')}
          </div>
        </div>
        {/* 文件选择按钮 */}
        {status === 'idle' && (
          <button
            onClick={handleFileSelect}
            style={{
              marginTop: 2,
              padding: '3px 10px',
              borderRadius: 6,
              border: `1px solid ${theme.border}66`,
              background: `${theme.border}1a`,
              color: theme.accent,
              fontSize: 10,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${theme.border}33` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${theme.border}1a` }}
          >选择文件</button>
        )}
      </div>
    </div>
  )
}

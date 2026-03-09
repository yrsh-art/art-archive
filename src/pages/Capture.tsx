import { useState, useCallback, useRef, useEffect } from 'react'
import { useArtworks } from '../context/ArtworkContext'

type CaptureStatus = 'idle' | 'hover' | 'capturing' | 'success' | 'error'

const themeColors = [
  { name: '紫', bg: 'rgba(139,92,246,0.08)', border: '#8b5cf6', accent: '#a78bfa' },
  { name: '蓝', bg: 'rgba(59,130,246,0.08)', border: '#3b82f6', accent: '#60a5fa' },
  { name: '绿', bg: 'rgba(34,197,94,0.08)', border: '#22c55e', accent: '#4ade80' },
  { name: '橙', bg: 'rgba(249,115,22,0.08)', border: '#f97316', accent: '#fb923c' },
  { name: '粉', bg: 'rgba(236,72,153,0.08)', border: '#ec4899', accent: '#f472b6' },
  { name: '暗', bg: 'rgba(255,255,255,0.03)', border: '#555555', accent: '#999999' },
]

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function extractUrlFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim())
}

export default function Capture() {
  const { addArtwork } = useArtworks()
  const [status, setStatus] = useState<CaptureStatus>('idle')
  const [message, setMessage] = useState('')
  const [themeIndex, setThemeIndex] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [captureCount, setCaptureCount] = useState(0)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const theme = themeColors[themeIndex]

  const resetAfterDelay = useCallback((delay = 2000) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      setStatus('idle')
      setMessage('')
    }, delay)
  }, [])

  // Ctrl+V 剪贴板粘贴
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!((e.ctrlKey || e.metaKey) && e.key === 'v')) return
      e.preventDefault()
      setStatus('capturing')
      setMessage('读取剪贴板...')

      try {
        // Electron 采集窗口环境
        if (window.captureAPI?.captureFromClipboard) {
          const result = await window.captureAPI.captureFromClipboard()
          if (result.success && result.imageData) {
            await addArtwork({
              title: result.artwork?.title || '剪贴板粘贴',
              description: '',
              tags: ['快捷采集'],
              category: 'other',
              imageUrl: result.imageData,
            })
            setCaptureCount(prev => prev + 1)
            setStatus('success')
            setMessage(result.artwork?.title || '已保存')
            resetAfterDelay()
            return
          }
          if (!result.success) {
            setStatus('error')
            setMessage(result.error || '剪贴板无图片')
            resetAfterDelay()
            return
          }
        }

        // Electron 主窗口环境：支持批量粘贴
        if (window.electronAPI?.pasteFromClipboard) {
          const result = await window.electronAPI.pasteFromClipboard()
          if (result.success) {
            if (result.results && result.results.length > 0) {
              // 多张图片（从文件管理器复制多个文件）
              let count = 0
              for (const r of result.results) {
                await addArtwork({
                  title: r.artwork?.title || '剪贴板粘贴',
                  description: '',
                  tags: ['快捷采集'],
                  category: 'other',
                  imageUrl: r.imageData,
                })
                count++
                setCaptureCount(prev => prev + 1)
              }
              setStatus('success')
              setMessage(`已保存 ${count} 张图片`)
              resetAfterDelay()
              return
            } else if (result.imageData) {
              // 单张图片
              await addArtwork({
                title: result.artwork?.title || '剪贴板粘贴',
                description: '',
                tags: ['快捷采集'],
                category: 'other',
                imageUrl: result.imageData,
              })
              setCaptureCount(prev => prev + 1)
              setStatus('success')
              setMessage(result.artwork?.title || '已保存')
              resetAfterDelay()
              return
            }
          }
          if (!result.success) {
            setStatus('error')
            setMessage(result.error || '剪贴板无图片')
            resetAfterDelay()
            return
          }
        }

        // 浏览器环境：使用 Clipboard API，处理所有图片项
        if (navigator.clipboard?.read) {
          const clipboardItems = await navigator.clipboard.read()
          const images: string[] = []
          for (const item of clipboardItems) {
            const imageType = item.types.find(t => t.startsWith('image/'))
            if (imageType) {
              const blob = await item.getType(imageType)
              const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              images.push(dataUrl)
            }
          }
          if (images.length > 0) {
            for (const dataUrl of images) {
              await addArtwork({
                title: '剪贴板粘贴',
                description: '',
                tags: ['快捷采集'],
                category: 'other',
                imageUrl: dataUrl,
              })
              setCaptureCount(prev => prev + 1)
            }
            setStatus('success')
            setMessage(images.length > 1 ? `已保存 ${images.length} 张` : '剪贴板粘贴')
            resetAfterDelay()
            return
          }
        }

        setStatus('error')
        setMessage('剪贴板无图片')
        resetAfterDelay()
      } catch {
        setStatus('error')
        setMessage('剪贴板读取失败')
        resetAfterDelay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addArtwork, resetAfterDelay])

  const saveImageToLibrary = useCallback(async (dataUrl: string, title: string) => {
    await addArtwork({
      title,
      description: '',
      tags: ['快捷采集'],
      category: 'other',
      imageUrl: dataUrl,
    })
    setCaptureCount(prev => prev + 1)
    setStatus('success')
    setMessage(title)
    resetAfterDelay()
  }, [addArtwork, resetAfterDelay])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
        const dataUrl = await fileToDataUrl(file)
        const title = file.name.replace(/\.[^.]+$/, '') || '快捷采集'
        await saveImageToLibrary(dataUrl, title)
        return
      }

      // 优先级 2: text/uri-list（浏览器里不太能直接下载跨域图片，提示用户）
      const uriList = dt.getData('text/uri-list')
      if (uriList && isUrl(uriList)) {
        setStatus('error')
        setMessage('网页版不支持URL采集，请右键保存图片后拖入文件')
        resetAfterDelay(3000)
        return
      }

      // 优先级 3: text/html
      const html = dt.getData('text/html')
      if (html) {
        const imgUrl = extractUrlFromHtml(html)
        if (imgUrl) {
          // 尝试通过 canvas 跨域获取（部分图片可能受限）
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = () => reject(new Error('图片加载失败'))
              img.src = imgUrl
            })
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL('image/png')
            await saveImageToLibrary(dataUrl, '网页采集')
            return
          } catch {
            setStatus('error')
            setMessage('跨域限制，请右键保存图片后拖入文件')
            resetAfterDelay(3000)
            return
          }
        }
      }

      // 优先级 4: text/plain URL
      const text = dt.getData('text/plain')
      if (text && isUrl(text)) {
        setStatus('error')
        setMessage('网页版不支持URL采集，请拖入文件')
        resetAfterDelay(3000)
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
  }, [saveImageToLibrary, resetAfterDelay])

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    if (status !== 'capturing' && status !== 'success') {
      setStatus('hover')
    }
  }, [status])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (status === 'hover') setStatus('idle')
  }, [status])

  // 点击选择文件
  const onClickUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async () => {
      if (!input.files) return
      setStatus('capturing')
      setMessage('处理中...')
      for (const file of Array.from(input.files)) {
        if (!file.type.startsWith('image/')) continue
        const dataUrl = await fileToDataUrl(file)
        const title = file.name.replace(/\.[^.]+$/, '') || '快捷采集'
        await addArtwork({
          title,
          description: '',
          tags: ['快捷采集'],
          category: 'other',
          imageUrl: dataUrl,
        })
        setCaptureCount(prev => prev + 1)
      }
      setStatus('success')
      setMessage(`已采集 ${input.files.length} 张`)
      resetAfterDelay()
    }
    input.click()
  }, [addArtwork, resetAfterDelay])

  const statusBorderColor =
    status === 'hover' ? theme.accent :
    status === 'capturing' ? '#3b82f6' :
    status === 'success' ? '#22c55e' :
    status === 'error' ? '#ef4444' :
    theme.border

  const statusBg =
    status === 'hover' ? `${theme.border}22` :
    status === 'capturing' ? 'rgba(59,130,246,0.08)' :
    status === 'success' ? 'rgba(34,197,94,0.08)' :
    status === 'error' ? 'rgba(239,68,68,0.08)' :
    theme.bg

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
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold gradient-text mb-2">快捷采集</h1>
        <p className="text-gray-400 text-sm">Ctrl+V 粘贴、拖拽图片到下方区域，或点击选择文件，快速添加到素材库</p>
      </div>

      {/* 配色选择 */}
      <div className="flex justify-center gap-2 mb-6">
        {themeColors.map((t, i) => (
          <button
            key={i}
            onClick={() => setThemeIndex(i)}
            style={{
              width: 28, height: 28,
              borderRadius: 6,
              border: `2px solid ${i === themeIndex ? t.border : 'rgba(255,255,255,0.1)'}`,
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.2s',
            }}
            title={t.name}
          >
            <div style={{
              position: 'absolute', inset: 4,
              borderRadius: 3,
              background: t.border,
              opacity: 0.7,
            }} />
          </button>
        ))}
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            width: 28, height: 28,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#999',
            cursor: 'pointer',
            fontSize: 14,
          }}
          title="设置"
        >⚙</button>
      </div>

      {/* 拖拽区域 */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClickUpload}
        style={{
          height: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          borderRadius: 16,
          border: `2px dashed ${statusBorderColor}`,
          background: statusBg,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
      >
        <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 56 }}>{statusIcon}</div>
          <div style={{ color: statusTextColor, fontSize: 16, fontWeight: 500 }}>
            {status === 'idle' && 'Ctrl+V 粘贴 / 拖入图片 / 点击选择文件'}
            {status === 'hover' && '松开以采集'}
            {status === 'capturing' && (message || '处理中...')}
            {status === 'success' && (message || '已保存')}
            {status === 'error' && (message || '采集失败')}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            支持 JPG、PNG、GIF、WebP 格式
          </div>
        </div>
      </div>

      {/* 统计 */}
      {captureCount > 0 && (
        <div className="text-center mt-4 text-sm" style={{ color: theme.accent }}>
          本次已采集 {captureCount} 张素材
        </div>
      )}

      {/* 使用提示 */}
      <div className="mt-8 glass rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: theme.accent }}>使用说明</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• Ctrl+V（Cmd+V）粘贴截图或剪贴板中的图片</li>
          <li>• 支持批量粘贴：在文件管理器中复制多张图片后 Ctrl+V 一次性导入</li>
          <li>• 从文件管理器拖拽图片到上方区域即可快速采集</li>
          <li>• 点击区域可打开文件选择器，支持多选</li>
          <li>• 采集的图片会自动添加到素材库，标签为「快捷采集」</li>
          <li>• 在 Electron 桌面版中，还支持从浏览器直接拖拽网页图片</li>
        </ul>
      </div>
    </div>
  )
}

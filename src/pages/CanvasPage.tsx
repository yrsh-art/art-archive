import { useState, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Undo2, Redo2, Trash2, Download, Save, Settings2 } from 'lucide-react'
import CanvasToolbar, { type ToolType } from '../components/features/CanvasToolbar'
import DrawingBoard from '../components/features/DrawingBoard'
import PresetGenerators from '../components/features/PresetGenerators'
import { useArtworks } from '../context/ArtworkContext'

export default function CanvasPage() {
  const location = useLocation()
  const themeText = (location.state as { theme?: string })?.theme || ''
  const { addArtwork } = useArtworks()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<ToolType>('pen')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(4)
  const [opacity, setOpacity] = useState(100)
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [canvasWidth, setCanvasWidth] = useState(800)
  const [canvasHeight, setCanvasHeight] = useState(600)
  const [showSizeModal, setShowSizeModal] = useState(false)

  const addRecentColor = useCallback((c: string) => {
    setRecentColors(prev => {
      const filtered = prev.filter(x => x !== c)
      return [c, ...filtered].slice(0, 12)
    })
  }, [])

  const handleClearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleExport = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Merge bg + drawing layers
    const mergedCanvas = document.createElement('canvas')
    mergedCanvas.width = canvas.width
    mergedCanvas.height = canvas.height
    const mCtx = mergedCanvas.getContext('2d')!
    mCtx.fillStyle = '#ffffff'
    mCtx.fillRect(0, 0, canvas.width, canvas.height)
    mCtx.drawImage(canvas, 0, 0)

    const link = document.createElement('a')
    link.download = `artwork-${Date.now()}.png`
    link.href = mergedCanvas.toDataURL('image/png')
    link.click()
  }

  const handleSaveToLibrary = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const mergedCanvas = document.createElement('canvas')
    mergedCanvas.width = canvas.width
    mergedCanvas.height = canvas.height
    const mCtx = mergedCanvas.getContext('2d')!
    mCtx.fillStyle = '#ffffff'
    mCtx.fillRect(0, 0, canvas.width, canvas.height)
    mCtx.drawImage(canvas, 0, 0)

    const dataUrl = mergedCanvas.toDataURL('image/png')
    await addArtwork({
      title: themeText || '画板作品',
      description: themeText ? `主题: ${themeText}` : '',
      tags: ['画板', '原创'],
      category: 'illustration',
      imageUrl: dataUrl,
      isOwnWork: true,
    })
    alert('已保存到素材库！')
  }

  const handlePresetGenerate = (imageData: ImageData) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(imageData, 0, 0)
  }

  return (
    <div className="min-h-screen py-4">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Theme banner */}
        {themeText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-center"
          >
            <span className="text-sm text-gray-400">当前主题: </span>
            <span className="text-purple-300 font-medium">{themeText}</span>
          </motion.div>
        )}

        {/* Top action bar */}
        <div className="flex items-center justify-between mb-4 glass rounded-xl px-4 py-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold gradient-text mr-4">画板</h1>
            <button onClick={handleClearCanvas} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" title="清空">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setShowSizeModal(true)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" title="画布尺寸">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 text-sm"
            >
              <Download className="w-4 h-4" />
              导出 PNG
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveToLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm"
            >
              <Save className="w-4 h-4" />
              保存到素材库
            </motion.button>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex gap-4">
          {/* Left toolbar */}
          <div className="flex-shrink-0 w-[72px]">
            <CanvasToolbar
              activeTool={tool}
              onToolChange={setTool}
              color={color}
              onColorChange={setColor}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              opacity={opacity}
              onOpacityChange={setOpacity}
              recentColors={recentColors}
            />
          </div>

          {/* Canvas area */}
          <div className="flex-1 glass rounded-xl p-4 overflow-auto flex items-center justify-center" style={{ minHeight: 500 }}>
            <DrawingBoard
              width={canvasWidth}
              height={canvasHeight}
              tool={tool}
              color={color}
              brushSize={brushSize}
              opacity={opacity}
              onColorPicked={setColor}
              onAddRecentColor={addRecentColor}
              canvasRef={canvasRef}
            />
          </div>

          {/* Right panel: Presets */}
          <div className="flex-shrink-0 w-[180px] overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
            <PresetGenerators
              onGenerate={handlePresetGenerate}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          </div>
        </div>
      </div>

      {/* Size Modal */}
      {showSizeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowSizeModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">画布尺寸</h3>
            <div className="flex gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400">宽度</label>
                <input
                  type="number"
                  value={canvasWidth}
                  onChange={e => setCanvasWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">高度</label>
                <input
                  type="number"
                  value={canvasHeight}
                  onChange={e => setCanvasHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                [800, 600, '4:3'],
                [1024, 768, '4:3 HD'],
                [1920, 1080, '16:9'],
                [1080, 1080, '1:1'],
                [512, 512, '小方'],
              ].map(([w, h, label]) => (
                <button
                  key={`${w}x${h}`}
                  onClick={() => { setCanvasWidth(w as number); setCanvasHeight(h as number) }}
                  className="text-xs px-2 py-1 rounded bg-white/5 text-gray-300 hover:bg-white/10"
                >
                  {label} ({w}x{h})
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSizeModal(false)}
              className="w-full py-2 rounded-lg bg-purple-600 text-white"
            >
              确定
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

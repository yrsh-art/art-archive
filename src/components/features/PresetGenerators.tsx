import { useState } from 'react'
import { motion } from 'framer-motion'
import { Palette, Layers, Grid3X3, Shapes, LayoutTemplate } from 'lucide-react'

interface PresetGeneratorsProps {
  onGenerate: (imageData: ImageData) => void
  canvasWidth: number
  canvasHeight: number
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split'

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function generatePalette(harmony: HarmonyType): string[] {
  const baseHue = Math.random() * 360
  const hues: number[] = [baseHue]
  switch (harmony) {
    case 'complementary':
      hues.push((baseHue + 180) % 360)
      hues.push((baseHue + 30) % 360)
      hues.push((baseHue + 210) % 360)
      hues.push((baseHue + 15) % 360)
      break
    case 'analogous':
      for (let i = 1; i <= 4; i++) hues.push((baseHue + i * 30) % 360)
      break
    case 'triadic':
      hues.push((baseHue + 120) % 360, (baseHue + 240) % 360)
      hues.push((baseHue + 60) % 360, (baseHue + 180) % 360)
      break
    case 'split':
      hues.push((baseHue + 150) % 360, (baseHue + 210) % 360)
      hues.push((baseHue + 30) % 360, (baseHue + 330) % 360)
      break
  }
  return hues.slice(0, 5).map(h => {
    const [r, g, b] = hslToRgb(h, 60 + Math.random() * 30, 40 + Math.random() * 30)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  })
}

export default function PresetGenerators({ onGenerate, canvasWidth, canvasHeight }: PresetGeneratorsProps) {
  const [paletteHarmony, setPaletteHarmony] = useState<HarmonyType>('complementary')
  const [gridRows, setGridRows] = useState(4)
  const [gridCols, setGridCols] = useState(4)
  const [templateType, setTemplateType] = useState<'character' | 'colorcard' | 'storyboard'>('character')
  const [storyboardPanels, setStoryboardPanels] = useState(6)

  const createImageData = (drawFn: (ctx: CanvasRenderingContext2D) => void): ImageData => {
    const offscreen = document.createElement('canvas')
    offscreen.width = canvasWidth
    offscreen.height = canvasHeight
    const ctx = offscreen.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    drawFn(ctx)
    return ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  }

  const generateColorPalette = () => {
    const colors = generatePalette(paletteHarmony)
    const imageData = createImageData((ctx) => {
      const w = canvasWidth / colors.length
      colors.forEach((color, i) => {
        ctx.fillStyle = color
        ctx.fillRect(i * w, 0, w, canvasHeight)
      })
      // Add labels
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      colors.forEach((color, i) => {
        ctx.fillText(color, i * w + w / 2, canvasHeight - 20)
      })
    })
    onGenerate(imageData)
  }

  const generateGradient = () => {
    const colors = generatePalette('analogous').slice(0, 2)
    const imageData = createImageData((ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(1, colors[1])
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    })
    onGenerate(imageData)
  }

  const generateGrid = () => {
    const imageData = createImageData((ctx) => {
      const cellW = canvasWidth / gridCols
      const cellH = canvasHeight / gridRows
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      for (let r = 0; r <= gridRows; r++) {
        ctx.beginPath()
        ctx.moveTo(0, r * cellH)
        ctx.lineTo(canvasWidth, r * cellH)
        ctx.stroke()
      }
      for (let c = 0; c <= gridCols; c++) {
        ctx.beginPath()
        ctx.moveTo(c * cellW, 0)
        ctx.lineTo(c * cellW, canvasHeight)
        ctx.stroke()
      }
    })
    onGenerate(imageData)
  }

  const generateGeometric = () => {
    const imageData = createImageData((ctx) => {
      for (let i = 0; i < 15; i++) {
        const [r, g, b] = hslToRgb(Math.random() * 360, 50 + Math.random() * 40, 50 + Math.random() * 30)
        ctx.fillStyle = `rgba(${r},${g},${b},0.5)`
        ctx.strokeStyle = `rgba(${r},${g},${b},0.8)`
        ctx.lineWidth = 2
        const shape = Math.floor(Math.random() * 3)
        const x = Math.random() * canvasWidth
        const y = Math.random() * canvasHeight
        const size = 30 + Math.random() * 100
        if (shape === 0) {
          ctx.beginPath()
          ctx.arc(x, y, size / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        } else if (shape === 1) {
          ctx.fillRect(x - size / 2, y - size / 2, size, size)
          ctx.strokeRect(x - size / 2, y - size / 2, size, size)
        } else {
          ctx.beginPath()
          ctx.moveTo(x, y - size / 2)
          ctx.lineTo(x + size / 2, y + size / 2)
          ctx.lineTo(x - size / 2, y + size / 2)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        }
      }
    })
    onGenerate(imageData)
  }

  const generateTemplate = () => {
    const imageData = createImageData((ctx) => {
      ctx.strokeStyle = '#999999'
      ctx.lineWidth = 2
      ctx.fillStyle = '#666666'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'

      if (templateType === 'character') {
        // 3 panels: front / side / back
        const pw = canvasWidth / 3
        for (let i = 0; i < 3; i++) {
          ctx.strokeRect(i * pw + 10, 40, pw - 20, canvasHeight - 80)
        }
        const labels = ['正面', '侧面', '背面']
        labels.forEach((label, i) => {
          ctx.fillText(label, i * pw + pw / 2, 30)
        })
      } else if (templateType === 'colorcard') {
        const cols = 5
        const rows = 4
        const cellW = (canvasWidth - 40) / cols
        const cellH = (canvasHeight - 80) / rows
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.strokeRect(20 + c * cellW, 40 + r * cellH, cellW, cellH)
          }
        }
        ctx.fillText('色卡模板', canvasWidth / 2, 25)
      } else if (templateType === 'storyboard') {
        const cols = Math.ceil(Math.sqrt(storyboardPanels))
        const rows = Math.ceil(storyboardPanels / cols)
        const cellW = (canvasWidth - 40) / cols
        const cellH = (canvasHeight - 80) / rows
        for (let i = 0; i < storyboardPanels; i++) {
          const r = Math.floor(i / cols)
          const c = i % cols
          ctx.strokeRect(20 + c * cellW + 5, 40 + r * cellH + 5, cellW - 10, cellH - 10)
          ctx.fillText(`${i + 1}`, 20 + c * cellW + cellW / 2, 40 + r * cellH + cellH / 2 + 5)
        }
        ctx.fillText('分镜模板', canvasWidth / 2, 25)
      }
    })
    onGenerate(imageData)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase">预设生成</h3>

      {/* Color Palette */}
      <div className="glass rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-300">调色板</span>
        </div>
        <select
          value={paletteHarmony}
          onChange={(e) => setPaletteHarmony(e.target.value as HarmonyType)}
          className="w-full text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white mb-2"
        >
          <option value="complementary" className="bg-gray-800">互补色</option>
          <option value="analogous" className="bg-gray-800">类似色</option>
          <option value="triadic" className="bg-gray-800">三角色</option>
          <option value="split" className="bg-gray-800">分裂互补</option>
        </select>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={generateColorPalette}
          className="w-full text-xs py-1.5 rounded bg-purple-600/50 text-white hover:bg-purple-500/50"
        >
          生成
        </motion.button>
      </div>

      {/* Gradient */}
      <div className="glass rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-gray-300">渐变背景</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={generateGradient}
          className="w-full text-xs py-1.5 rounded bg-cyan-600/50 text-white hover:bg-cyan-500/50"
        >
          随机渐变
        </motion.button>
      </div>

      {/* Grid */}
      <div className="glass rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Grid3X3 className="w-4 h-4 text-green-400" />
          <span className="text-xs text-gray-300">网格</span>
        </div>
        <div className="flex gap-2 mb-2">
          <input type="number" min="2" max="20" value={gridRows} onChange={e => setGridRows(Number(e.target.value))}
            className="w-full text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white" placeholder="行" />
          <input type="number" min="2" max="20" value={gridCols} onChange={e => setGridCols(Number(e.target.value))}
            className="w-full text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white" placeholder="列" />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={generateGrid}
          className="w-full text-xs py-1.5 rounded bg-green-600/50 text-white hover:bg-green-500/50"
        >
          生成
        </motion.button>
      </div>

      {/* Geometric */}
      <div className="glass rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Shapes className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-gray-300">随机几何</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={generateGeometric}
          className="w-full text-xs py-1.5 rounded bg-orange-600/50 text-white hover:bg-orange-500/50"
        >
          生成
        </motion.button>
      </div>

      {/* Templates */}
      <div className="glass rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <LayoutTemplate className="w-4 h-4 text-pink-400" />
          <span className="text-xs text-gray-300">模板</span>
        </div>
        <select
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value as typeof templateType)}
          className="w-full text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white mb-2"
        >
          <option value="character" className="bg-gray-800">角色设定</option>
          <option value="colorcard" className="bg-gray-800">色卡</option>
          <option value="storyboard" className="bg-gray-800">分镜</option>
        </select>
        {templateType === 'storyboard' && (
          <input type="number" min="2" max="12" value={storyboardPanels}
            onChange={e => setStoryboardPanels(Number(e.target.value))}
            className="w-full text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white mb-2" placeholder="格数" />
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={generateTemplate}
          className="w-full text-xs py-1.5 rounded bg-pink-600/50 text-white hover:bg-pink-500/50"
        >
          生成
        </motion.button>
      </div>
    </div>
  )
}

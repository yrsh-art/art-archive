import { motion } from 'framer-motion'
import {
  Pencil, Minus, Square, Circle, Eraser, PaintBucket, Type, Pipette
} from 'lucide-react'

export type ToolType = 'pen' | 'line' | 'rect' | 'circle' | 'eraser' | 'fill' | 'text' | 'eyedropper'

interface CanvasToolbarProps {
  activeTool: ToolType
  onToolChange: (tool: ToolType) => void
  color: string
  onColorChange: (color: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  opacity: number
  onOpacityChange: (opacity: number) => void
  recentColors: string[]
}

const tools: { id: ToolType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: 'pen', icon: Pencil, label: '画笔' },
  { id: 'line', icon: Minus, label: '直线' },
  { id: 'rect', icon: Square, label: '矩形' },
  { id: 'circle', icon: Circle, label: '圆形' },
  { id: 'eraser', icon: Eraser, label: '橡皮擦' },
  { id: 'fill', icon: PaintBucket, label: '填充' },
  { id: 'text', icon: Type, label: '文字' },
  { id: 'eyedropper', icon: Pipette, label: '取色' },
]

export default function CanvasToolbar({
  activeTool, onToolChange, color, onColorChange,
  brushSize, onBrushSizeChange, opacity, onOpacityChange, recentColors,
}: CanvasToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Tools */}
      <div className="glass rounded-xl p-2 flex flex-col gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id
          return (
            <motion.button
              key={tool.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onToolChange(tool.id)}
              className={`p-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
            </motion.button>
          )
        })}
      </div>

      {/* Color picker */}
      <div className="glass rounded-xl p-3">
        <label className="block text-[10px] text-gray-500 uppercase mb-2">颜色</label>
        <div className="relative">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-8 rounded-lg cursor-pointer bg-transparent border border-white/10"
          />
        </div>
        <input
          type="text"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-full mt-2 px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-white text-center focus:outline-none focus:border-purple-500"
        />
        {recentColors.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recentColors.slice(0, 8).map((c, i) => (
              <button
                key={i}
                onClick={() => onColorChange(c)}
                className="w-5 h-5 rounded border border-white/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Brush size */}
      <div className="glass rounded-xl p-3">
        <label className="block text-[10px] text-gray-500 uppercase mb-2">大小 {brushSize}px</label>
        <input
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>

      {/* Opacity */}
      <div className="glass rounded-xl p-3">
        <label className="block text-[10px] text-gray-500 uppercase mb-2">不透明度 {opacity}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>
    </div>
  )
}

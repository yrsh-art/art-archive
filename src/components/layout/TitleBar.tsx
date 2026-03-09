import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Minus, Square, X, Sparkles } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function TitleBar() {
  const { themeConfig } = useTheme()
  const [isElectron, setIsElectron] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    setIsElectron(!!window.electronAPI)
  }, [])

  if (!isElectron) return null

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
    window.electronAPI?.maximizeWindow()
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-8 z-[100] flex items-center justify-between select-none"
      style={{ 
        background: `linear-gradient(180deg, ${themeConfig.cardBg} 0%, transparent 100%)`,
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <Sparkles className="w-4 h-4" style={{ color: themeConfig.primaryColor }} />
        <span className="text-sm font-medium" style={{ color: themeConfig.textColor }}>
          Art Archive
        </span>
      </div>

      <div 
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <motion.button
          onClick={() => window.electronAPI?.minimizeWindow()}
          className="w-12 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.95 }}
        >
          <Minus className="w-4 h-4" style={{ color: themeConfig.textColor }} />
        </motion.button>

        <motion.button
          onClick={handleMaximize}
          className="w-12 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.95 }}
        >
          <Square 
            className="w-3.5 h-3.5" 
            style={{ color: themeConfig.textColor }}
          />
        </motion.button>

        <motion.button
          onClick={() => window.electronAPI?.closeWindow()}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-500 transition-colors"
          whileHover={{ backgroundColor: '#ef4444' }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="w-4 h-4" style={{ color: themeConfig.textColor }} />
        </motion.button>
      </div>
    </div>
  )
}

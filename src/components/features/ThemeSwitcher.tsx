import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, ChevronRight, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { themes } from '../../types/theme'

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentTheme, setTheme, themeConfig } = useTheme()

  const themeList = Object.values(themes)

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
        style={{ 
          background: `linear-gradient(135deg, ${themeConfig.primaryColor}, ${themeConfig.secondaryColor})`,
          boxShadow: `0 4px 20px ${themeConfig.glowColor}`
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Palette className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              className="fixed right-0 top-0 bottom-0 w-80 z-50 overflow-y-auto"
              style={{ 
                background: themeConfig.cardBg,
                borderLeft: `1px solid ${themeConfig.borderColor}`,
                backdropFilter: 'blur(20px)'
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 
                    className="text-xl font-bold"
                    style={{ color: themeConfig.textColor }}
                  >
                    主题风格
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" style={{ color: themeConfig.textColor }} />
                  </button>
                </div>

                <p 
                  className="text-sm mb-6 opacity-70"
                  style={{ color: themeConfig.textColor }}
                >
                  选择你喜欢的界面风格，背景效果会随主题变化
                </p>

                <div className="space-y-3">
                  {themeList.map((theme, index) => (
                    <motion.button
                      key={theme.id}
                      onClick={() => setTheme(theme.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                        currentTheme === theme.id 
                          ? 'ring-2' 
                          : 'hover:scale-[1.02]'
                      }`}
                      style={{
                        background: currentTheme === theme.id 
                          ? `${theme.primaryColor}20` 
                          : 'rgba(255, 255, 255, 0.03)',
                        borderColor: currentTheme === theme.id 
                          ? theme.primaryColor 
                          : 'transparent',
                        boxShadow: currentTheme === theme.id 
                          ? `0 0 0 2px ${theme.primaryColor}` 
                          : 'none'
                      }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: -4 }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${theme.primaryColor}40, ${theme.secondaryColor}40)`
                          }}
                        >
                          {theme.icon}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 
                              className="font-semibold"
                              style={{ color: theme.textColor }}
                            >
                              {theme.name}
                            </h3>
                            {currentTheme === theme.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 rounded-full"
                                style={{ background: theme.primaryColor }}
                              />
                            )}
                          </div>
                          
                          <p 
                            className="text-xs opacity-60 mt-1"
                            style={{ color: theme.textColor }}
                          >
                            {theme.nameEn}
                          </p>
                          
                          <p 
                            className="text-sm opacity-70 mt-2"
                            style={{ color: theme.textColor }}
                          >
                            {theme.description}
                          </p>

                          <div className="flex gap-2 mt-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ background: theme.primaryColor }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ background: theme.secondaryColor }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ background: theme.accentColor }}
                            />
                          </div>
                        </div>

                        <ChevronRight 
                          className="w-5 h-5 opacity-50"
                          style={{ color: theme.textColor }}
                        />
                      </div>
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  className="mt-8 p-4 rounded-xl"
                  style={{ 
                    background: `${themeConfig.primaryColor}10`,
                    border: `1px solid ${themeConfig.primaryColor}30`
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 
                    className="font-semibold mb-2"
                    style={{ color: themeConfig.primaryColor }}
                  >
                    当前主题：{themeConfig.name}
                  </h3>
                  <p 
                    className="text-sm opacity-70"
                    style={{ color: themeConfig.textColor }}
                  >
                    {themeConfig.description}
                  </p>
                  <p 
                    className="text-xs opacity-50 mt-2"
                    style={{ color: themeConfig.textColor }}
                  >
                    移动鼠标查看背景粒子效果
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

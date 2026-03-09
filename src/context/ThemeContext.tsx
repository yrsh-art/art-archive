import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { ThemeStyle, ThemeConfig } from '../types/theme'
import { themes } from '../types/theme'

interface ThemeContextType {
  currentTheme: ThemeStyle
  themeConfig: ThemeConfig
  setTheme: (theme: ThemeStyle) => void
  cycleTheme: () => void
  mousePosition: { x: number; y: number }
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const isElectron = () => !!window.electronAPI

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeStyle>('default')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)

  const themeConfig = themes[currentTheme]

  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (isElectron()) {
          const config = await window.electronAPI!.loadConfig()
          if (config.theme && themes[config.theme as ThemeStyle]) {
            setCurrentTheme(config.theme as ThemeStyle)
          }
        } else {
          const saved = localStorage.getItem('art-archive-theme')
          if (saved && themes[saved as ThemeStyle]) {
            setCurrentTheme(saved as ThemeStyle)
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error)
      }
      setIsLoaded(true)
    }
    
    loadTheme()
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    
    const saveTheme = async () => {
      if (isElectron()) {
        await window.electronAPI!.saveConfig({ theme: currentTheme })
      } else {
        localStorage.setItem('art-archive-theme', currentTheme)
      }
    }
    
    saveTheme()
    
    const root = document.documentElement
    const config = themes[currentTheme]
    
    root.style.setProperty('--theme-primary', config.primaryColor)
    root.style.setProperty('--theme-secondary', config.secondaryColor)
    root.style.setProperty('--theme-accent', config.accentColor)
    root.style.setProperty('--theme-bg', config.backgroundColor)
    root.style.setProperty('--theme-gradient-start', config.gradientStart)
    root.style.setProperty('--theme-gradient-end', config.gradientEnd)
    root.style.setProperty('--theme-particle', config.particleColor)
    root.style.setProperty('--theme-glow', config.glowColor)
    root.style.setProperty('--theme-text', config.textColor)
    root.style.setProperty('--theme-card-bg', config.cardBg)
    root.style.setProperty('--theme-border', config.borderColor)
  }, [currentTheme, isLoaded])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const setTheme = useCallback((theme: ThemeStyle) => {
    setCurrentTheme(theme)
  }, [])

  const cycleTheme = useCallback(() => {
    const themeKeys = Object.keys(themes) as ThemeStyle[]
    const currentIndex = themeKeys.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % themeKeys.length
    setCurrentTheme(themeKeys[nextIndex])
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      themeConfig, 
      setTheme, 
      cycleTheme,
      mousePosition 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

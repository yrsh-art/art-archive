import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'

interface TrailPoint {
  id: number
  x: number
  y: number
  opacity: number
  scale: number
  rotation: number
}

export default function MouseGlow() {
  const { currentTheme, mousePosition } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [trails, setTrails] = useState<TrailPoint[]>([])
  const trailIdRef = useRef(0)
  const lastPositionRef = useRef({ x: 0, y: 0 })

  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)

  const springConfig = { damping: 20, stiffness: 300 }
  const glowX = useSpring(cursorX, springConfig)
  const glowY = useSpring(cursorY, springConfig)

  const secondaryGlowX = useSpring(cursorX, { damping: 30, stiffness: 150 })
  const secondaryGlowY = useSpring(cursorY, { damping: 30, stiffness: 150 })

  useEffect(() => {
    cursorX.set(mousePosition.x)
    cursorY.set(mousePosition.y)
    
    if (mousePosition.x > 0 || mousePosition.y > 0) {
      setIsVisible(true)
    }
  }, [mousePosition, cursorX, cursorY])

  useEffect(() => {
    const dx = mousePosition.x - lastPositionRef.current.x
    const dy = mousePosition.y - lastPositionRef.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 8) {
      const newTrail: TrailPoint = {
        id: trailIdRef.current++,
        x: mousePosition.x,
        y: mousePosition.y,
        opacity: 0.8,
        scale: 1,
        rotation: Math.atan2(dy, dx) * (180 / Math.PI)
      }
      
      setTrails(prev => [...prev.slice(-15), newTrail])
      lastPositionRef.current = { x: mousePosition.x, y: mousePosition.y }
    }
  }, [mousePosition])

  useEffect(() => {
    const cleanup = setInterval(() => {
      setTrails(prev => prev.slice(-10))
    }, 100)
    return () => clearInterval(cleanup)
  }, [])

  const getThemeEffects = () => {
    const effects = {
      'default': {
        primary: { size: 300, blur: 80, opacity: 0.15, color: 'var(--theme-primary)' },
        secondary: { size: 200, blur: 50, opacity: 0.1, color: 'var(--theme-secondary)' },
        cursor: { size: 24, border: 2, opacity: 0.6 },
        trail: { size: 12, opacity: 0.4, shape: 'circle' as const },
        glow: { enabled: true, pulse: true },
        particles: { count: 3, spread: 30 }
      },
      'western-classical': {
        primary: { size: 350, blur: 100, opacity: 0.12, color: '#d4af37' },
        secondary: { size: 250, blur: 60, opacity: 0.08, color: '#ffd700' },
        cursor: { size: 28, border: 3, opacity: 0.7 },
        trail: { size: 16, opacity: 0.5, shape: 'star' as const },
        glow: { enabled: true, pulse: true },
        particles: { count: 5, spread: 40 }
      },
      'eastern-xianxia': {
        primary: { size: 400, blur: 120, opacity: 0.1, color: '#7dd3fc' },
        secondary: { size: 300, blur: 80, opacity: 0.06, color: '#c4b5fd' },
        cursor: { size: 20, border: 1, opacity: 0.5 },
        trail: { size: 14, opacity: 0.35, shape: 'petal' as const },
        glow: { enabled: true, pulse: false },
        particles: { count: 4, spread: 50 }
      },
      'minimalist': {
        primary: { size: 200, blur: 40, opacity: 0.06, color: '#ffffff' },
        secondary: { size: 150, blur: 30, opacity: 0.04, color: '#a3a3a3' },
        cursor: { size: 16, border: 1, opacity: 0.4 },
        trail: { size: 8, opacity: 0.2, shape: 'square' as const },
        glow: { enabled: false, pulse: false },
        particles: { count: 0, spread: 0 }
      },
      'modernism': {
        primary: { size: 280, blur: 60, opacity: 0.18, color: '#06b6d4' },
        secondary: { size: 220, blur: 50, opacity: 0.12, color: '#f43f5e' },
        cursor: { size: 20, border: 2, opacity: 0.7 },
        trail: { size: 10, opacity: 0.45, shape: 'diamond' as const },
        glow: { enabled: true, pulse: true },
        particles: { count: 4, spread: 35 }
      }
    }
    return effects[currentTheme] || effects['default']
  }

  const effects = getThemeEffects()

  const renderTrailShape = (trail: TrailPoint, index: number) => {
    const progress = index / trails.length
    const size = effects.trail.size * (0.5 + progress * 0.5)
    const opacity = effects.trail.opacity * progress

    const shapeStyles: Record<string, React.ReactNode> = {
      'circle': (
        <div
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle, ${effects.primary.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`
          }}
        />
      ),
      'star': (
        <div
          style={{
            width: size,
            height: size,
            transform: `rotate(${trail.rotation + index * 30}deg)`,
            background: `linear-gradient(45deg, ${effects.primary.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, transparent)`,
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
          }}
        />
      ),
      'petal': (
        <div
          className="rounded-full"
          style={{
            width: size * 1.5,
            height: size * 0.6,
            background: `linear-gradient(90deg, transparent, ${effects.primary.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, transparent)`,
            transform: `rotate(${trail.rotation + index * 45}deg)`,
            borderRadius: '50%'
          }}
        />
      ),
      'square': (
        <div
          style={{
            width: size,
            height: size,
            border: `1px solid ${effects.primary.color}${Math.round(opacity * 200).toString(16).padStart(2, '0')}`,
            transform: `rotate(${45 + index * 15}deg)`
          }}
        />
      ),
      'diamond': (
        <div
          style={{
            width: size,
            height: size,
            background: `linear-gradient(135deg, ${effects.primary.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${effects.secondary.color}${Math.round(opacity * 128).toString(16).padStart(2, '0')})`,
            transform: `rotate(${45 + trail.rotation}deg)`
          }}
        />
      )
    }

    return (
      <motion.div
        key={trail.id}
        className="absolute pointer-events-none"
        initial={{ opacity: opacity, scale: 1 }}
        animate={{ opacity: 0, scale: 0.3 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          left: trail.x - size / 2,
          top: trail.y - size / 2
        }}
      >
        {shapeStyles[effects.trail.shape]}
      </motion.div>
    )
  }

  if (!isVisible) return null

  return (
    <>
      <AnimatePresence>
        {trails.map((trail, index) => renderTrailShape(trail, index))}
      </AnimatePresence>

      {effects.glow.enabled && (
        <>
          <motion.div
            className="fixed pointer-events-none z-0 rounded-full"
            style={{
              x: glowX,
              y: glowY,
              translateX: '-50%',
              translateY: '-50%',
              width: effects.primary.size,
              height: effects.primary.size,
              background: `radial-gradient(circle, ${effects.primary.color} 0%, transparent 70%)`,
              filter: `blur(${effects.primary.blur}px)`,
              opacity: effects.primary.opacity
            }}
            animate={effects.glow.pulse ? {
              scale: [1, 1.1, 1],
              opacity: [effects.primary.opacity, effects.primary.opacity * 1.3, effects.primary.opacity]
            } : {}}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          <motion.div
            className="fixed pointer-events-none z-0 rounded-full"
            style={{
              x: secondaryGlowX,
              y: secondaryGlowY,
              translateX: '-50%',
              translateY: '-50%',
              width: effects.secondary.size,
              height: effects.secondary.size,
              background: `radial-gradient(circle, ${effects.secondary.color} 0%, transparent 70%)`,
              filter: `blur(${effects.secondary.blur}px)`,
              opacity: effects.secondary.opacity
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [effects.secondary.opacity, effects.secondary.opacity * 1.2, effects.secondary.opacity]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          />
        </>
      )}

      <motion.div
        className="fixed pointer-events-none z-10"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          width: effects.cursor.size,
          height: effects.cursor.size,
          border: `${effects.cursor.border}px solid ${effects.primary.color}`,
          borderRadius: currentTheme === 'modernism' ? '4px' : '50%',
          opacity: effects.cursor.opacity,
          transform: currentTheme === 'modernism' ? 'rotate(45deg)' : 'none'
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [effects.cursor.opacity, effects.cursor.opacity * 1.3, effects.cursor.opacity]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      <motion.div
        className="fixed pointer-events-none z-10"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          width: 4,
          height: 4,
          background: effects.primary.color,
          borderRadius: '50%',
          boxShadow: `0 0 10px ${effects.primary.color}, 0 0 20px ${effects.primary.color}`
        }}
      />

      {effects.particles.count > 0 && (
        <motion.div
          className="fixed pointer-events-none z-0"
          style={{
            x: cursorX,
            y: cursorY,
            translateX: '-50%',
            translateY: '-50%'
          }}
        >
          {Array.from({ length: effects.particles.count }).map((_, i) => {
            const angle = (i / effects.particles.count) * Math.PI * 2
            const distance = effects.particles.spread
            
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  background: effects.secondary.color,
                  boxShadow: `0 0 6px ${effects.secondary.color}`
                }}
                animate={{
                  x: [0, Math.cos(angle) * distance, 0],
                  y: [0, Math.sin(angle) * distance, 0],
                  opacity: [0.8, 0.3, 0.8],
                  scale: [1, 0.5, 1]
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2
                }}
              />
            )
          })}
        </motion.div>
      )}
    </>
  )
}

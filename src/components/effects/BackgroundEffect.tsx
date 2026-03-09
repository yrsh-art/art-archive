import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import type { ThemeStyle } from '../../types/theme'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
  maxLife: number
}

interface BackgroundEffectProps {
  intensity?: 'low' | 'medium' | 'high'
}

export default function BackgroundEffect({ intensity = 'medium' }: BackgroundEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>(undefined)
  const { currentTheme, mousePosition } = useTheme()

  const intensityMultiplier = {
    low: 0.5,
    medium: 1,
    high: 1.5
  }[intensity]

  const getThemeParticleConfig = useCallback((theme: ThemeStyle) => {
    const configs: Record<ThemeStyle, { 
      shape: 'circle' | 'star' | 'diamond' | 'petal' | 'line'
      count: number
      speed: number
      size: number
      trail: boolean
      glow: boolean
      connectionLines: boolean
    }> = {
      'default': {
        shape: 'circle',
        count: 50,
        speed: 0.5,
        size: 3,
        trail: true,
        glow: true,
        connectionLines: true
      },
      'western-classical': {
        shape: 'star',
        count: 40,
        speed: 0.3,
        size: 4,
        trail: true,
        glow: true,
        connectionLines: false
      },
      'eastern-xianxia': {
        shape: 'petal',
        count: 60,
        speed: 0.4,
        size: 5,
        trail: true,
        glow: true,
        connectionLines: false
      },
      'minimalist': {
        shape: 'line',
        count: 30,
        speed: 0.2,
        size: 2,
        trail: false,
        glow: false,
        connectionLines: true
      },
      'modernism': {
        shape: 'diamond',
        count: 45,
        speed: 0.6,
        size: 3,
        trail: false,
        glow: true,
        connectionLines: true
      }
    }
    return configs[theme]
  }, [])

  const createParticle = useCallback((x: number, y: number, config: ReturnType<typeof getThemeParticleConfig>): Particle => {
    const angle = Math.random() * Math.PI * 2
    const speed = (Math.random() * config.speed + 0.1) * intensityMultiplier
    
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * config.size + 1,
      opacity: Math.random() * 0.5 + 0.3,
      life: 0,
      maxLife: Math.random() * 100 + 50
    }
  }, [intensityMultiplier])

  const drawShape = useCallback((
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number, 
    shape: 'circle' | 'star' | 'diamond' | 'petal' | 'line',
    opacity: number
  ) => {
    ctx.save()
    ctx.globalAlpha = opacity

    switch (shape) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'star':
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
          const px = x + Math.cos(angle) * size
          const py = y + Math.sin(angle) * size
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        break

      case 'diamond':
        ctx.beginPath()
        ctx.moveTo(x, y - size)
        ctx.lineTo(x + size, y)
        ctx.lineTo(x, y + size)
        ctx.lineTo(x - size, y)
        ctx.closePath()
        ctx.fill()
        break

      case 'petal':
        ctx.beginPath()
        ctx.ellipse(x, y, size, size * 0.5, Math.random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'line':
        ctx.beginPath()
        ctx.moveTo(x - size, y)
        ctx.lineTo(x + size, y)
        ctx.stroke()
        break
    }

    ctx.restore()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const config = getThemeParticleConfig(currentTheme)
    particlesRef.current = []
    
    for (let i = 0; i < config.count * intensityMultiplier; i++) {
      particlesRef.current.push(
        createParticle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          config
        )
      )
    }

    const animate = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const config = getThemeParticleConfig(currentTheme)
      const particleColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-particle').trim() || 'rgba(139, 92, 246, 0.6)'

      if (config.connectionLines) {
        ctx.strokeStyle = particleColor
        ctx.lineWidth = 0.5
        
        for (let i = 0; i < particlesRef.current.length; i++) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const dx = particlesRef.current[i].x - particlesRef.current[j].x
            const dy = particlesRef.current[i].y - particlesRef.current[j].y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 150) {
              ctx.globalAlpha = (1 - distance / 150) * 0.3
              ctx.beginPath()
              ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y)
              ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y)
              ctx.stroke()
            }
          }
        }
      }

      ctx.fillStyle = particleColor
      ctx.strokeStyle = particleColor

      particlesRef.current.forEach((particle, index) => {
        const dx = mouseRef.current.x - particle.x
        const dy = mouseRef.current.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 200) {
          const force = (200 - distance) / 200
          particle.vx += (dx / distance) * force * 0.02
          particle.vy += (dy / distance) * force * 0.02
        }

        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++

        const lifeRatio = 1 - particle.life / particle.maxLife
        const currentOpacity = particle.opacity * lifeRatio

        if (config.glow) {
          ctx.shadowBlur = 10
          ctx.shadowColor = particleColor
        } else {
          ctx.shadowBlur = 0
        }

        drawShape(ctx, particle.x, particle.y, particle.size, config.shape, currentOpacity)

        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        if (particle.life >= particle.maxLife) {
          particlesRef.current[index] = createParticle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            config
          )
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [currentTheme, createParticle, drawShape, getThemeParticleConfig, intensityMultiplier])

  useEffect(() => {
    mouseRef.current = mousePosition
  }, [mousePosition])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  )
}

export type ThemeStyle = 
  | 'default'
  | 'western-classical'
  | 'eastern-xianxia'
  | 'minimalist'
  | 'modernism'

export interface ThemeConfig {
  id: ThemeStyle
  name: string
  nameEn: string
  description: string
  icon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  gradientStart: string
  gradientEnd: string
  particleColor: string
  glowColor: string
  textColor: string
  cardBg: string
  borderColor: string
}

export const themes: Record<ThemeStyle, ThemeConfig> = {
  'default': {
    id: 'default',
    name: '紫色',
    nameEn: 'Purple',
    description: '经典紫色主题',
    icon: '✨',
    primaryColor: '#8b5cf6',
    secondaryColor: '#6366f1',
    accentColor: '#a855f7',
    backgroundColor: '#0f0f23',
    gradientStart: '#1a1a3e',
    gradientEnd: '#0f0f23',
    particleColor: 'rgba(139, 92, 246, 0.6)',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    textColor: '#e2e8f0',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  'western-classical': {
    id: 'western-classical',
    name: '金色',
    nameEn: 'Gold',
    description: '温暖的金色调',
    icon: '🏛️',
    primaryColor: '#d4af37',
    secondaryColor: '#8b4513',
    accentColor: '#ffd700',
    backgroundColor: '#1a1410',
    gradientStart: '#2d1f15',
    gradientEnd: '#1a1410',
    particleColor: 'rgba(212, 175, 55, 0.5)',
    glowColor: 'rgba(212, 175, 55, 0.2)',
    textColor: '#f5e6d3',
    cardBg: 'rgba(45, 31, 21, 0.8)',
    borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  'eastern-xianxia': {
    id: 'eastern-xianxia',
    name: '天蓝',
    nameEn: 'Sky Blue',
    description: '清新的蓝色调',
    icon: '🌸',
    primaryColor: '#7dd3fc',
    secondaryColor: '#c4b5fd',
    accentColor: '#f0abfc',
    backgroundColor: '#0c1929',
    gradientStart: '#1e3a5f',
    gradientEnd: '#0c1929',
    particleColor: 'rgba(125, 211, 252, 0.4)',
    glowColor: 'rgba(196, 181, 253, 0.2)',
    textColor: '#e0f2fe',
    cardBg: 'rgba(30, 58, 95, 0.5)',
    borderColor: 'rgba(125, 211, 252, 0.2)'
  },
  'minimalist': {
    id: 'minimalist',
    name: '黑白',
    nameEn: 'Black & White',
    description: '简洁的黑白风格',
    icon: '◯',
    primaryColor: '#ffffff',
    secondaryColor: '#a3a3a3',
    accentColor: '#737373',
    backgroundColor: '#0a0a0a',
    gradientStart: '#171717',
    gradientEnd: '#0a0a0a',
    particleColor: 'rgba(255, 255, 255, 0.3)',
    glowColor: 'rgba(255, 255, 255, 0.1)',
    textColor: '#fafafa',
    cardBg: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  'modernism': {
    id: 'modernism',
    name: '青色',
    nameEn: 'Cyan',
    description: '明亮的青色调',
    icon: '◆',
    primaryColor: '#06b6d4',
    secondaryColor: '#f43f5e',
    accentColor: '#84cc16',
    backgroundColor: '#0a0a0f',
    gradientStart: '#18181b',
    gradientEnd: '#0a0a0f',
    particleColor: 'rgba(6, 182, 212, 0.5)',
    glowColor: 'rgba(244, 63, 94, 0.2)',
    textColor: '#fafafa',
    cardBg: 'rgba(24, 24, 27, 0.8)',
    borderColor: 'rgba(6, 182, 212, 0.2)'
  }
}

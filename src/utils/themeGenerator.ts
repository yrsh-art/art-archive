import { subjects, styles, moods, colors, environments, compositions } from '../data/themeWords'
import type { GeneratedTheme } from '../types/index'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export type Difficulty = 'simple' | 'medium' | 'full'

export interface ThemeSlots {
  subject: string
  style: string
  mood: string
  color: string
  environment: string
  extra: string
}

export function generateLocalTheme(difficulty: Difficulty): ThemeSlots {
  const theme: ThemeSlots = {
    subject: pick(subjects),
    style: pick(styles),
    mood: '',
    color: '',
    environment: '',
    extra: '',
  }

  if (difficulty === 'medium' || difficulty === 'full') {
    theme.mood = pick(moods)
    theme.color = pick(colors)
  }

  if (difficulty === 'full') {
    theme.environment = pick(environments)
    theme.extra = pick(compositions)
  }

  return theme
}

export function slotsToGeneratedTheme(slots: ThemeSlots, favorite = false): GeneratedTheme {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    subject: slots.subject,
    style: slots.style,
    mood: slots.mood,
    color: slots.color,
    environment: slots.environment,
    extra: slots.extra,
    createdAt: new Date().toISOString(),
    favorite,
  }
}

export function lockAndReroll(
  current: ThemeSlots,
  lockedSlots: Set<keyof ThemeSlots>,
  difficulty: Difficulty
): ThemeSlots {
  const newTheme = generateLocalTheme(difficulty)
  const result: ThemeSlots = { ...current }

  for (const key of Object.keys(newTheme) as (keyof ThemeSlots)[]) {
    if (!lockedSlots.has(key)) {
      result[key] = newTheme[key]
    }
  }

  return result
}

export function themeToText(slots: ThemeSlots): string {
  const parts = [slots.subject, slots.style]
  if (slots.mood) parts.push(slots.mood)
  if (slots.color) parts.push(slots.color)
  if (slots.environment) parts.push(slots.environment)
  if (slots.extra) parts.push(slots.extra)
  return parts.join(' / ')
}

export function getAIThemePrompt(userTags?: string[]): string {
  let prompt = '请生成一个有创意的绘画主题，包含以下要素并用JSON格式返回：\n'
  prompt += '{"subject": "主题", "style": "风格", "mood": "情绪", "color": "色调", "environment": "环境", "extra": "构图建议"}\n'
  prompt += '请确保主题有趣且有画面感。'
  if (userTags && userTags.length > 0) {
    prompt += `\n参考用户偏好标签: ${userTags.join(', ')}`
  }
  return prompt
}

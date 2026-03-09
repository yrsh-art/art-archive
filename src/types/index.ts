export interface Artwork {
  id: string
  title: string
  description: string
  tags: string[]
  category: string
  imageUrl: string
  createdAt: string
  favorite: boolean
  filePath?: string
  isOwnWork?: boolean
  artistNotes?: string
  showcaseOrder?: number
}

export type Category = {
  id: string
  name: string
  icon: string
  count: number
}

export interface UserCategory {
  id: string
  name: string
  icon?: string
  description?: string
  customIcon?: string
}

export type ArtworkFormData = {
  title: string
  description: string
  tags: string
  category: string
  image: File | null
}

export interface AppConfig {
  theme: string
  categories?: UserCategory[]
  aiProvider?: 'openai' | 'claude' | 'deepseek' | 'zhipu' | 'qwen' | 'custom'
  aiApiKey?: string
  aiModel?: string
  aiCustomBaseUrl?: string
  unsplashAccessKey?: string
  chatHistory?: ChatMessage[]
  themeHistory?: GeneratedTheme[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface GeneratedTheme {
  id: string
  subject: string
  style: string
  mood: string
  color: string
  environment?: string
  extra?: string
  createdAt: string
  favorite: boolean
}

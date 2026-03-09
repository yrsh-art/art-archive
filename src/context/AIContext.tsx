import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { AppConfig, ChatMessage } from '../types/index'

export type AIProviderType = 'openai' | 'claude' | 'deepseek' | 'zhipu' | 'qwen' | 'custom'

export interface ProviderConfig {
  label: string
  baseUrl: string
  format: 'openai' | 'claude'
  placeholder: string
  defaultModel: string
  models: string[]
}

export const PROVIDER_CONFIGS: Record<AIProviderType, ProviderConfig> = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    format: 'openai',
    placeholder: 'sk-...',
    defaultModel: 'gpt-3.5-turbo',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
  },
  claude: {
    label: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    format: 'claude',
    placeholder: 'sk-ant-...',
    defaultModel: 'claude-3-haiku-20240307',
    models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-5-sonnet-20241022'],
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    format: 'openai',
    placeholder: 'sk-...',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  },
  zhipu: {
    label: '智谱清言 (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    format: 'openai',
    placeholder: '你的智谱 API Key',
    defaultModel: 'glm-4-flash',
    models: ['glm-4', 'glm-4-flash', 'glm-4-plus', 'glm-4-air', 'glm-4v'],
  },
  qwen: {
    label: '通义千问 (Qwen)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    format: 'openai',
    placeholder: 'sk-...',
    defaultModel: 'qwen-turbo',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-long'],
  },
  custom: {
    label: '自定义 (OpenAI 兼容)',
    baseUrl: '',
    format: 'openai',
    placeholder: 'API Key',
    defaultModel: '',
    models: [],
  },
}

interface AIContextType {
  aiProvider: AIProviderType
  aiApiKey: string
  aiModel: string
  aiCustomBaseUrl: string
  unsplashAccessKey: string
  isConfigured: boolean
  isUnsplashConfigured: boolean
  setAiProvider: (p: AIProviderType) => void
  setAiApiKey: (k: string) => void
  setAiModel: (m: string) => void
  setAiCustomBaseUrl: (u: string) => void
  setUnsplashAccessKey: (k: string) => void
  sendMessage: (messages: ChatMessage[]) => Promise<string>
  saveSettings: () => Promise<void>
  loadSettings: () => Promise<void>
}

const AIContext = createContext<AIContextType | null>(null)

const isElectron = () => !!window.electronAPI

export function AIProvider({ children }: { children: ReactNode }) {
  const [aiProvider, setAiProvider] = useState<AIProviderType>('deepseek')
  const [aiApiKey, setAiApiKey] = useState('')
  const [aiModel, setAiModel] = useState('')
  const [aiCustomBaseUrl, setAiCustomBaseUrl] = useState('')
  const [unsplashAccessKey, setUnsplashAccessKey] = useState('')

  const isConfigured = !!aiApiKey
  const isUnsplashConfigured = !!unsplashAccessKey

  const loadSettings = useCallback(async () => {
    try {
      let config: AppConfig | null = null
      if (isElectron() && window.electronAPI!.loadAppConfig) {
        config = await window.electronAPI!.loadAppConfig()
      } else {
        const saved = localStorage.getItem('art-archive-app-config')
        if (saved) config = JSON.parse(saved)
      }
      if (config) {
        if (config.aiProvider) setAiProvider(config.aiProvider as AIProviderType)
        if (config.aiApiKey) setAiApiKey(config.aiApiKey)
        if (config.aiModel) setAiModel(config.aiModel)
        if (config.aiCustomBaseUrl) setAiCustomBaseUrl(config.aiCustomBaseUrl)
        if (config.unsplashAccessKey) setUnsplashAccessKey(config.unsplashAccessKey)
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error)
    }
  }, [])

  const saveSettings = useCallback(async () => {
    const config: Partial<AppConfig> = {
      aiProvider,
      aiApiKey,
      aiModel,
      aiCustomBaseUrl,
      unsplashAccessKey,
    }
    try {
      if (isElectron() && window.electronAPI!.saveAppConfig) {
        const existing = await window.electronAPI!.loadAppConfig()
        await window.electronAPI!.saveAppConfig({ ...existing, ...config })
      } else {
        const existing = localStorage.getItem('art-archive-app-config')
        const parsed = existing ? JSON.parse(existing) : {}
        localStorage.setItem('art-archive-app-config', JSON.stringify({ ...parsed, ...config }))
      }
    } catch (error) {
      console.error('Failed to save AI settings:', error)
    }
  }, [aiProvider, aiApiKey, aiModel, aiCustomBaseUrl, unsplashAccessKey])

  const sendMessage = useCallback(async (messages: ChatMessage[]): Promise<string> => {
    if (!aiApiKey) throw new Error('未配置 API Key')

    const config = PROVIDER_CONFIGS[aiProvider]
    const baseUrl = aiProvider === 'custom' ? aiCustomBaseUrl : config.baseUrl
    const model = aiModel || config.defaultModel

    if (isElectron() && window.electronAPI!.aiChat) {
      return await window.electronAPI!.aiChat({
        provider: aiProvider,
        apiKey: aiApiKey,
        model,
        messages,
        baseUrl,
      })
    }

    // Browser fallback: direct fetch (OpenAI-compatible only, Claude has CORS issues)
    if (config.format === 'openai') {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiApiKey}` },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'API request failed')
      return data.choices[0].message.content
    }

    throw new Error('浏览器模式仅支持 OpenAI 兼容格式的服务商')
  }, [aiProvider, aiApiKey, aiModel, aiCustomBaseUrl])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return (
    <AIContext.Provider value={{
      aiProvider, aiApiKey, aiModel, aiCustomBaseUrl, unsplashAccessKey,
      isConfigured, isUnsplashConfigured,
      setAiProvider, setAiApiKey, setAiModel, setAiCustomBaseUrl, setUnsplashAccessKey,
      sendMessage, saveSettings, loadSettings,
    }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}

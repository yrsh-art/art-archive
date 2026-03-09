import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Trash2, Settings, Loader2, Palette, Layout, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAI } from '../context/AIContext'
import type { ChatMessage } from '../types/index'

const SYSTEM_PROMPT = `你是一个专业的美术助手，帮助画师进行创作交流。你可以：
- 提供绘画技法建议
- 分析构图和色彩搭配
- 讨论艺术风格和灵感
- 给出创作方向建议
请用友好、专业的语气回复，适当使用术语但不要过于学术化。回复请控制在合理长度内。`

const quickQuestions = [
  { label: '帮我分析构图', icon: Layout, prompt: '请帮我分析一下常见的绘画构图方法，以及如何选择合适的构图。' },
  { label: '配色建议', icon: Palette, prompt: '请给我一些配色建议，如何选择和谐的色彩搭配方案。' },
  { label: '今天画什么', icon: Sparkles, prompt: '我今天不知道画什么，请给我一些有趣的绘画题材建议。' },
]

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-white/10 text-purple-300 text-sm">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-white mt-3 mb-1">$1</h2>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$1. $2</li>')
    .replace(/\n/g, '<br />')
}

export default function Chat() {
  const { isConfigured, sendMessage } = useAI()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        let config = null
        if (window.electronAPI?.loadAppConfig) {
          config = await window.electronAPI.loadAppConfig()
        } else {
          const saved = localStorage.getItem('art-archive-app-config')
          if (saved) config = JSON.parse(saved)
        }
        if (config?.chatHistory) {
          setMessages(config.chatHistory)
        }
      } catch {}
    }
    loadHistory()
  }, [])

  // Save chat history
  const saveHistory = useCallback(async (msgs: ChatMessage[]) => {
    try {
      if (window.electronAPI?.saveAppConfig && window.electronAPI?.loadAppConfig) {
        const config = await window.electronAPI.loadAppConfig()
        await window.electronAPI.saveAppConfig({ ...config, chatHistory: msgs })
      } else {
        const saved = localStorage.getItem('art-archive-app-config')
        const config = saved ? JSON.parse(saved) : {}
        localStorage.setItem('art-archive-app-config', JSON.stringify({ ...config, chatHistory: msgs }))
      }
    } catch {}
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async (text?: string) => {
    const content = text || input.trim()
    if (!content || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const apiMessages: ChatMessage[] = [
        { id: 'system', role: 'system', content: SYSTEM_PROMPT, timestamp: '' },
        ...newMessages.slice(-20), // Keep last 20 messages for context
      ]
      const response = await sendMessage(apiMessages)
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      const updatedMessages = [...newMessages, assistantMsg]
      setMessages(updatedMessages)
      saveHistory(updatedMessages)
    } catch (error: unknown) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，请求失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      }
      const updatedMessages = [...newMessages, errorMsg]
      setMessages(updatedMessages)
    }
    setIsLoading(false)
  }

  const clearChat = async () => {
    setMessages([])
    saveHistory([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">AI 画师助手</h2>
            <p className="text-gray-400 mb-6">
              需要先配置 AI 服务的 API Key 才能使用聊天功能
            </p>
            <Link to="/settings">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors flex items-center gap-2 mx-auto"
              >
                <Settings className="w-5 h-5" />
                前往设置
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10">
        <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          AI 画师助手
        </h1>
        <button
          onClick={clearChat}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          title="清空对话"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">开始和 AI 画师助手对话吧</p>
            <div className="flex flex-wrap justify-center gap-3">
              {quickQuestions.map((q) => {
                const Icon = q.icon
                return (
                  <motion.button
                    key={q.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend(q.prompt)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {q.label}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-600/80 text-white rounded-br-sm'
                    : 'glass text-gray-200 rounded-bl-sm'
                }`}
              >
                <div
                  className="text-sm leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                <p className="text-[10px] text-white/40 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">思考中...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions when there are messages */}
      {messages.length > 0 && (
        <div className="flex gap-2 px-4 sm:px-6 pb-2 overflow-x-auto">
          {quickQuestions.map((q) => (
            <button
              key={q.label}
              onClick={() => handleSend(q.prompt)}
              disabled={isLoading}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-purple-300 hover:border-purple-500/50 transition-colors disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 sm:px-6 py-3 border-t border-white/10">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift+Enter 换行)"
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder:text-gray-500 resize-none max-h-40"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

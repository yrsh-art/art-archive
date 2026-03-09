import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dice5, Lock, Unlock, Sparkles, Star, History, Wand2, ArrowRight, ChevronDown, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAI } from '../context/AIContext'
import {
  generateLocalTheme,
  lockAndReroll,
  slotsToGeneratedTheme,
  themeToText,
  getAIThemePrompt,
  type Difficulty,
  type ThemeSlots,
} from '../utils/themeGenerator'
import type { GeneratedTheme } from '../types/index'

const STORAGE_KEY = 'art-archive-theme-history'

const isElectron = () => !!window.electronAPI

async function loadHistory(): Promise<GeneratedTheme[]> {
  try {
    if (isElectron() && window.electronAPI!.loadAppConfig) {
      const config = await window.electronAPI!.loadAppConfig()
      return config?.themeHistory || []
    }
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

async function persistHistory(history: GeneratedTheme[]) {
  try {
    if (isElectron() && window.electronAPI!.saveAppConfig) {
      const existing = await window.electronAPI!.loadAppConfig()
      await window.electronAPI!.saveAppConfig({ ...existing, themeHistory: history })
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
  } catch (error) {
    console.error('Failed to save theme history:', error)
  }
}

const slotLabels: Record<keyof ThemeSlots, string> = {
  subject: '主题',
  style: '风格',
  mood: '情绪',
  color: '色调',
  environment: '环境',
  extra: '构图',
}

const slotColors: Record<keyof ThemeSlots, string> = {
  subject: 'from-purple-500 to-indigo-500',
  style: 'from-pink-500 to-rose-500',
  mood: 'from-cyan-500 to-blue-500',
  color: 'from-orange-500 to-amber-500',
  environment: 'from-green-500 to-emerald-500',
  extra: 'from-violet-500 to-purple-500',
}

export default function ThemeGenerator() {
  const navigate = useNavigate()
  const { isConfigured, sendMessage } = useAI()
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [currentTheme, setCurrentTheme] = useState<ThemeSlots | null>(null)
  const [lockedSlots, setLockedSlots] = useState<Set<keyof ThemeSlots>>(new Set())
  const [history, setHistory] = useState<GeneratedTheme[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Load history from storage on mount
  useEffect(() => {
    loadHistory().then(setHistory)
  }, [])

  // Persist whenever history changes (skip initial empty state)
  const historyLoaded = history.length > 0 || showHistory
  useEffect(() => {
    if (historyLoaded) {
      persistHistory(history)
    }
  }, [history, historyLoaded])

  const generate = useCallback(() => {
    setIsFlipping(true)
    setTimeout(() => {
      if (currentTheme) {
        const newTheme = lockAndReroll(currentTheme, lockedSlots, difficulty)
        setCurrentTheme(newTheme)
      } else {
        setCurrentTheme(generateLocalTheme(difficulty))
      }
      setIsFlipping(false)
    }, 300)
  }, [currentTheme, lockedSlots, difficulty])

  const generateFirst = useCallback(() => {
    setIsFlipping(true)
    setTimeout(() => {
      setCurrentTheme(generateLocalTheme(difficulty))
      setLockedSlots(new Set())
      setIsFlipping(false)
    }, 300)
  }, [difficulty])

  const toggleLock = (slot: keyof ThemeSlots) => {
    setLockedSlots(prev => {
      const next = new Set(prev)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  const saveToHistory = () => {
    if (!currentTheme) return
    const theme = slotsToGeneratedTheme(currentTheme)
    setHistory(prev => [theme, ...prev])
  }

  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t))
  }

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(t => t.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
  }

  const generateWithAI = async () => {
    if (!isConfigured) return
    setAiLoading(true)
    try {
      const prompt = getAIThemePrompt()
      const response = await sendMessage([
        { id: 's', role: 'system', content: '你是一个富有创意的绘画主题生成器。只返回JSON，不要其他内容。', timestamp: '' },
        { id: 'u', role: 'user', content: prompt, timestamp: '' },
      ])
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setCurrentTheme({
          subject: parsed.subject || '',
          style: parsed.style || '',
          mood: parsed.mood || '',
          color: parsed.color || '',
          environment: parsed.environment || '',
          extra: parsed.extra || '',
        })
      }
    } catch (error) {
      console.error('AI theme generation failed:', error)
    }
    setAiLoading(false)
  }

  const visibleSlots = (() => {
    const all: (keyof ThemeSlots)[] = ['subject', 'style', 'mood', 'color', 'environment', 'extra']
    if (difficulty === 'simple') return all.slice(0, 2)
    if (difficulty === 'medium') return all.slice(0, 4)
    return all
  })()

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
            <Dice5 className="w-8 h-8" />
            绘画主题生成器
          </h1>
          <p className="text-gray-400">随机生成绘画主题，激发你的创作灵感</p>
        </motion.div>

        {/* Difficulty selector */}
        <div className="flex gap-3 mb-8">
          {(['simple', 'medium', 'full'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                difficulty === d
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {d === 'simple' ? '简单' : d === 'medium' ? '中等' : '完整'}
            </button>
          ))}
        </div>

        {/* Theme card */}
        <motion.div
          className="glass rounded-2xl p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {!currentTheme ? (
            <div className="text-center py-12">
              <Dice5 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 mb-6">点击下方按钮生成你的绘画主题</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateFirst}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-lg glow"
              >
                <Sparkles className="w-5 h-5 inline mr-2" />
                生成主题
              </motion.button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipping ? 'flipping' : 'stable'}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {visibleSlots.map((slot) => {
                    const value = currentTheme[slot]
                    if (!value && (slot !== 'subject' && slot !== 'style')) return null
                    const isLocked = lockedSlots.has(slot)
                    return (
                      <motion.div
                        key={slot}
                        className="relative group"
                        whileHover={{ scale: 1.03 }}
                      >
                        <div className={`rounded-xl p-4 bg-gradient-to-br ${slotColors[slot]} bg-opacity-20`}
                          style={{ background: `linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400 uppercase">{slotLabels[slot]}</span>
                            <button
                              onClick={() => toggleLock(slot)}
                              className={`p-1 rounded transition-colors ${
                                isLocked ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-lg font-bold text-white">{value || '-'}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Full text summary */}
                <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-gray-300 text-center text-lg">
                    {themeToText(currentTheme)}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Action buttons */}
        {currentTheme && (
          <div className="flex flex-wrap gap-3 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generate}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold glow"
            >
              <Dice5 className="w-5 h-5" />
              重新生成
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveToHistory}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20"
            >
              <Star className="w-5 h-5" />
              保存
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateWithAI}
              disabled={!isConfigured || aiLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600/80 text-white hover:bg-cyan-500/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className={`w-5 h-5 ${aiLoading ? 'animate-spin' : ''}`} />
              {aiLoading ? 'AI 生成中...' : 'AI 生成'}
              {!isConfigured && <span className="text-xs">(需配置)</span>}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/canvas', { state: { theme: themeToText(currentTheme) } })}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600/80 text-white hover:bg-green-500/80"
            >
              用这个主题
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        )}

        {/* History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2 text-gray-300">
              <History className="w-5 h-5" />
              历史记录 ({history.length})
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10"
              >
                {history.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    暂无历史记录，生成主题后点击"保存"即可记录
                  </div>
                ) : (
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {/* Clear all button */}
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={clearHistory}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        清空全部
                      </button>
                    </div>

                    {history.map((theme) => (
                      <motion.div
                        key={theme.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, height: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <p className="text-sm text-gray-300 flex-1 min-w-0 truncate">
                          {[theme.subject, theme.style, theme.mood, theme.color, theme.environment, theme.extra]
                            .filter(Boolean)
                            .join(' / ')}
                        </p>
                        <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                          <button
                            onClick={() => toggleFavorite(theme.id)}
                            className={`p-1.5 rounded transition-colors ${theme.favorite ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
                            title={theme.favorite ? '取消收藏' : '收藏'}
                          >
                            <Star className={`w-4 h-4 ${theme.favorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => {
                              setCurrentTheme({
                                subject: theme.subject,
                                style: theme.style,
                                mood: theme.mood,
                                color: theme.color,
                                environment: theme.environment || '',
                                extra: theme.extra || '',
                              })
                            }}
                            className="px-2 py-1 rounded text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                            title="使用此主题"
                          >
                            使用
                          </button>
                          <button
                            onClick={() => deleteFromHistory(theme.id)}
                            className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Key, Bot, ImageIcon, Check, AlertCircle, Loader2, Globe } from 'lucide-react'
import { useAI, PROVIDER_CONFIGS, type AIProviderType } from '../context/AIContext'

const providerOrder: AIProviderType[] = ['openai', 'claude', 'deepseek', 'zhipu', 'qwen', 'custom']

export default function Settings() {
  const {
    aiProvider, aiApiKey, aiModel, aiCustomBaseUrl, unsplashAccessKey,
    setAiProvider, setAiApiKey, setAiModel, setAiCustomBaseUrl, setUnsplashAccessKey,
    saveSettings, sendMessage,
  } = useAI()

  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const currentConfig = PROVIDER_CONFIGS[aiProvider]

  const handleSave = async () => {
    await saveSettings()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const testConnection = async () => {
    if (!aiApiKey) {
      setTestResult({ success: false, message: '请先填写 API Key' })
      return
    }
    if (aiProvider === 'custom' && !aiCustomBaseUrl) {
      setTestResult({ success: false, message: '请填写自定义 API 地址' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const testMsg = [{ id: 'test', role: 'user' as const, content: 'Hi', timestamp: new Date().toISOString() }]
      await sendMessage(testMsg)
      setTestResult({ success: true, message: '连接成功！' })
    } catch (error: unknown) {
      setTestResult({ success: false, message: `连接失败: ${error instanceof Error ? error.message : String(error)}` })
    }
    setTesting(false)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            设置
          </h1>
          <p className="text-gray-400">配置 AI 服务和外部 API</p>
        </motion.div>

        <div className="space-y-6">
          {/* AI Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              AI 画师助手
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">AI 服务商</label>
                <div className="grid grid-cols-3 gap-2">
                  {providerOrder.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setAiProvider(p)
                        setAiModel('')
                      }}
                      className={`px-3 py-2.5 rounded-lg border transition-colors text-sm ${
                        aiProvider === p
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {PROVIDER_CONFIGS[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {aiProvider === 'custom' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    API 地址 (OpenAI 兼容格式)
                  </label>
                  <input
                    type="text"
                    value={aiCustomBaseUrl}
                    onChange={(e) => setAiCustomBaseUrl(e.target.value)}
                    placeholder="https://your-api.com/v1"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder:text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    支持任何 OpenAI 兼容的 API 端点，如 LocalAI、Ollama、vLLM 等
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  API Key
                </label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder={currentConfig.placeholder}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">模型</label>
                {currentConfig.models.length > 0 ? (
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white"
                  >
                    <option value="" className="bg-gray-800">默认 ({currentConfig.defaultModel})</option>
                    {currentConfig.models.map(m => (
                      <option key={m} value={m} className="bg-gray-800">{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="模型名称（如不确定可留空）"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder:text-gray-600"
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={testConnection}
                  disabled={testing || !aiApiKey}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  测试连接
                </button>
                {testResult && (
                  <span className={`text-sm flex items-center gap-1 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {testResult.message}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Unsplash Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              Unsplash 素材发现
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Access Key
                </label>
                <input
                  type="password"
                  value={unsplashAccessKey}
                  onChange={(e) => setUnsplashAccessKey(e.target.value)}
                  placeholder="Unsplash Access Key"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder:text-gray-600"
                />
              </div>
              <p className="text-xs text-gray-500">
                前往 unsplash.com/developers 注册应用获取 Access Key
              </p>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white glow flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                已保存
              </>
            ) : (
              <>
                <SettingsIcon className="w-5 h-5" />
                保存设置
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

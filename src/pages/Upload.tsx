import { useState, useRef, useEffect } from 'react'
import type { DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, X, Check, Sparkles, Plus, Trash2, Crown } from 'lucide-react'
import { useArtworks } from '../context/ArtworkContext'
import { getRandomEncouragement, checkMilestone } from '../data/encouragements'

interface BatchFile {
  id: string
  file: File
  preview: string
  title: string
}

export default function UploadPage() {
  const { addArtwork, categories, artworks } = useArtworks()
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<BatchFile[]>([])
  const [formData, setFormData] = useState({
    description: '',
    tags: '',
    category: categories[0]?.id || 'other',
  })
  const [isOwnWork, setIsOwnWork] = useState(false)
  const [artistNotes, setArtistNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [encouragement, setEncouragement] = useState('')
  const [milestone, setMilestone] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const items = e.clipboardData.items
      const imageFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) imageFiles.push(blob)
        }
      }
      if (imageFiles.length > 0) {
        handleFilesSelect(imageFiles)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (droppedFiles.length > 0) {
      handleFilesSelect(droppedFiles)
    }
  }

  const handleFilesSelect = (newFiles: File[]) => {
    const promises = newFiles.map(file => {
      return new Promise<BatchFile>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
          resolve({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            preview: e.target?.result as string,
            title: nameWithoutExt,
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(promises).then(batchFiles => {
      setFiles(prev => [...prev, ...batchFiles])
    })
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const updateFileTitle = (id: string, title: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, title } : f))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    setIsSubmitting(true)
    setUploadTotal(files.length)
    setUploadProgress(0)

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      await addArtwork({
        title: f.title || '未命名素材',
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        category: formData.category,
        imageUrl: f.preview,
        isOwnWork: isOwnWork || undefined,
        artistNotes: isOwnWork ? artistNotes : undefined,
      })
      setUploadProgress(i + 1)
    }

    setIsSubmitting(false)
    setShowSuccess(true)

    // Show encouragement for own works
    if (isOwnWork) {
      setEncouragement(getRandomEncouragement())
      const ownWorkCount = artworks.filter(a => a.isOwnWork).length + files.length
      const ms = checkMilestone(ownWorkCount)
      if (ms) setMilestone(ms)
    }

    setTimeout(() => {
      setShowSuccess(false)
      setFiles([])
      setFormData({
        description: '',
        tags: '',
        category: categories[0]?.id || 'other',
      })
      setIsOwnWork(false)
      setArtistNotes('')
      setUploadProgress(0)
      setUploadTotal(0)
      setEncouragement('')
      setMilestone(null)
    }, isOwnWork ? 4000 : 2000)
  }

  const clearAll = () => {
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">上传素材</h1>
          <p className="text-gray-400">添加新的艺术素材到你的收藏库</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Drop zone / Preview area */}
          {files.length === 0 ? (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || [])
                  if (selected.length > 0) handleFilesSelect(selected)
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center py-16 px-4 pointer-events-none">
                <motion.div
                  animate={{ y: isDragging ? -10 : 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {isDragging ? (
                    <Image className="w-16 h-16 text-purple-400 mb-4" />
                  ) : (
                    <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  )}
                </motion.div>
                <p className="text-lg text-gray-300 mb-2">
                  {isDragging ? '松开以上传图片' : '拖拽图片到这里'}
                </p>
                <p className="text-sm text-gray-500">
                  或点击选择文件 · Ctrl+V 粘贴 · 支持多选 · JPG, PNG, GIF, SVG
                </p>
              </div>
            </div>
          ) : files.length === 1 ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <div className="relative aspect-video">
                <img
                  src={files[0].preview}
                  alt="Preview"
                  className="w-full h-full object-contain bg-black/20"
                />
                <button
                  type="button"
                  onClick={clearAll}
                  className="absolute top-4 right-4 p-2 rounded-full glass text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3">
                <input
                  type="text"
                  value={files[0].title}
                  onChange={(e) => updateFileTitle(files[0].id, e.target.value)}
                  placeholder="标题"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white text-sm"
                />
              </div>
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center p-3 border-t border-white/10 text-gray-400 hover:text-purple-400 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-sm">添加更多</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || [])
                  if (selected.length > 0) handleFilesSelect(selected)
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3">
                {files.map((f) => (
                  <div key={f.id} className="relative group rounded-lg overflow-hidden bg-black/20">
                    <div className="aspect-square">
                      <img
                        src={f.preview}
                        alt={f.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="p-1.5">
                      <input
                        type="text"
                        value={f.title}
                        onChange={(e) => updateFileTitle(f.id, e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center p-3 border-t border-white/10 text-gray-400 hover:text-purple-400 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-sm">添加更多</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || [])
                  if (selected.length > 0) handleFilesSelect(selected)
                }}
                className="hidden"
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {files.length <= 1 && (
                <>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    标题 <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={files.length === 1 ? files[0].title : ''}
                    onChange={(e) => {
                      if (files.length === 1) updateFileTitle(files[0].id, e.target.value)
                    }}
                    placeholder="给素材起个名字"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-colors placeholder:text-gray-500"
                  />
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                分类 <span className="text-purple-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-gray-800">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="描述一下这个素材..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-colors resize-none placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              标签
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="用逗号分隔多个标签，如：风景, 夕阳, 山脉"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-colors placeholder:text-gray-500"
            />
            {formData.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.split(',').map((tag, i) => (
                  tag.trim() && (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300"
                    >
                      {tag.trim()}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Own work checkbox + artist notes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                isOwnWork ? 'bg-amber-500 border-amber-500' : 'border-white/20 group-hover:border-amber-500/50'
              }`}
                onClick={() => setIsOwnWork(!isOwnWork)}
              >
                {isOwnWork && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-gray-300 flex items-center gap-2" onClick={() => setIsOwnWork(!isOwnWork)}>
                <Crown className="w-4 h-4 text-amber-400" />
                这是我的作品（收录到个人典藏馆）
              </span>
            </label>

            <AnimatePresence>
              {isOwnWork && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <textarea
                    value={artistNotes}
                    onChange={(e) => setArtistNotes(e.target.value)}
                    placeholder="创作笔记 / 感想（可选）"
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20 focus:border-amber-500 focus:outline-none transition-colors resize-none placeholder:text-gray-500"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Encouragement display */}
          <AnimatePresence>
            {encouragement && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-center"
              >
                <p className="text-amber-300 font-medium">{encouragement}</p>
                {milestone && (
                  <p className="text-amber-400 text-sm mt-2 font-semibold">{milestone}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          {isSubmitting && uploadTotal > 1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>上传进度</span>
                <span>{uploadProgress}/{uploadTotal}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(uploadProgress / uploadTotal) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={files.length === 0 || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              files.length > 0 && !isSubmitting
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white glow'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {showSuccess ? (
              <>
                <Check className="w-5 h-5" />
                上传成功！
              </>
            ) : isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                上传中...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                {files.length > 1 ? `上传全部 (${files.length})` : '上传素材'}
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  )
}

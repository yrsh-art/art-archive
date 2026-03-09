import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Palette, Camera, Box, Type, Lightbulb, Users, Mountain, Sparkles,
  ArrowRight, Plus, Pencil, Trash2, X, Check, Layers, PenTool
} from 'lucide-react'
import { useArtworks } from '../context/ArtworkContext'
import type { UserCategory } from '../types/index'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette, Camera, Box, Type, Lightbulb, Users, Mountain, Sparkles, Layers, PenTool,
}

const availableIcons = Object.keys(iconMap)

const colorCycle = [
  { color: 'from-purple-500 to-indigo-500', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
  { color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-500/20', textColor: 'text-pink-400' },
  { color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400' },
  { color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' },
  { color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
  { color: 'from-violet-500 to-purple-500', bgColor: 'bg-violet-500/20', textColor: 'text-violet-400' },
  { color: 'from-teal-500 to-cyan-500', bgColor: 'bg-teal-500/20', textColor: 'text-teal-400' },
  { color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400' },
]

const ICON_SIZE = 64
const ICON_DISPLAY_SIZE = 160

const iconColors = [
  '#a78bfa', '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
  '#fb923c', '#ef4444', '#ffffff', '#94a3b8', '#000000',
]

function getCategoryColor(index: number) {
  return colorCycle[index % colorCycle.length]
}

export default function Categories() {
  const { artworks, categories, addCategory, updateCategory, deleteCategory } = useArtworks()
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null)
  const [modalForm, setModalForm] = useState({ name: '', icon: 'Sparkles', description: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [iconTab, setIconTab] = useState<'preset' | 'custom'>('preset')
  const [customIconData, setCustomIconData] = useState<string>('')
  const miniCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawingIcon, setIsDrawingIcon] = useState(false)
  const iconFileInputRef = useRef<HTMLInputElement>(null)
  const [iconBrushColor, setIconBrushColor] = useState('#a78bfa')
  const [iconBrushSize, setIconBrushSize] = useState(2)
  const [iconIsErasing, setIconIsErasing] = useState(false)

  const initMiniCanvas = useCallback(() => {
    const canvas = miniCanvasRef.current
    if (!canvas) return
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, ICON_SIZE, ICON_SIZE)
  }, [])

  const handleMiniCanvasDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingIcon) return
    const canvas = miniCanvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const scaleX = ICON_SIZE / rect.width
    const scaleY = ICON_SIZE / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    ctx.fillStyle = iconIsErasing ? '#1a1a2e' : iconBrushColor
    ctx.beginPath()
    ctx.arc(x, y, iconBrushSize, 0, Math.PI * 2)
    ctx.fill()
  }

  const saveMiniCanvasIcon = () => {
    const canvas = miniCanvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    setCustomIconData(dataUrl)
  }

  const handleImportIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = miniCanvasRef.current
        if (!canvas) return
        canvas.width = ICON_SIZE
        canvas.height = ICON_SIZE
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, ICON_SIZE, ICON_SIZE)
        // Scale to fit
        const scale = Math.min(ICON_SIZE / img.width, ICON_SIZE / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const dx = (ICON_SIZE - w) / 2
        const dy = (ICON_SIZE - h) / 2
        ctx.drawImage(img, dx, dy, w, h)
        saveMiniCanvasIcon()
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    if (iconFileInputRef.current) iconFileInputRef.current.value = ''
  }

  const getCategoryCount = (categoryId: string) => {
    return artworks.filter(a => a.category === categoryId).length
  }

  const openAddModal = () => {
    setEditingCategory(null)
    setModalForm({ name: '', icon: 'Sparkles', description: '' })
    setIconTab('preset')
    setCustomIconData('')
    setIconBrushColor('#a78bfa')
    setIconBrushSize(2)
    setIconIsErasing(false)
    setShowModal(true)
  }

  const openEditModal = (cat: UserCategory) => {
    setEditingCategory(cat)
    setModalForm({ name: cat.name, icon: cat.icon || 'Sparkles', description: cat.description || '' })
    setIconTab(cat.customIcon ? 'custom' : 'preset')
    setCustomIconData(cat.customIcon || '')
    setIconBrushColor('#a78bfa')
    setIconBrushSize(2)
    setIconIsErasing(false)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!modalForm.name.trim()) return

    const categoryData: Partial<UserCategory> = {
      name: modalForm.name.trim(),
      icon: modalForm.icon,
      description: modalForm.description.trim(),
      customIcon: iconTab === 'custom' && customIconData ? customIconData : undefined,
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryData)
    } else {
      const id = modalForm.name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      await addCategory({
        id: id + '-' + Date.now().toString(36),
        ...categoryData,
      } as UserCategory)
    }
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    await deleteCategory(id)
    setShowDeleteConfirm(null)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">素材分类</h1>
            <p className="text-gray-400">按类型浏览和管理你的艺术素材</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加分类
          </motion.button>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {categories.map((category, index) => {
            const colors = getCategoryColor(index)
            const IconComponent = iconMap[category.icon || 'Sparkles'] || Sparkles
            const count = getCategoryCount(category.id)

            return (
              <motion.div
                key={category.id}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                <Link to={`/gallery?category=${category.id}`}>
                  <div className="glass rounded-xl p-6 h-full card-hover">
                    <div className={`w-14 h-14 rounded-xl ${colors.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      {category.customIcon ? (
                        <img src={category.customIcon} alt="" className="w-7 h-7 rounded" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <IconComponent className={`w-7 h-7 ${colors.textColor}`} />
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {category.name}
                    </h3>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {category.description || ''}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${colors.textColor}`}>
                        {count} 个素材
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>

                {/* Edit/Delete buttons on hover */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); openEditModal(category) }}
                    className="p-1.5 rounded-lg glass text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {category.id !== 'other' && (
                    <button
                      onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(category.id) }}
                      className="p-1.5 rounded-lg glass text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 glass rounded-xl p-8 text-center"
        >
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">需要新的分类？</h3>
          <p className="text-gray-400 mb-4">点击上方"添加分类"创建自定义分类来组织你的素材</p>
          <Link to="/upload">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors"
            >
              上传新素材
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingCategory ? '编辑分类' : '添加分类'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">名称 *</label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="分类名称"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">图标</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setIconTab('preset')}
                    className={`text-xs px-3 py-1 rounded-lg ${iconTab === 'preset' ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-400'}`}
                  >
                    预设图标
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIconTab('custom'); setTimeout(initMiniCanvas, 50) }}
                    className={`text-xs px-3 py-1 rounded-lg ${iconTab === 'custom' ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-400'}`}
                  >
                    自定义图标
                  </button>
                </div>
                {iconTab === 'preset' ? (
                  <div className="flex flex-wrap gap-2">
                    {availableIcons.map(iconName => {
                      const Ic = iconMap[iconName]
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setModalForm(f => ({ ...f, icon: iconName }))}
                          className={`p-2 rounded-lg transition-colors ${
                            modalForm.icon === iconName
                              ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-500'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <Ic className="w-5 h-5" />
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Color palette */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {iconColors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setIconBrushColor(c); setIconIsErasing(false) }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            !iconIsErasing && iconBrushColor === c ? 'border-white scale-110' : 'border-white/20'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={iconBrushColor}
                        onChange={(e) => { setIconBrushColor(e.target.value); setIconIsErasing(false) }}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        title="自定义颜色"
                      />
                      <button
                        type="button"
                        onClick={() => setIconIsErasing(!iconIsErasing)}
                        className={`px-2 py-1 rounded text-xs ml-1 ${
                          iconIsErasing ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        橡皮擦
                      </button>
                    </div>

                    {/* Brush size */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">笔触:</span>
                      {[1, 2, 3, 4].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setIconBrushSize(s)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            iconBrushSize === s ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-400'
                          }`}
                        >
                          <div className="rounded-full bg-current" style={{ width: s * 3, height: s * 3 }} />
                        </button>
                      ))}
                    </div>

                    {/* Canvas + controls */}
                    <div className="flex items-start gap-3">
                      <canvas
                        ref={miniCanvasRef}
                        className="border border-white/20 rounded cursor-crosshair bg-[#1a1a2e] flex-shrink-0"
                        style={{ width: ICON_DISPLAY_SIZE, height: ICON_DISPLAY_SIZE, imageRendering: 'pixelated' }}
                        onMouseDown={() => setIsDrawingIcon(true)}
                        onMouseUp={() => { setIsDrawingIcon(false); saveMiniCanvasIcon() }}
                        onMouseLeave={() => { setIsDrawingIcon(false); saveMiniCanvasIcon() }}
                        onMouseMove={handleMiniCanvasDraw}
                      />
                      <div className="text-xs text-gray-500 space-y-2">
                        <p>{ICON_SIZE}x{ICON_SIZE} 像素画板</p>
                        {customIconData && (
                          <div>
                            <span className="text-gray-400">预览: </span>
                            <img src={customIconData} className="inline w-8 h-8 rounded" style={{ imageRendering: 'pixelated' }} />
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={initMiniCanvas}
                            className="text-purple-400 hover:text-purple-300 text-left"
                          >
                            清空重画
                          </button>
                          <button
                            type="button"
                            onClick={() => iconFileInputRef.current?.click()}
                            className="text-cyan-400 hover:text-cyan-300 text-left"
                          >
                            导入图片
                          </button>
                          <input
                            ref={iconFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImportIcon}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">描述</label>
                <input
                  type="text"
                  value={modalForm.description}
                  onChange={(e) => setModalForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="简短描述（可选）"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!modalForm.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  {editingCategory ? '保存' : '添加'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-3">确认删除</h3>
            <p className="text-gray-400 mb-2">
              确定要删除分类"{categories.find(c => c.id === showDeleteConfirm)?.name}"吗？
            </p>
            {getCategoryCount(showDeleteConfirm) > 0 && (
              <p className="text-amber-400 text-sm mb-4">
                该分类下有 {getCategoryCount(showDeleteConfirm)} 个素材，将被移至"其他"分类。
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                删除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
              >
                取消
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

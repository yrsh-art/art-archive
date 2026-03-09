import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ExternalLink, Trash2, Calendar, Tag, Pencil, Save, X } from 'lucide-react'
import type { Artwork } from '../../types/index'
import { useArtworks } from '../../context/ArtworkContext'

interface ArtworkCardProps {
  artwork: Artwork
  index: number
  selectable?: boolean
  selected?: boolean
  onSelect?: (id: string) => void
}

export default function ArtworkCard({ artwork, index, selectable, selected, onSelect }: ArtworkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: artwork.title,
    category: artwork.category,
    description: artwork.description,
    tags: artwork.tags.join(', '),
  })
  const { toggleFavorite, deleteArtwork, updateArtwork, categories } = useArtworks()
  const navigate = useNavigate()

  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    categories.forEach(c => { labels[c.id] = c.name })
    return labels
  }, [categories])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleStartEdit = () => {
    setEditForm({
      title: artwork.title,
      category: artwork.category,
      description: artwork.description,
      tags: artwork.tags.join(', '),
    })
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    await updateArtwork(artwork.id, {
      title: editForm.title || '未命名素材',
      category: editForm.category,
      description: editForm.description,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleTagClick = (tag: string) => {
    setShowModal(false)
    navigate(`/gallery?tag=${encodeURIComponent(tag)}`)
  }

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(artwork.id)
    } else {
      setShowModal(true)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className={`group relative rounded-xl overflow-hidden glass card-hover cursor-pointer ${
          selected ? 'ring-2 ring-purple-500' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="aspect-square overflow-hidden">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {!selectable && (
          <motion.div
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute top-3 right-3 flex gap-2"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(artwork.id)
              }}
              className={`p-2 rounded-full glass transition-colors ${
                artwork.favorite
                  ? 'text-red-400'
                  : 'text-white/70 hover:text-red-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${artwork.favorite ? 'fill-red-400' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('确定要删除这个素材吗？')) {
                  deleteArtwork(artwork.id)
                }
              }}
              className="p-2 rounded-full glass text-white/70 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-semibold text-white mb-1 truncate">{artwork.title}</h3>
          <p className="text-sm text-gray-300 line-clamp-2">{artwork.description}</p>
        </div>

        {artwork.favorite && !selectable && (
          <div className="absolute top-3 left-3">
            <Heart className="w-5 h-5 text-red-400 fill-red-400" />
          </div>
        )}
      </motion.div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => { setShowModal(false); setIsEditing(false) }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-4xl w-full max-h-[90vh] overflow-auto glass rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="p-2 rounded-full glass text-white/70 hover:text-purple-400 transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => { setShowModal(false); setIsEditing(false) }}
                className="p-2 rounded-full glass text-white/70 hover:text-white transition-colors"
              >
                <ExternalLink className="w-5 h-5 rotate-180" />
              </button>
            </div>

            <div className="md:flex">
              <div className="md:w-2/3">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
              <div className="p-6 md:w-1/3">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">标题</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">分类</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-gray-800">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">描述</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">标签（逗号分隔）</label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm(f => ({ ...f, tags: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-4">{artwork.title}</h2>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(artwork.createdAt)}</span>
                      </div>

                      <div>
                        <span className="inline-block px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300">
                          {categoryLabels[artwork.category] || artwork.category}
                        </span>
                      </div>

                      <p className="text-gray-300">{artwork.description}</p>

                      {artwork.tags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2 text-gray-400">
                            <Tag className="w-4 h-4" />
                            <span className="text-sm">标签</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {artwork.tags.map((tag, i) => (
                              <button
                                key={i}
                                onClick={() => handleTagClick(tag)}
                                className="px-2 py-1 text-xs rounded-full bg-white/10 text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 transition-colors cursor-pointer"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => toggleFavorite(artwork.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            artwork.favorite
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${artwork.favorite ? 'fill-red-400' : ''}`} />
                          {artwork.favorite ? '已收藏' : '收藏'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定要删除这个素材吗？')) {
                              deleteArtwork(artwork.id)
                              setShowModal(false)
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

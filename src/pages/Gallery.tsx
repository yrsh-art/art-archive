import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Grid, List, ImageOff, Tag, X } from 'lucide-react'
import { useArtworks } from '../context/ArtworkContext'
import ArtworkCard from '../components/features/ArtworkCard'

const sortOptions = [
  { id: 'newest', name: '最新上传' },
  { id: 'oldest', name: '最早上传' },
  { id: 'title', name: '按标题' },
]

export default function Gallery() {
  const { artworks, categories: userCategories } = useArtworks()
  const [searchParams, setSearchParams] = useSearchParams()

  const categories = [{ id: 'all', name: '全部' }, ...userCategories]

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagParam = searchParams.get('tag')
    return tagParam ? [tagParam] : []
  })
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Sync URL params on mount
  useEffect(() => {
    const tagParam = searchParams.get('tag')
    const categoryParam = searchParams.get('category')
    if (tagParam && !selectedTags.includes(tagParam)) {
      setSelectedTags(prev => prev.includes(tagParam) ? prev : [...prev, tagParam])
    }
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams])

  // Extract all unique tags from artworks, sorted by frequency
  const allTags = useMemo(() => {
    const tagCount: Record<string, number> = {}
    artworks.forEach(a => {
      a.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
  }, [artworks])

  // Combined filtering: category -> search -> tags -> sort
  const filteredArtworks = useMemo(() => {
    let result = artworks

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.description.toLowerCase().includes(lowerQuery) ||
        a.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    }

    // Tag filter (AND logic)
    if (selectedTags.length > 0) {
      result = result.filter(a =>
        selectedTags.every(tag => a.tags.includes(tag))
      )
    }

    // Sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title, 'zh-CN')
        default:
          return 0
      }
    })
  }, [artworks, selectedCategory, searchQuery, selectedTags, sortBy])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedTags([])
    setSearchParams({})
  }

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedTags.length > 0

  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    categories.forEach(c => { labels[c.id] = c.name })
    return labels
  }, [categories])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">素材库</h1>
          <p className="text-gray-400">共 {filteredArtworks.length} 个素材</p>
        </motion.div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 mb-4"
          >
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300">
                搜索: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300">
                分类: {categoryLabels[selectedCategory] || selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-300">
                标签: {tag}
                <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 rounded-full text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              清除全部
            </button>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-64 shrink-0"
          >
            <div className="glass rounded-xl p-4 sticky top-24">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索素材..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  分类筛选
                </h3>
                <div className="space-y-1">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag filter section */}
              {allTags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    标签筛选
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-500/50'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      清除标签筛选
                    </button>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">排序方式</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-colors"
                >
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id} className="bg-gray-800">
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          <div className="flex-1">
            <div className="flex justify-end mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {filteredArtworks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-gray-400"
              >
                <ImageOff className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg mb-2">暂无素材</p>
                <p className="text-sm">
                  {hasActiveFilters
                    ? '没有找到匹配的素材，试试调整筛选条件？'
                    : '点击"上传"按钮添加你的第一个素材吧！'}
                </p>
              </motion.div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-4'
              }>
                {filteredArtworks.map((artwork, index) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

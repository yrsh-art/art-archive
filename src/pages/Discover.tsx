import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Lightbulb, Shuffle, Loader2, Settings, User, Download, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAI } from '../context/AIContext'
import { createUnsplashProvider } from '../utils/unsplashProvider'
import { getTodayTopic, getRelatedTopics, dailyTopics } from '../data/dailyTopics'
import type { DailyTopic } from '../data/dailyTopics'
import type { ImageResult } from '../utils/imageProviders'
import HeroBanner from '../components/discover/HeroBanner'
import TopicTagBar from '../components/discover/TopicTagBar'
import ImageSectionGrid from '../components/discover/ImageSectionGrid'
import ImagePreviewModal from '../components/discover/ImagePreviewModal'
import SearchSuggestions from '../components/discover/SearchSuggestions'

interface InspirationSection {
  topic: DailyTopic
  images: ImageResult[]
}

export default function Discover() {
  const { unsplashAccessKey, isUnsplashConfigured } = useAI()
  const todayTopic = getTodayTopic()

  // Search state
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ImageResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)

  // Discovery state
  const [activeTopic, setActiveTopic] = useState<DailyTopic>(todayTopic)
  const [heroAndTopicImages, setHeroAndTopicImages] = useState<ImageResult[]>([])
  const [inspirationSections, setInspirationSections] = useState<InspirationSection[]>([])
  const [randomImages, setRandomImages] = useState<ImageResult[]>([])

  // Loading states per section
  const [loading, setLoading] = useState({ topic: true, inspiration: true, random: true })
  const [refreshing, setRefreshing] = useState({ topic: false, inspirationA: false, inspirationB: false, random: false })

  // Preview & save state
  const [previewImage, setPreviewImage] = useState<ImageResult | null>(null)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const searchInputRef = useRef<HTMLInputElement>(null)

  const getProvider = useCallback(() => {
    return createUnsplashProvider(unsplashAccessKey)
  }, [unsplashAccessKey])

  // Load all discovery sections
  const loadDiscovery = useCallback(async (topic: DailyTopic) => {
    if (!isUnsplashConfigured) return
    const provider = getProvider()
    const related = getRelatedTopics(topic, 2)

    setLoading({ topic: true, inspiration: true, random: true })

    const [topicImgs, inspA, inspB, rand] = await Promise.all([
      provider.getDaily(topic.keyword, 9).catch(() => [] as ImageResult[]),
      provider.getDaily(related[0].keyword, 4).catch(() => [] as ImageResult[]),
      provider.getDaily(related[1].keyword, 4).catch(() => [] as ImageResult[]),
      provider.getRandom(6).catch(() => [] as ImageResult[]),
    ])

    setHeroAndTopicImages(topicImgs)
    setInspirationSections([
      { topic: related[0], images: inspA },
      { topic: related[1], images: inspB },
    ])
    setRandomImages(rand)
    setLoading({ topic: false, inspiration: false, random: false })
  }, [isUnsplashConfigured, getProvider])

  // Initial load
  useEffect(() => {
    loadDiscovery(activeTopic)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Topic change
  const handleTopicChange = useCallback((topic: DailyTopic) => {
    setActiveTopic(topic)
    loadDiscovery(topic)
  }, [loadDiscovery])

  // Refresh individual sections
  const refreshTopicSection = useCallback(async () => {
    if (!isUnsplashConfigured) return
    setRefreshing(prev => ({ ...prev, topic: true }))
    try {
      const images = await getProvider().getDaily(activeTopic.keyword, 9)
      setHeroAndTopicImages(images)
    } catch { /* ignore */ }
    setRefreshing(prev => ({ ...prev, topic: false }))
  }, [isUnsplashConfigured, getProvider, activeTopic])

  const refreshInspirationSection = useCallback(async (index: 0 | 1) => {
    if (!isUnsplashConfigured) return
    const key = index === 0 ? 'inspirationA' : 'inspirationB'
    setRefreshing(prev => ({ ...prev, [key]: true }))
    try {
      const section = inspirationSections[index]
      const images = await getProvider().getDaily(section.topic.keyword, 4)
      setInspirationSections(prev => {
        const next = [...prev]
        next[index] = { ...next[index], images }
        return next
      })
    } catch { /* ignore */ }
    setRefreshing(prev => ({ ...prev, [key]: false }))
  }, [isUnsplashConfigured, getProvider, inspirationSections])

  const refreshRandomSection = useCallback(async () => {
    if (!isUnsplashConfigured) return
    setRefreshing(prev => ({ ...prev, random: true }))
    try {
      const images = await getProvider().getRandom(6)
      setRandomImages(images)
    } catch { /* ignore */ }
    setRefreshing(prev => ({ ...prev, random: false }))
  }, [isUnsplashConfigured, getProvider])

  // Search
  const handleSearch = useCallback(async (p = 1) => {
    if (!query.trim() || !isUnsplashConfigured) return
    setSearchLoading(true)
    setSearchFocused(false)
    try {
      const data = await getProvider().search(query, p)
      if (p === 1) {
        setSearchResults(data.results)
      } else {
        setSearchResults(prev => [...prev, ...data.results])
      }
      setTotalPages(data.totalPages)
      setPage(p)
    } catch (error) {
      console.error('Search failed:', error)
    }
    setSearchLoading(false)
  }, [query, isUnsplashConfigured, getProvider])

  const handleSearchSuggestionSelect = useCallback((keyword: string) => {
    setQuery(keyword)
    setSearchFocused(false)
    // Trigger search after state update
    setTimeout(() => {
      if (!isUnsplashConfigured) return
      const provider = createUnsplashProvider(unsplashAccessKey)
      setSearchLoading(true)
      provider.search(keyword, 1)
        .then(data => {
          setSearchResults(data.results)
          setTotalPages(data.totalPages)
          setPage(1)
        })
        .catch(console.error)
        .finally(() => setSearchLoading(false))
    }, 0)
  }, [isUnsplashConfigured, unsplashAccessKey])

  const clearSearch = useCallback(() => {
    setQuery('')
    setSearchResults([])
    setPage(1)
    setTotalPages(0)
  }, [])

  // Save
  const handleSave = async (image: ImageResult) => {
    if (!window.electronAPI?.downloadExternalImage) return
    setSavingIds(prev => new Set(prev).add(image.id))
    try {
      const result = await window.electronAPI.downloadExternalImage({
        url: image.fullUrl,
        title: `${image.title} - ${image.author}`,
      })
      if (result.success) {
        setSavedIds(prev => new Set(prev).add(image.id))
      }
    } catch (error) {
      console.error('Save failed:', error)
    }
    setSavingIds(prev => {
      const next = new Set(prev)
      next.delete(image.id)
      return next
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(1)
    if (e.key === 'Escape') {
      setSearchFocused(false)
      searchInputRef.current?.blur()
    }
  }

  // Unconfigured state
  if (!isUnsplashConfigured) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">素材发现</h2>
            <p className="text-gray-400 mb-6">
              需要先配置 Unsplash API Key 才能搜索和浏览素材
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

  const heroImage = heroAndTopicImages[0] || null
  const topicGridImages = heroAndTopicImages.slice(1)
  const showDiscovery = searchResults.length === 0

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
            <Search className="w-8 h-8" />
            素材发现
          </h1>
          <p className="text-gray-400">搜索高质量素材图片，一键收藏到素材库</p>
        </motion.div>

        {/* Search bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="搜索素材..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder:text-gray-500"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSearch(1)}
            disabled={!query.trim() || searchLoading}
            className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            搜索
          </motion.button>
          {searchResults.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearSearch}
              className="px-4 py-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20"
            >
              清除
            </motion.button>
          )}
        </div>

        {/* Search suggestions */}
        <SearchSuggestions
          visible={searchFocused && searchResults.length === 0}
          onSelect={handleSearchSuggestionSelect}
        />

        {/* Search results mode */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">搜索结果</h2>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {searchResults.map((image, index) => (
                <SearchImageCard
                  key={`${image.id}-${index}`}
                  image={image}
                  index={index}
                  onSave={handleSave}
                  onPreview={setPreviewImage}
                  saving={savingIds.has(image.id)}
                  saved={savedIds.has(image.id)}
                />
              ))}
            </div>

            {page < totalPages && (
              <div className="text-center mt-8">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSearch(page + 1)}
                  disabled={searchLoading}
                  className="px-6 py-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-50"
                >
                  {searchLoading && <Loader2 className="w-5 h-5 animate-spin inline mr-2" />}
                  加载更多
                </motion.button>
              </div>
            )}
          </div>
        )}

        {searchLoading && searchResults.length === 0 && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-400">搜索中...</p>
          </div>
        )}

        {/* Discovery mode */}
        {showDiscovery && !searchLoading && (
          <>
            {/* Hero Banner */}
            <div className="mb-6">
              <HeroBanner
                image={heroImage}
                topic={activeTopic}
                loading={loading.topic}
                onSave={handleSave}
                saving={heroImage ? savingIds.has(heroImage.id) : false}
                saved={heroImage ? savedIds.has(heroImage.id) : false}
                onClickImage={setPreviewImage}
              />
            </div>

            {/* Topic Tag Bar */}
            <div className="mb-6">
              <TopicTagBar
                topics={dailyTopics}
                activeTopic={activeTopic}
                todayTopic={todayTopic}
                onSelect={handleTopicChange}
              />
            </div>

            {/* Today's Topic Section */}
            <ImageSectionGrid
              title={`${activeTopic.label}`}
              icon={<Sparkles className="w-5 h-5 text-amber-400" />}
              images={topicGridImages}
              layout="featured"
              loading={loading.topic}
              onRefresh={refreshTopicSection}
              refreshing={refreshing.topic}
              onSave={handleSave}
              onPreview={setPreviewImage}
              savingIds={savingIds}
              savedIds={savedIds}
            />

            {/* Inspiration sections */}
            {inspirationSections.map((section, i) => (
              <ImageSectionGrid
                key={section.topic.keyword}
                title={`更多灵感: ${section.topic.label}`}
                icon={<Lightbulb className="w-5 h-5 text-yellow-400" />}
                images={section.images}
                layout="uniform"
                loading={loading.inspiration}
                onRefresh={() => refreshInspirationSection(i as 0 | 1)}
                refreshing={i === 0 ? refreshing.inspirationA : refreshing.inspirationB}
                onSave={handleSave}
                onPreview={setPreviewImage}
                savingIds={savingIds}
                savedIds={savedIds}
              />
            ))}

            {/* Random discovery */}
            <ImageSectionGrid
              title="随机发现"
              icon={<Shuffle className="w-5 h-5 text-cyan-400" />}
              images={randomImages}
              layout="masonry"
              loading={loading.random}
              onRefresh={refreshRandomSection}
              refreshing={refreshing.random}
              onSave={handleSave}
              onPreview={setPreviewImage}
              savingIds={savingIds}
              savedIds={savedIds}
            />
          </>
        )}

        {/* Image preview modal */}
        <ImagePreviewModal
          image={previewImage}
          onClose={() => setPreviewImage(null)}
          onSave={handleSave}
          saving={previewImage ? savingIds.has(previewImage.id) : false}
          saved={previewImage ? savedIds.has(previewImage.id) : false}
        />
      </div>
    </div>
  )
}

// Kept inline for search results (similar to original ImageCard but with preview support)
function SearchImageCard({
  image, index, onSave, onPreview, saving, saved,
}: {
  image: ImageResult
  index: number
  onSave: (image: ImageResult) => void
  onPreview: (image: ImageResult) => void
  saving: boolean
  saved: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="break-inside-avoid group relative rounded-xl overflow-hidden bg-white/5 cursor-pointer"
      onClick={() => onPreview(image)}
    >
      <img
        src={image.url}
        alt={image.title}
        className="w-full object-cover"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onSave(image)}
            disabled={saving || saved}
            className={`p-2 rounded-lg transition-colors ${
              saved
                ? 'bg-green-500/80 text-white'
                : 'bg-white/20 text-white hover:bg-purple-500/80'
            }`}
            title={saved ? '已保存' : '收藏到素材库'}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        <div>
          <p className="text-white text-xs truncate mb-1">{image.title}</p>
          <div className="flex items-center justify-between">
            <a
              href={`${image.authorUrl}?utm_source=art_archive&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-white"
              onClick={e => e.stopPropagation()}
            >
              <User className="w-3 h-3" />
              {image.author}
            </a>
            <span className="text-[10px] text-gray-400">
              {image.width}x{image.height}
            </span>
          </div>
          <a
            href={`https://unsplash.com/photos/${image.id}?utm_source=art_archive&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white mt-1"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            Unsplash
          </a>
        </div>
      </div>
    </motion.div>
  )
}

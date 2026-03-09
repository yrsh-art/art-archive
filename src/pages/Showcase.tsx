import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, LayoutGrid, Clock, Spotlight, ChevronLeft, ChevronRight, Star
} from 'lucide-react'
import { useArtworks } from '../context/ArtworkContext'
import type { Artwork } from '../types/index'

type ViewMode = 'masonry' | 'timeline' | 'spotlight'

export default function Showcase() {
  const { artworks } = useArtworks()
  const [viewMode, setViewMode] = useState<ViewMode>('masonry')
  const [spotlightIndex, setSpotlightIndex] = useState(0)

  const ownWorks = useMemo(() => {
    return artworks
      .filter(a => a.isOwnWork)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [artworks])

  const spotlightWork = ownWorks[spotlightIndex]

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ffaa00, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <Crown className="w-8 h-8 inline mr-2" style={{ color: '#ffd700' }} />
            个人典藏馆
          </h1>
          <p className="text-gray-400">
            {ownWorks.length > 0
              ? `已收录 ${ownWorks.length} 幅作品`
              : '上传作品时勾选"这是我的作品"即可收录到典藏馆'}
          </p>
        </motion.div>

        {/* View mode switcher */}
        {ownWorks.length > 0 && (
          <div className="flex justify-center gap-3 mb-8">
            {([
              { mode: 'masonry' as ViewMode, icon: LayoutGrid, label: '瀑布流' },
              { mode: 'timeline' as ViewMode, icon: Clock, label: '时间轴' },
              { mode: 'spotlight' as ViewMode, icon: Spotlight, label: '聚光灯' },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setSpotlightIndex(0) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  viewMode === mode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {ownWorks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-16 text-center"
          >
            <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">还没有典藏作品</p>
            <p className="text-gray-500 text-sm">在上传素材时勾选"这是我的作品"，就会出现在这里</p>
          </motion.div>
        )}

        {/* Masonry View */}
        {viewMode === 'masonry' && ownWorks.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {ownWorks.map((work, index) => (
              <MasonryCard key={work.id} work={work} index={index} />
            ))}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && ownWorks.length > 0 && (
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-500/30" />
            <div className="space-y-12">
              {ownWorks.map((work, index) => (
                <TimelineCard key={work.id} work={work} index={index} isLeft={index % 2 === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Spotlight View */}
        {viewMode === 'spotlight' && ownWorks.length > 0 && spotlightWork && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setSpotlightIndex(Math.max(0, spotlightIndex - 1))}
              disabled={spotlightIndex === 0}
              className="p-3 rounded-full glass text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={spotlightWork.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-2xl w-full"
              >
                <div className="rounded-2xl overflow-hidden"
                  style={{
                    border: '3px solid transparent',
                    backgroundImage: 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(135deg, #ffd700, #b8860b, #ffd700)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.15)',
                  }}
                >
                  <img
                    src={spotlightWork.imageUrl}
                    alt={spotlightWork.title}
                    className="w-full max-h-[60vh] object-contain bg-black/20"
                  />
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{spotlightWork.title}</h2>
                    {spotlightWork.artistNotes && (
                      <p className="text-gray-400 mb-3 italic">"{spotlightWork.artistNotes}"</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {new Date(spotlightWork.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="text-sm text-amber-400">
                        {spotlightIndex + 1} / {ownWorks.length}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={() => setSpotlightIndex(Math.min(ownWorks.length - 1, spotlightIndex + 1))}
              disabled={spotlightIndex === ownWorks.length - 1}
              className="p-3 rounded-full glass text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function MasonryCard({ work, index }: { work: Artwork; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="break-inside-avoid rounded-xl overflow-hidden"
      style={{
        border: '2px solid transparent',
        backgroundImage: 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(135deg, #ffd700, #b8860b, #ffd700)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '0 0 15px rgba(255, 215, 0, 0.1)',
      }}
    >
      <img
        src={work.imageUrl}
        alt={work.title}
        className="w-full object-cover"
        loading="lazy"
      />
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white truncate">{work.title}</h3>
        {work.artistNotes && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 italic">"{work.artistNotes}"</p>
        )}
        <p className="text-[10px] text-gray-500 mt-1">
          {new Date(work.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>
    </motion.div>
  )
}

function TimelineCard({ work, index, isLeft }: { work: Artwork; index: number; isLeft: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-center gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <div className={`w-[45%] ${isLeft ? 'text-right' : 'text-left'}`}>
        <div className="inline-block rounded-xl overflow-hidden"
          style={{
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(135deg, #ffd700, #b8860b, #ffd700)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          <img src={work.imageUrl} alt={work.title} className="max-w-full max-h-60 object-contain" loading="lazy" />
          <div className="p-3">
            <h3 className="text-sm font-semibold text-white">{work.title}</h3>
            {work.artistNotes && (
              <p className="text-xs text-gray-400 mt-1 italic">"{work.artistNotes}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline dot */}
      <div className="relative flex-shrink-0">
        <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-300 shadow-lg shadow-amber-500/30" />
      </div>

      <div className={`w-[45%] ${isLeft ? 'text-left' : 'text-right'}`}>
        <p className="text-sm text-gray-400">
          {new Date(work.createdAt).toLocaleDateString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>
    </motion.div>
  )
}

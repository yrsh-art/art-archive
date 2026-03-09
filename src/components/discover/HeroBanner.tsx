import { motion } from 'framer-motion'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import type { ImageResult } from '../../utils/imageProviders'
import type { DailyTopic } from '../../data/dailyTopics'

interface HeroBannerProps {
  image: ImageResult | null
  topic: DailyTopic
  loading: boolean
  onSave: (image: ImageResult) => void
  saving: boolean
  saved: boolean
  onClickImage: (image: ImageResult) => void
}

export default function HeroBanner({ image, topic, loading, onSave, saving, saved, onClickImage }: HeroBannerProps) {
  if (loading || !image) {
    return (
      <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-white/5 animate-pulse" />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="aspect-[21/9] rounded-2xl overflow-hidden relative group cursor-pointer"
      onClick={() => onClickImage(image)}
    >
      <img
        src={image.regularUrl || image.url}
        alt={image.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-1">{topic.label}</h2>
          <p className="text-gray-300 text-sm">{topic.description}</p>
        </div>
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onSave(image)}
            disabled={saving || saved}
            className={`p-2.5 rounded-lg transition-colors ${
              saved
                ? 'bg-green-500/80 text-white'
                : 'bg-white/20 text-white hover:bg-purple-500/80'
            }`}
            title={saved ? '已保存' : '收藏到素材库'}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </motion.button>
          <a
            href={`https://unsplash.com/photos/${image.id}?utm_source=art_archive&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            title="在 Unsplash 查看"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </motion.div>
  )
}

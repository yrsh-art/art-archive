import { motion } from 'framer-motion'
import { Download, Eye, Loader2 } from 'lucide-react'
import type { ImageResult } from '../../utils/imageProviders'

interface DiscoverImageCardProps {
  image: ImageResult
  index: number
  size?: 'large' | 'normal'
  onSave: (image: ImageResult) => void
  onPreview: (image: ImageResult) => void
  saving: boolean
  saved: boolean
}

export default function DiscoverImageCard({
  image, index, size = 'normal', onSave, onPreview, saving, saved,
}: DiscoverImageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative rounded-xl overflow-hidden bg-white/5 cursor-pointer ${
        size === 'large' ? 'col-span-2 row-span-2' : ''
      }`}
      onClick={() => onPreview(image)}
    >
      <img
        src={image.url}
        alt={image.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onPreview(image)}
            className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30"
            title="预览"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
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
          <p className="text-[10px] text-gray-400">{image.width}x{image.height}</p>
        </div>
      </div>
    </motion.div>
  )
}

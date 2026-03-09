import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ExternalLink, User, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ImageResult } from '../../utils/imageProviders'

interface ImagePreviewModalProps {
  image: ImageResult | null
  onClose: () => void
  onSave: (image: ImageResult) => void
  saving: boolean
  saved: boolean
}

export default function ImagePreviewModal({ image, onClose, onSave, saving, saved }: ImagePreviewModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (image) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [image])

  // ESC to close
  useEffect(() => {
    if (!image) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [image, onClose])

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close button - top right corner */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content container - absolute positioning for reliable centering */}
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="glass rounded-2xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row"
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Left: Image area */}
              <div className="relative md:w-2/3 bg-black/40 flex items-center justify-center overflow-hidden"
                style={{ minHeight: '240px', maxHeight: 'calc(100vh - 6rem)' }}
              >
                <img
                  src={image.regularUrl || image.url}
                  alt={image.title}
                  className="w-full h-full object-contain p-2"
                  style={{ maxHeight: 'calc(100vh - 8rem)' }}
                />
              </div>

              {/* Right: Info panel */}
              <div className="md:w-1/3 p-6 flex flex-col gap-4 min-w-[260px] overflow-y-auto">
                <h3 className="text-lg font-semibold text-white leading-tight">
                  {image.title}
                </h3>

                <div className="space-y-3 text-sm">
                  <a
                    href={`${image.authorUrl}?utm_source=art_archive&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    {image.author}
                  </a>

                  <div className="text-gray-400">
                    尺寸: {image.width} x {image.height}
                  </div>

                  <a
                    href={`https://unsplash.com/photos/${image.id}?utm_source=art_archive&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    在 Unsplash 查看
                  </a>
                </div>

                <div className="mt-auto pt-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSave(image)}
                    disabled={saving || saved}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                      saved
                        ? 'bg-green-500/80 text-white'
                        : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400'
                    }`}
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    {saved ? '已保存到素材库' : '保存到素材库'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

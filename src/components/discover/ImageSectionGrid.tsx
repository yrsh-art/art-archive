import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { ImageResult } from '../../utils/imageProviders'
import DiscoverImageCard from './DiscoverImageCard'
import type { ReactNode } from 'react'

type LayoutVariant = 'featured' | 'uniform' | 'masonry'

interface ImageSectionGridProps {
  title: string
  icon: ReactNode
  images: ImageResult[]
  layout: LayoutVariant
  loading: boolean
  onRefresh: () => void
  refreshing: boolean
  onSave: (image: ImageResult) => void
  onPreview: (image: ImageResult) => void
  savingIds: Set<string>
  savedIds: Set<string>
}

export default function ImageSectionGrid({
  title, icon, images, layout, loading, onRefresh, refreshing,
  onSave, onPreview, savingIds, savedIds,
}: ImageSectionGridProps) {
  const renderSkeleton = () => {
    const count = layout === 'featured' ? 5 : layout === 'uniform' ? 4 : 6
    if (layout === 'masonry') {
      return (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-xl bg-white/5 animate-pulse"
              style={{ height: `${150 + Math.random() * 100}px` }}
            />
          ))}
        </div>
      )
    }
    return (
      <div className={
        layout === 'featured'
          ? 'grid grid-cols-3 auto-rows-[200px] gap-4'
          : 'grid grid-cols-2 md:grid-cols-4 gap-4'
      }>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`rounded-xl bg-white/5 animate-pulse ${
              layout === 'featured' && i === 0 ? 'col-span-2 row-span-2' : ''
            }`}
          />
        ))}
      </div>
    )
  }

  const renderGrid = () => {
    if (layout === 'masonry') {
      return (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((image, i) => (
            <div key={image.id} className="break-inside-avoid">
              <DiscoverImageCard
                image={image}
                index={i}
                onSave={onSave}
                onPreview={onPreview}
                saving={savingIds.has(image.id)}
                saved={savedIds.has(image.id)}
              />
            </div>
          ))}
        </div>
      )
    }

    if (layout === 'featured') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[200px] gap-4">
          {images.map((image, i) => (
            <DiscoverImageCard
              key={image.id}
              image={image}
              index={i}
              size={i === 0 ? 'large' : 'normal'}
              onSave={onSave}
              onPreview={onPreview}
              saving={savingIds.has(image.id)}
              saved={savedIds.has(image.id)}
            />
          ))}
        </div>
      )
    }

    // uniform
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image, i) => (
          <DiscoverImageCard
            key={image.id}
            image={image}
            index={i}
            onSave={onSave}
            onPreview={onPreview}
            saving={savingIds.has(image.id)}
            saved={savedIds.has(image.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          换一批
        </motion.button>
      </div>

      {loading ? renderSkeleton() : renderGrid()}
    </motion.section>
  )
}

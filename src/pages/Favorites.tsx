import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useArtworks } from '../context/ArtworkContext'
import ArtworkCard from '../components/features/ArtworkCard'
import type { Artwork } from '../types/index'

export default function Favorites() {
  const { artworks } = useArtworks()
  const favorites = artworks.filter((a: Artwork) => a.favorite)

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-400 fill-red-400" />
            <h1 className="text-3xl font-bold gradient-text">我的收藏</h1>
          </div>
          <p className="text-gray-400">共 {favorites.length} 个收藏素材</p>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 glass rounded-xl"
          >
            <Heart className="w-20 h-20 text-gray-600 mb-6" />
            <h2 className="text-xl font-semibold text-white mb-2">还没有收藏</h2>
            <p className="text-gray-400 text-center max-w-md">
              在素材库中点击心形图标来收藏你喜爱的素材，它们会出现在这里
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((artwork: Artwork, index: number) => (
              <ArtworkCard key={artwork.id} artwork={artwork} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

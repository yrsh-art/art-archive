import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Image,
  Upload,
  FolderOpen,
  Heart,
  ArrowRight,
  Palette,
  Camera,
  Box,
  Type,
  Lightbulb,
  Users,
  Mountain,
  Layers,
} from 'lucide-react'
import { useArtworks } from '../context/ArtworkContext'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette, Camera, Box, Type, Lightbulb, Users, Mountain, Sparkles, Layers,
}

const colorCycle = [
  'bg-purple-500/20 text-purple-400',
  'bg-pink-500/20 text-pink-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-orange-500/20 text-orange-400',
  'bg-green-500/20 text-green-400',
  'bg-violet-500/20 text-violet-400',
  'bg-teal-500/20 text-teal-400',
  'bg-gray-500/20 text-gray-400',
]

const features = [
  {
    icon: Image,
    title: '素材管理',
    description: '轻松上传和管理你的艺术素材，支持多种格式',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: FolderOpen,
    title: '智能分类',
    description: '按类型、风格、用途等多维度整理素材',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Heart,
    title: '收藏夹',
    description: '收藏喜爱的素材，快速访问灵感来源',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Sparkles,
    title: '精美界面',
    description: '现代化的视觉设计，带来愉悦的使用体验',
    color: 'from-cyan-500 to-blue-500',
  },
]

export default function Home() {
  const { artworks, categories } = useArtworks()
  const recentArtworks = artworks.slice(0, 4)

  // Take first 4 categories for showcase
  const categoryShowcase = categories.slice(0, 4).map((cat, i) => ({
    icon: iconMap[cat.icon || 'Sparkles'] || Sparkles,
    name: cat.name,
    id: cat.id,
    color: colorCycle[i % colorCycle.length],
  }))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute -top-1/2 -right-1/2 w-full h-full"
          >
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 via-transparent to-indigo-500/20 rounded-full blur-3xl" />
          </motion.div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">为艺术创作者打造</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="gradient-text">Art Archive</span>
              <br />
              <span className="text-white">艺术素材积累平台</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              系统化管理你的艺术灵感与素材，让每一次创作都有迹可循。
              为画师、设计师量身打造的专业素材管理工具。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/upload">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold flex items-center gap-2 glow"
                >
                  <Upload className="w-5 h-5" />
                  开始上传
                </motion.button>
              </Link>
              <Link to="/gallery">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl glass text-white font-semibold flex items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <Image className="w-5 h-5" />
                  浏览素材库
                </motion.button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { label: '素材总数', value: artworks.length },
              { label: '收藏数', value: artworks.filter(a => a.favorite).length },
              { label: '分类数', value: categories.length },
              { label: '今日新增', value: artworks.filter(a =>
                new Date(a.createdAt).toDateString() === new Date().toDateString()
              ).length },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">核心功能</h2>
            <p className="text-gray-400">专为艺术创作者设计的素材管理体验</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="glass rounded-xl p-6 card-hover"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">最近上传</h2>
              <p className="text-gray-400">你最近添加的素材</p>
            </div>
            <Link to="/gallery">
              <motion.button
                whileHover={{ x: 5 }}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>

          {recentArtworks.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {recentArtworks.map((artwork, i) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative aspect-square rounded-xl overflow-hidden glass cursor-pointer"
                >
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform">
                    <h3 className="font-semibold text-white truncate">{artwork.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-12 text-center"
            >
              <Image className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">还没有素材，开始上传你的第一个作品吧！</p>
              <Link to="/upload">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold"
                >
                  上传素材
                </motion.button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">素材分类</h2>
            <p className="text-gray-400">按类型浏览你的艺术收藏</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryShowcase.map((cat, i) => {
              const Icon = cat.icon
              const count = artworks.filter(a => a.category === cat.id).length
              return (
                <Link key={cat.id} to={`/gallery?category=${cat.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="glass rounded-xl p-6 text-center cursor-pointer card-hover"
                  >
                    <div className={`w-14 h-14 rounded-xl ${cat.color} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{cat.name}</h3>
                    <p className="text-sm text-gray-400">{count} 个素材</p>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-8">
            <Link to="/categories">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg glass text-white font-semibold hover:bg-white/10 transition-colors"
              >
                查看全部分类
              </motion.button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

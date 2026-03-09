import { motion, AnimatePresence } from 'framer-motion'
import { dailyTopics } from '../../data/dailyTopics'

interface SearchSuggestionsProps {
  visible: boolean
  onSelect: (keyword: string) => void
}

// Pick a diverse set of keywords from topics and their related keywords
const suggestions = (() => {
  const pool: string[] = []
  for (const topic of dailyTopics) {
    pool.push(topic.keyword)
    pool.push(...topic.relatedKeywords)
  }
  // Deduplicate and pick 15 evenly-spaced entries
  const unique = [...new Set(pool)]
  const step = Math.floor(unique.length / 15)
  return unique.filter((_, i) => i % step === 0).slice(0, 15)
})()

export default function SearchSuggestions({ visible, onSelect }: SearchSuggestionsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          <span className="text-xs text-gray-500 self-center mr-1">热门:</span>
          {suggestions.map(kw => (
            <button
              key={kw}
              onClick={() => onSelect(kw)}
              className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
            >
              {kw}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

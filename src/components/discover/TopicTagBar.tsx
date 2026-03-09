import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DailyTopic } from '../../data/dailyTopics'

interface TopicTagBarProps {
  topics: DailyTopic[]
  activeTopic: DailyTopic
  todayTopic: DailyTopic
  onSelect: (topic: DailyTopic) => void
}

export default function TopicTagBar({ topics, activeTopic, todayTopic, onSelect }: TopicTagBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeTopic.keyword])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.6
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="relative group/scroll">
      {/* Left fade + arrow */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[var(--bg-base,#0a0a0f)] to-transparent pointer-events-none" />
          <button
            onClick={() => scroll('left')}
            className="relative z-10 p-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors ml-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable area */}
      <style>{`
        .topic-tag-scroll { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .topic-tag-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        ref={scrollRef}
        className="topic-tag-scroll flex gap-2 overflow-x-auto py-2 px-1 scroll-smooth"
      >
        {topics.map(topic => {
          const isActive = topic.keyword === activeTopic.keyword
          const isToday = topic.keyword === todayTopic.keyword
          return (
            <motion.button
              key={topic.keyword}
              ref={isActive ? activeRef : undefined}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(topic)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300'
              }`}
            >
              {isToday && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              {topic.label}
              {isToday && !isActive && (
                <span className="text-[10px] text-amber-400 ml-0.5">今日</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Right fade + arrow */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center">
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--bg-base,#0a0a0f)] to-transparent pointer-events-none" />
          <button
            onClick={() => scroll('right')}
            className="relative z-10 p-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors mr-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Image,
  Upload,
  FolderOpen,
  Heart,
  Menu,
  X,
  Sparkles,
  Camera,
  LayoutGrid,
  ChevronDown,
  Settings,
  Search,
  MessageCircle,
  Dice5,
  PenTool,
  Crown,
} from 'lucide-react'

interface NavGroup {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: NavItem[]
}

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isElectronAction?: string
}

const navGroups: (NavItem | NavGroup)[] = [
  { path: '/', label: '首页', icon: Home },
  {
    label: '素材库',
    icon: Image,
    children: [
      { path: '/gallery', label: '素材库', icon: Image },
      { path: '/upload', label: '上传', icon: Upload },
      { path: '/categories', label: '分类', icon: FolderOpen },
      { path: '/favorites', label: '收藏夹', icon: Heart },
      { path: '/showcase', label: '个人典藏', icon: Crown },
    ],
  },
  {
    label: '创作工具',
    icon: PenTool,
    children: [
      { path: '/canvas', label: '画板', icon: PenTool },
      { path: '/theme-generator', label: '主题生成器', icon: Dice5 },
      { path: '/chat', label: 'AI 助手', icon: MessageCircle },
    ],
  },
  { path: '/discover', label: '发现', icon: Search },
]

const toolItems: NavItem[] = [
  { path: '/capture', label: '采集', icon: Camera, isElectronAction: 'capture' },
  { path: '/reference', label: '参考板', icon: LayoutGrid, isElectronAction: 'reference' },
]

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'children' in item
}

function DropdownGroup({ group, isElectron }: { group: NavGroup; isElectron: boolean }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const isActive = group.children.some(c => location.pathname === c.path)
  const Icon = group.icon

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={`relative px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-sm ${
          isActive
            ? 'text-purple-400'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{group.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 bg-purple-500/10 rounded-lg -z-10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-44 glass rounded-xl border border-white/10 py-1 z-50 shadow-xl"
          >
            {group.children.map(child => {
              const ChildIcon = child.icon
              const isChildActive = location.pathname === child.path
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    isChildActive
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ChildIcon className="w-4 h-4" />
                  {child.label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isElectron, setIsElectron] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsElectron(!!window.electronAPI)
  }, [])

  // Flatten all nav items for mobile
  const allItems: NavItem[] = navGroups.flatMap(item =>
    isGroup(item) ? item.children : [item]
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-8 h-8 text-purple-400" />
            </motion.div>
            <span className="text-xl font-bold gradient-text">Art Archive</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navGroups.map((item, idx) => {
              if (isGroup(item)) {
                return <DropdownGroup key={item.label} group={item} isElectron={isElectron} />
              }
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-sm ${
                    isActive
                      ? 'text-purple-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-purple-500/10 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            })}

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Tool buttons: Electron = window toggle, Browser = route */}
            {toolItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              if (isElectron) {
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      if (item.isElectronAction === 'capture') window.electronAPI?.toggleCaptureWindow()
                      else window.electronAPI?.toggleReferenceWindow()
                    }}
                    className="px-3 py-2 rounded-lg flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-sm ${
                    isActive
                      ? 'text-purple-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-purple-500/10 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            })}

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Settings icon */}
            <Link
              to="/settings"
              className={`px-2 py-2 rounded-lg transition-colors ${
                location.pathname === '/settings'
                  ? 'text-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </nav>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <nav className="px-4 py-4 space-y-1">
              {/* Nav groups as accordion */}
              {navGroups.map((item) => {
                if (isGroup(item)) {
                  return (
                    <MobileAccordion key={item.label} group={item} onNavigate={() => setIsMenuOpen(false)} />
                  )
                }
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              <div className="h-px bg-white/10 my-2" />

              {/* Tool items */}
              {toolItems.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              <Link
                to="/settings"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/settings'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>设置</span>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function MobileAccordion({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const Icon = group.icon
  const isActive = group.children.some(c => location.pathname === c.path)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
          isActive ? 'text-purple-400' : 'text-gray-300 hover:bg-white/5'
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          {group.label}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {group.children.map(child => {
              const ChildIcon = child.icon
              const isChildActive = location.pathname === child.path
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg transition-colors ${
                    isChildActive
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                  }`}
                >
                  <ChildIcon className="w-4 h-4" />
                  <span className="text-sm">{child.label}</span>
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

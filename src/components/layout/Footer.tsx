import { Sparkles, Github, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="glass mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-semibold gradient-text">Art Archive</span>
            <span className="text-gray-400 text-sm">
              - 艺术素材积累平台
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-purple-400 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-400 fill-red-400" /> for artists
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import TitleBar from './TitleBar'
import BackgroundEffect from '../effects/BackgroundEffect'
import MouseGlow from '../effects/MouseGlow'
import ThemeSwitcher from '../features/ThemeSwitcher'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(!!window.electronAPI)
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundEffect intensity="medium" />
      <MouseGlow />
      <TitleBar />
      <Header />
      <main className={`flex-1 relative z-10 ${isElectron ? 'pt-24' : 'pt-16'}`}>
        {children}
      </main>
      <Footer />
      <ThemeSwitcher />
    </div>
  )
}

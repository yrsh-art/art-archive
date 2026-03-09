import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Artwork, UserCategory, AppConfig, ChatMessage } from '../types/index'

declare global {
  interface Window {
    electronAPI?: {
      getAppPath: () => Promise<string>
      loadArtworks: () => Promise<Artwork[]>
      saveArtworks: (artworks: Artwork[]) => Promise<boolean>
      loadConfig: () => Promise<AppConfig>
      saveConfig: (config: AppConfig) => Promise<boolean>
      selectImage: () => Promise<string | null>
      saveImage: (data: { imageData: string; fileName: string }) => Promise<string | null>
      readImage: (filePath: string) => Promise<string | null>
      deleteImage: (filePath: string) => Promise<boolean>
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      toggleCaptureWindow: () => Promise<boolean>
      toggleReferenceWindow: () => Promise<boolean>
      pasteFromClipboard: () => Promise<{
        success: boolean
        artwork?: { id: string; title: string; filePath: string }
        imageData?: string
        results?: Array<{ artwork: { id: string; title: string; filePath: string }; imageData: string }>
        error?: string
      }>
      onArtworksUpdated: (callback: () => void) => () => void
      loadCategories: () => Promise<UserCategory[] | null>
      saveCategories: (categories: UserCategory[]) => Promise<boolean>
      aiChat: (params: { provider: string; apiKey: string; model: string; messages: ChatMessage[]; baseUrl?: string }) => Promise<string>
      loadAppConfig: () => Promise<AppConfig>
      saveAppConfig: (config: AppConfig) => Promise<boolean>
      unsplashSearch: (params: { accessKey: string; query: string; page: number; perPage: number }) => Promise<unknown>
      unsplashRandom: (params: { accessKey: string; count: number; query?: string }) => Promise<unknown>
      downloadExternalImage: (params: { url: string; title: string }) => Promise<{ success: boolean; artwork?: { id: string; title: string; filePath: string }; error?: string }>
    }
  }
}

export const DEFAULT_CATEGORIES: UserCategory[] = [
  { id: 'illustration', name: '插画', icon: 'Palette', description: '手绘、数字插画、漫画等' },
  { id: 'photography', name: '摄影', icon: 'Camera', description: '风景、人像、静物摄影作品' },
  { id: '3d', name: '3D艺术', icon: 'Box', description: '3D建模、渲染、动画' },
  { id: 'typography', name: '字体设计', icon: 'Type', description: '字体排版、文字艺术' },
  { id: 'concept', name: '概念设计', icon: 'Lightbulb', description: '游戏、电影概念设计' },
  { id: 'character', name: '角色设计', icon: 'Users', description: '人物、角色设定' },
  { id: 'landscape', name: '风景', icon: 'Mountain', description: '自然风景、环境艺术' },
  { id: 'other', name: '其他', icon: 'Sparkles', description: '其他类型的艺术作品' },
]

interface ArtworkContextType {
  artworks: Artwork[]
  isLoading: boolean
  categories: UserCategory[]
  addArtwork: (artwork: Omit<Artwork, 'id' | 'createdAt' | 'favorite'>) => Promise<void>
  deleteArtwork: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  updateArtwork: (id: string, updates: Partial<Artwork>) => Promise<void>
  getArtworksByCategory: (category: string) => Artwork[]
  searchArtworks: (query: string) => Artwork[]
  addCategory: (category: UserCategory) => Promise<void>
  updateCategory: (id: string, updates: Partial<UserCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

const ArtworkContext = createContext<ArtworkContextType | null>(null)

const isElectron = () => !!window.electronAPI

export function ArtworkProvider({ children }: { children: ReactNode }) {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<UserCategory[]>(DEFAULT_CATEGORIES)

  // Use a ref to track the latest artworks array, avoiding stale closure issues
  // when addArtwork/deleteArtwork/etc. are called sequentially in a loop
  const artworksRef = useRef<Artwork[]>([])

  const updateArtworksState = useCallback((newArtworks: Artwork[]) => {
    artworksRef.current = newArtworks
    setArtworks(newArtworks)
  }, [])

  const reloadArtworks = useCallback(async () => {
    if (!isElectron()) return
    try {
      const savedArtworks = await window.electronAPI!.loadArtworks()
      const artworksWithImages = await Promise.all(
        savedArtworks.map(async (artwork: Artwork) => {
          if (artwork.filePath) {
            const imageData = await window.electronAPI!.readImage(artwork.filePath)
            return { ...artwork, imageUrl: imageData || artwork.imageUrl }
          }
          return artwork
        })
      )
      updateArtworksState(artworksWithImages)
    } catch (error) {
      console.error('Failed to reload artworks:', error)
    }
  }, [updateArtworksState])

  useEffect(() => {
    const loadArtworks = async () => {
      setIsLoading(true)
      try {
        if (isElectron()) {
          const savedArtworks = await window.electronAPI!.loadArtworks()
          const artworksWithImages = await Promise.all(
            savedArtworks.map(async (artwork: Artwork) => {
              if (artwork.filePath) {
                const imageData = await window.electronAPI!.readImage(artwork.filePath)
                return { ...artwork, imageUrl: imageData || artwork.imageUrl }
              }
              return artwork
            })
          )
          updateArtworksState(artworksWithImages)

          // Load categories
          if (window.electronAPI!.loadCategories) {
            const savedCategories = await window.electronAPI!.loadCategories()
            if (savedCategories && savedCategories.length > 0) {
              setCategories(savedCategories)
            }
          }
        } else {
          const saved = localStorage.getItem('art-archive-artworks')
          if (saved) {
            const parsed = JSON.parse(saved)
            updateArtworksState(parsed)
          }
          const savedCats = localStorage.getItem('art-archive-categories')
          if (savedCats) {
            const parsed = JSON.parse(savedCats)
            if (parsed.length > 0) setCategories(parsed)
          }
        }
      } catch (error) {
        console.error('Failed to load artworks:', error)
      }
      setIsLoading(false)
    }

    loadArtworks()
  }, [updateArtworksState])

  useEffect(() => {
    if (!isElectron() || !window.electronAPI!.onArtworksUpdated) return
    const cleanup = window.electronAPI!.onArtworksUpdated(() => {
      reloadArtworks()
    })
    return cleanup
  }, [reloadArtworks])

  const saveArtworks = useCallback(async (newArtworks: Artwork[]) => {
    if (isElectron()) {
      await window.electronAPI!.saveArtworks(newArtworks)
    } else {
      localStorage.setItem('art-archive-artworks', JSON.stringify(newArtworks))
    }
  }, [])

  const saveCategories = useCallback(async (newCategories: UserCategory[]) => {
    if (isElectron() && window.electronAPI!.saveCategories) {
      await window.electronAPI!.saveCategories(newCategories)
    } else {
      localStorage.setItem('art-archive-categories', JSON.stringify(newCategories))
    }
  }, [])

  const addArtwork = useCallback(async (artwork: Omit<Artwork, 'id' | 'createdAt' | 'favorite'>) => {
    let filePath: string | null = null
    let imageUrl = artwork.imageUrl

    if (isElectron() && artwork.imageUrl.startsWith('data:')) {
      const fileName = artwork.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
      filePath = await window.electronAPI!.saveImage({
        imageData: artwork.imageUrl,
        fileName: fileName
      })
    }

    const newArtwork: Artwork = {
      ...artwork,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      favorite: false,
      filePath: filePath || undefined,
      imageUrl: imageUrl
    }

    const newArtworks = [newArtwork, ...artworksRef.current]
    artworksRef.current = newArtworks
    setArtworks(newArtworks)
    await saveArtworks(newArtworks)
  }, [saveArtworks])

  const deleteArtwork = useCallback(async (id: string) => {
    const artwork = artworksRef.current.find(a => a.id === id)

    if (artwork?.filePath && isElectron()) {
      await window.electronAPI!.deleteImage(artwork.filePath)
    }

    const newArtworks = artworksRef.current.filter(a => a.id !== id)
    artworksRef.current = newArtworks
    setArtworks(newArtworks)
    await saveArtworks(newArtworks)
  }, [saveArtworks])

  const toggleFavorite = useCallback(async (id: string) => {
    const newArtworks = artworksRef.current.map(a =>
      a.id === id ? { ...a, favorite: !a.favorite } : a
    )
    artworksRef.current = newArtworks
    setArtworks(newArtworks)
    await saveArtworks(newArtworks)
  }, [saveArtworks])

  const updateArtwork = useCallback(async (id: string, updates: Partial<Artwork>) => {
    const newArtworks = artworksRef.current.map(a =>
      a.id === id ? { ...a, ...updates } : a
    )
    artworksRef.current = newArtworks
    setArtworks(newArtworks)
    await saveArtworks(newArtworks)
  }, [saveArtworks])

  const getArtworksByCategory = useCallback((category: string) => {
    if (category === 'all') return artworks
    return artworks.filter(a => a.category === category)
  }, [artworks])

  const searchArtworks = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return artworks.filter(a =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.description.toLowerCase().includes(lowerQuery) ||
      a.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }, [artworks])

  const addCategory = useCallback(async (category: UserCategory) => {
    const newCategories = [...categories, category]
    setCategories(newCategories)
    await saveCategories(newCategories)
  }, [categories, saveCategories])

  const updateCategory = useCallback(async (id: string, updates: Partial<UserCategory>) => {
    const newCategories = categories.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
    setCategories(newCategories)
    await saveCategories(newCategories)
  }, [categories, saveCategories])

  const deleteCategory = useCallback(async (id: string) => {
    // Move artworks in this category to 'other'
    const affectedArtworks = artworksRef.current.filter(a => a.category === id)
    if (affectedArtworks.length > 0) {
      const newArtworks = artworksRef.current.map(a =>
        a.category === id ? { ...a, category: 'other' } : a
      )
      artworksRef.current = newArtworks
      setArtworks(newArtworks)
      await saveArtworks(newArtworks)
    }

    const newCategories = categories.filter(c => c.id !== id)
    setCategories(newCategories)
    await saveCategories(newCategories)
  }, [categories, saveArtworks, saveCategories])

  return (
    <ArtworkContext.Provider value={{
      artworks,
      isLoading,
      categories,
      addArtwork,
      deleteArtwork,
      toggleFavorite,
      updateArtwork,
      getArtworksByCategory,
      searchArtworks,
      addCategory,
      updateCategory,
      deleteCategory,
    }}>
      {children}
    </ArtworkContext.Provider>
  )
}

export function useArtworks() {
  const context = useContext(ArtworkContext)
  if (!context) {
    throw new Error('useArtworks must be used within an ArtworkProvider')
  }
  return context
}

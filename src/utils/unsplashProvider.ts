import type { ImageResult, ImageProvider } from './imageProviders'

interface UnsplashPhoto {
  id: string
  urls: { small: string; regular: string; full: string }
  alt_description?: string
  description?: string
  user: { name: string; links: { html: string } }
  width: number
  height: number
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[]
  total_pages: number
}

export function createUnsplashProvider(accessKey: string): ImageProvider {
  const mapPhoto = (photo: UnsplashPhoto): ImageResult => ({
    id: photo.id,
    url: photo.urls.small,
    regularUrl: photo.urls.regular,
    fullUrl: photo.urls.full,
    title: photo.alt_description || photo.description || 'Untitled',
    author: photo.user.name,
    authorUrl: photo.user.links.html,
    source: 'unsplash',
    width: photo.width,
    height: photo.height,
  })

  return {
    name: 'Unsplash',

    async search(query: string, page: number) {
      if (window.electronAPI?.unsplashSearch) {
        const data = await window.electronAPI.unsplashSearch({
          accessKey, query, page, perPage: 20,
        }) as UnsplashSearchResponse
        return {
          results: data.results.map(mapPhoto),
          totalPages: data.total_pages,
        }
      }
      // Browser fallback
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )
      const data: UnsplashSearchResponse = await res.json()
      return {
        results: data.results.map(mapPhoto),
        totalPages: data.total_pages,
      }
    },

    async getRandom(count: number) {
      if (window.electronAPI?.unsplashRandom) {
        const data = await window.electronAPI.unsplashRandom({ accessKey, count }) as UnsplashPhoto[]
        return data.map(mapPhoto)
      }
      const res = await fetch(
        `https://api.unsplash.com/photos/random?count=${count}`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )
      const data: UnsplashPhoto[] = await res.json()
      return data.map(mapPhoto)
    },

    async getDaily(topic: string, count = 6) {
      if (window.electronAPI?.unsplashRandom) {
        const data = await window.electronAPI.unsplashRandom({ accessKey, count, query: topic }) as UnsplashPhoto[]
        return data.map(mapPhoto)
      }
      const res = await fetch(
        `https://api.unsplash.com/photos/random?count=${count}&query=${encodeURIComponent(topic)}`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )
      const data: UnsplashPhoto[] = await res.json()
      return data.map(mapPhoto)
    },
  }
}

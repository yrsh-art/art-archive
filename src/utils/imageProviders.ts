export interface ImageResult {
  id: string
  url: string
  regularUrl: string
  fullUrl: string
  title: string
  author: string
  authorUrl: string
  source: string
  width: number
  height: number
}

export interface ImageProvider {
  name: string
  search(query: string, page: number): Promise<{ results: ImageResult[]; totalPages: number }>
  getRandom(count: number): Promise<ImageResult[]>
  getDaily(topic: string, count?: number): Promise<ImageResult[]>
}

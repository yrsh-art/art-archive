export interface RefBoardItem {
  id: string
  artworkId: string
  filePath: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  flipH?: boolean
  flipV?: boolean
}

export interface ReferenceBoard {
  items: RefBoardItem[]
  windowBounds?: { x: number; y: number; width: number; height: number }
  alwaysOnTop: boolean
  panX?: number
  panY?: number
  zoom?: number
}

export interface ArtworkForPicker {
  id: string
  title: string
  category: string
  tags: string[]
  imageData: string
  filePath?: string
}

export interface ClipboardResult {
  success: boolean
  artwork?: {
    id: string
    title: string
    filePath: string
  }
  imageData?: string
  error?: string
}

declare global {
  interface Window {
    referenceAPI?: {
      loadBoard: () => Promise<ReferenceBoard>
      saveBoard: (data: ReferenceBoard) => Promise<boolean>
      toggleAlwaysOnTop: (value: boolean) => Promise<boolean>
      getArtworks: () => Promise<ArtworkForPicker[]>
      readImage: (filePath: string) => Promise<string | null>
      pasteFromClipboard: () => Promise<ClipboardResult>
      selectImages: () => Promise<{ filePath: string; imageData: string }[]>
      closeWindow: () => void
      minimizeWindow: () => void
      maximizeWindow: () => void
    }
  }
}

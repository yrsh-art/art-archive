export interface CaptureResult {
  success: boolean
  artwork?: {
    id: string
    title: string
    filePath: string
  }
  error?: string
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
    captureAPI?: {
      captureFromUrl: (url: string) => Promise<CaptureResult>
      captureFromFile: (data: { filePath: string }) => Promise<CaptureResult>
      captureFromBase64: (data: { imageData: string }) => Promise<CaptureResult>
      captureFromClipboard: () => Promise<ClipboardResult>
      closeWindow: () => void
    }
  }
}

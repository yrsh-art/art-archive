const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  loadArtworks: () => ipcRenderer.invoke('load-artworks'),
  saveArtworks: (artworks) => ipcRenderer.invoke('save-artworks', artworks),
  
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  loadCategories: () => ipcRenderer.invoke('load-categories'),
  saveCategories: (categories) => ipcRenderer.invoke('save-categories', categories),
  
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveImage: (data) => ipcRenderer.invoke('save-image', data),
  readImage: (filePath) => ipcRenderer.invoke('read-image', filePath),
  deleteImage: (filePath) => ipcRenderer.invoke('delete-image', filePath),
  
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  toggleCaptureWindow: () => ipcRenderer.invoke('toggle-capture-window'),
  toggleReferenceWindow: () => ipcRenderer.invoke('toggle-reference-window'),
  pasteFromClipboard: () => ipcRenderer.invoke('read-clipboard-image'),
  onArtworksUpdated: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('artworks-updated', handler)
    return () => ipcRenderer.removeListener('artworks-updated', handler)
  },

  aiChat: (params) => ipcRenderer.invoke('ai-chat', params),
  loadAppConfig: () => ipcRenderer.invoke('load-app-config'),
  saveAppConfig: (config) => ipcRenderer.invoke('save-app-config', config),
  unsplashSearch: (params) => ipcRenderer.invoke('unsplash-search', params),
  unsplashRandom: (params) => ipcRenderer.invoke('unsplash-random', params),
  downloadExternalImage: (params) => ipcRenderer.invoke('download-external-image', params),
})

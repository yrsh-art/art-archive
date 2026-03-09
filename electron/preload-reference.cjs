const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('referenceAPI', {
  loadBoard: () => ipcRenderer.invoke('load-reference-board'),
  saveBoard: (data) => ipcRenderer.invoke('save-reference-board', data),
  toggleAlwaysOnTop: (value) => ipcRenderer.invoke('reference-toggle-always-on-top', value),
  getArtworks: () => ipcRenderer.invoke('get-artworks-for-picker'),
  readImage: (filePath) => ipcRenderer.invoke('read-image', filePath),
  pasteFromClipboard: () => ipcRenderer.invoke('read-clipboard-image'),
  selectImages: () => ipcRenderer.invoke('select-images-for-board'),
  closeWindow: () => ipcRenderer.send('reference-window-close'),
  minimizeWindow: () => ipcRenderer.send('reference-window-minimize'),
  maximizeWindow: () => ipcRenderer.send('reference-window-maximize')
})

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('captureAPI', {
  captureFromUrl: (url) => ipcRenderer.invoke('capture-image-from-url', url),
  captureFromFile: (data) => ipcRenderer.invoke('capture-image-from-file', data),
  captureFromBase64: (data) => ipcRenderer.invoke('capture-image-from-base64', data),
  captureFromClipboard: () => ipcRenderer.invoke('read-clipboard-image'),
  closeWindow: () => ipcRenderer.send('capture-window-close')
})

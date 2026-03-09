const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')
const { URL } = require('url')

// 允许不安全的内容加载（开发模式 localhost），消除 CSP 警告对拖拽的影响
app.commandLine.appendSwitch('disable-site-isolation-trials')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let captureWindow = null
let referenceWindow = null

// 安全兜底：拦截拖拽导致的意外导航
function setupDragDropPrevention(win) {
  win.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0f0f23',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      navigateOnDragDrop: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  setupDragDropPrevention(mainWindow)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    if (captureWindow) { captureWindow.close(); captureWindow = null }
    if (referenceWindow) { referenceWindow.close(); referenceWindow = null }
  })
}

function createCaptureWindow() {
  if (captureWindow) {
    captureWindow.focus()
    return
  }

  captureWindow = new BrowserWindow({
    width: 220,
    height: 240,
    minWidth: 160,
    minHeight: 180,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      navigateOnDragDrop: false,
      preload: path.join(__dirname, 'preload-capture.cjs')
    }
  })

  setupDragDropPrevention(captureWindow)

  if (isDev) {
    captureWindow.loadURL('http://localhost:5173/capture.html')
  } else {
    captureWindow.loadFile(path.join(__dirname, '../dist/capture.html'))
  }

  captureWindow.on('closed', () => {
    captureWindow = null
  })
}

function createReferenceWindow() {
  if (referenceWindow) {
    referenceWindow.focus()
    return
  }

  const boardData = loadReferenceBoard()
  const bounds = boardData.windowBounds || { width: 800, height: 600 }

  referenceWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    minWidth: 180,
    minHeight: 140,
    backgroundColor: '#1a1a2e',
    alwaysOnTop: boardData.alwaysOnTop || false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      navigateOnDragDrop: false,
      preload: path.join(__dirname, 'preload-reference.cjs')
    }
  })

  setupDragDropPrevention(referenceWindow)

  if (isDev) {
    referenceWindow.loadURL('http://localhost:5173/reference.html')
  } else {
    referenceWindow.loadFile(path.join(__dirname, '../dist/reference.html'))
  }

  let saveTimeout = null
  const debouncedSaveBounds = () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      if (!referenceWindow) return
      const b = referenceWindow.getBounds()
      const board = loadReferenceBoard()
      board.windowBounds = { x: b.x, y: b.y, width: b.width, height: b.height }
      saveReferenceBoard(board)
    }, 500)
  }

  referenceWindow.on('move', debouncedSaveBounds)
  referenceWindow.on('resize', debouncedSaveBounds)

  referenceWindow.on('closed', () => {
    referenceWindow = null
    if (saveTimeout) clearTimeout(saveTimeout)
  })
}

const userDataPath = app.getPath('userData')
const artworksPath = path.join(userDataPath, 'artworks')
const configPath = path.join(userDataPath, 'config.json')

function ensureDirectories() {
  if (!fs.existsSync(artworksPath)) {
    fs.mkdirSync(artworksPath, { recursive: true })
  }
}

function loadArtworks() {
  ensureDirectories()
  const dataPath = path.join(userDataPath, 'artworks.json')
  if (fs.existsSync(dataPath)) {
    const data = fs.readFileSync(dataPath, 'utf-8')
    return JSON.parse(data)
  }
  return []
}

function saveArtworks(artworks) {
  ensureDirectories()
  const dataPath = path.join(userDataPath, 'artworks.json')
  fs.writeFileSync(dataPath, JSON.stringify(artworks, null, 2))
}

function loadConfig() {
  if (fs.existsSync(configPath)) {
    const data = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(data)
  }
  return { theme: 'default' }
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

const referenceBoardPath = path.join(userDataPath, 'reference-board.json')

function loadReferenceBoard() {
  if (fs.existsSync(referenceBoardPath)) {
    try {
      const data = fs.readFileSync(referenceBoardPath, 'utf-8')
      return JSON.parse(data)
    } catch { return { items: [], alwaysOnTop: false } }
  }
  return { items: [], alwaysOnTop: false }
}

function saveReferenceBoard(board) {
  fs.writeFileSync(referenceBoardPath, JSON.stringify(board, null, 2))
}

function notifyArtworksUpdated() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('artworks-updated')
  }
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const client = parsedUrl.protocol === 'https:' ? https : http
    client.get(url, { headers: { 'User-Agent': 'ArtArchive/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const contentType = res.headers['content-type'] || ''
        let ext = 'png'
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'
        else if (contentType.includes('gif')) ext = 'gif'
        else if (contentType.includes('webp')) ext = 'webp'
        else if (contentType.includes('bmp')) ext = 'bmp'
        else if (contentType.includes('png')) ext = 'png'
        else {
          const urlPath = parsedUrl.pathname
          const urlExt = path.extname(urlPath).slice(1).toLowerCase()
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(urlExt)) ext = urlExt
        }
        resolve({ buffer, ext })
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

function createArtworkRecord(filePath, title) {
  const artworks = loadArtworks()
  const newArtwork = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    title: title || '快捷采集',
    description: '',
    tags: ['快捷采集'],
    category: 'other',
    imageUrl: '',
    createdAt: new Date().toISOString(),
    favorite: false,
    filePath: filePath
  }
  artworks.unshift(newArtwork)
  saveArtworks(artworks)
  notifyArtworksUpdated()
  return newArtwork
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('get-app-path', () => {
  return userDataPath
})

ipcMain.handle('load-artworks', () => {
  return loadArtworks()
})

ipcMain.handle('save-artworks', (event, artworks) => {
  saveArtworks(artworks)
  return true
})

ipcMain.handle('load-config', () => {
  return loadConfig()
})

ipcMain.handle('save-config', (event, config) => {
  saveConfig(config)
  return true
})

ipcMain.handle('load-categories', () => {
  const config = loadConfig()
  return config.categories || null
})

ipcMain.handle('save-categories', (event, categories) => {
  const config = loadConfig()
  config.categories = categories
  saveConfig(config)
  return true
})

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }
    ]
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  
  return result.filePaths[0]
})

ipcMain.handle('save-image', async (event, { imageData, fileName }) => {
  ensureDirectories()
  
  const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    return null
  }
  
  const ext = matches[1]
  const buffer = Buffer.from(matches[2], 'base64')
  const uniqueName = `${Date.now()}-${fileName}.${ext}`
  const filePath = path.join(artworksPath, uniqueName)
  
  fs.writeFileSync(filePath, buffer)
  
  return filePath
})

ipcMain.handle('read-image', (event, filePath) => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath)
    const ext = path.extname(filePath).slice(1)
    const base64 = data.toString('base64')
    return `data:image/${ext};base64,${base64}`
  }
  return null
})

ipcMain.handle('delete-image', (event, filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
})

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-close', () => {
  mainWindow?.close()
})

// --- Window toggle handlers ---

ipcMain.handle('toggle-capture-window', () => {
  if (captureWindow) {
    captureWindow.close()
    captureWindow = null
  } else {
    createCaptureWindow()
  }
  return true
})

ipcMain.handle('toggle-reference-window', () => {
  if (referenceWindow) {
    referenceWindow.close()
    referenceWindow = null
  } else {
    createReferenceWindow()
  }
  return true
})

// --- Quick Capture IPC handlers ---

ipcMain.handle('capture-image-from-url', async (event, url) => {
  try {
    ensureDirectories()
    const { buffer, ext } = await downloadImage(url)
    const uniqueName = `${Date.now()}-capture.${ext}`
    const filePath = path.join(artworksPath, uniqueName)
    fs.writeFileSync(filePath, buffer)
    const artwork = createArtworkRecord(filePath, '网络采集')
    return { success: true, artwork: { id: artwork.id, title: artwork.title, filePath } }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('capture-image-from-file', async (event, { filePath: srcPath }) => {
  try {
    ensureDirectories()
    const ext = path.extname(srcPath).slice(1) || 'png'
    const uniqueName = `${Date.now()}-capture.${ext}`
    const destPath = path.join(artworksPath, uniqueName)
    fs.copyFileSync(srcPath, destPath)
    const title = path.basename(srcPath, path.extname(srcPath))
    const artwork = createArtworkRecord(destPath, title)
    return { success: true, artwork: { id: artwork.id, title: artwork.title, filePath: destPath } }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('capture-image-from-base64', async (event, { imageData }) => {
  try {
    ensureDirectories()
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) return { success: false, error: '无效的图片数据' }
    const ext = matches[1]
    const buffer = Buffer.from(matches[2], 'base64')
    const uniqueName = `${Date.now()}-capture.${ext}`
    const filePath = path.join(artworksPath, uniqueName)
    fs.writeFileSync(filePath, buffer)
    const artwork = createArtworkRecord(filePath, '快捷采集')
    return { success: true, artwork: { id: artwork.id, title: artwork.title, filePath } }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// --- Clipboard IPC handler ---

// 从剪贴板获取文件路径（兼容 Windows / macOS / Linux）
function getClipboardFilePaths() {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
  const paths = []

  try {
    // Linux (GNOME / KDE 等): x-special/gnome-copied-files 格式
    if (process.platform === 'linux') {
      const buf = clipboard.readBuffer('x-special/gnome-copied-files')
      if (buf && buf.length > 0) {
        const content = buf.toString('utf-8')
        const lines = content.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('file://')) {
            const fp = decodeURIComponent(trimmed.replace('file://', ''))
            if (imageExts.some(ext => fp.toLowerCase().endsWith(ext))) {
              paths.push(fp)
            }
          }
        }
        if (paths.length > 0) return paths
      }
    }

    // macOS: NSFilenamesPboardType / public.file-url
    if (process.platform === 'darwin') {
      const buf = clipboard.readBuffer('public.file-url')
      if (buf && buf.length > 0) {
        const url = buf.toString('utf-8').trim()
        if (url.startsWith('file://')) {
          const fp = decodeURIComponent(url.replace('file://', ''))
          if (imageExts.some(ext => fp.toLowerCase().endsWith(ext))) {
            paths.push(fp)
          }
        }
      }
      if (paths.length > 0) return paths
    }

    // Windows: FileNameW 格式
    if (process.platform === 'win32') {
      const buf = clipboard.readBuffer('FileNameW')
      if (buf && buf.length > 0) {
        // UTF-16LE encoded, null-terminated
        const fp = buf.toString('utf16le').replace(/\0+$/, '').trim()
        if (fp && imageExts.some(ext => fp.toLowerCase().endsWith(ext))) {
          paths.push(fp)
        }
      }
      if (paths.length > 0) return paths
    }

    // 通用回退：读取纯文本看是否为有效文件路径
    const text = clipboard.readText().trim()
    if (text && !text.includes('\n') && fs.existsSync(text)) {
      if (imageExts.some(ext => text.toLowerCase().endsWith(ext))) {
        paths.push(text)
      }
    }
  } catch {}

  return paths
}

ipcMain.handle('read-clipboard-image', async () => {
  try {
    // 策略1：直接读取剪贴板中的位图数据（截屏、从图片编辑器复制等）
    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      ensureDirectories()
      const buffer = image.toPNG()
      const uniqueName = `${Date.now()}-clipboard.png`
      const filePath = path.join(artworksPath, uniqueName)
      fs.writeFileSync(filePath, buffer)
      const artwork = createArtworkRecord(filePath, '剪贴板粘贴')
      return {
        success: true,
        artwork: { id: artwork.id, title: artwork.title, filePath },
        imageData: `data:image/png;base64,${buffer.toString('base64')}`
      }
    }

    // 策略2：读取剪贴板中复制的文件路径（文件管理器里右键复制，支持批量）
    const filePaths = getClipboardFilePaths()
    if (filePaths.length > 0) {
      ensureDirectories()
      if (filePaths.length === 1) {
        // 单个文件 - 保持原有返回格式
        const srcPath = filePaths[0]
        if (fs.existsSync(srcPath)) {
          const ext = path.extname(srcPath).slice(1) || 'png'
          const uniqueName = `${Date.now()}-clipboard.${ext}`
          const destPath = path.join(artworksPath, uniqueName)
          fs.copyFileSync(srcPath, destPath)
          const title = path.basename(srcPath, path.extname(srcPath))
          const artwork = createArtworkRecord(destPath, title)
          const data = fs.readFileSync(destPath)
          return {
            success: true,
            artwork: { id: artwork.id, title: artwork.title, filePath: destPath },
            imageData: `data:image/${ext};base64,${data.toString('base64')}`
          }
        }
      } else {
        // 多个文件 - 返回 results 数组
        const results = []
        for (const srcPath of filePaths) {
          if (!fs.existsSync(srcPath)) continue
          const ext = path.extname(srcPath).slice(1) || 'png'
          const uniqueName = `${Date.now()}-clipboard-${Math.random().toString(36).substr(2, 5)}.${ext}`
          const destPath = path.join(artworksPath, uniqueName)
          fs.copyFileSync(srcPath, destPath)
          const title = path.basename(srcPath, path.extname(srcPath))
          const artwork = createArtworkRecord(destPath, title)
          const data = fs.readFileSync(destPath)
          results.push({
            artwork: { id: artwork.id, title: artwork.title, filePath: destPath },
            imageData: `data:image/${ext};base64,${data.toString('base64')}`
          })
        }
        if (results.length > 0) {
          return {
            success: true,
            results,
            artwork: results[0].artwork,
            imageData: results[0].imageData
          }
        }
      }
    }

    return { success: false, error: '剪贴板无图片（截图后粘贴，或复制图片文件后粘贴）' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// --- Reference Board IPC handlers ---

ipcMain.handle('load-reference-board', () => {
  return loadReferenceBoard()
})

ipcMain.handle('save-reference-board', (event, data) => {
  saveReferenceBoard(data)
  return true
})

ipcMain.handle('reference-toggle-always-on-top', (event, value) => {
  if (referenceWindow && !referenceWindow.isDestroyed()) {
    referenceWindow.setAlwaysOnTop(value)
    const board = loadReferenceBoard()
    board.alwaysOnTop = value
    saveReferenceBoard(board)
  }
  return true
})

ipcMain.handle('get-artworks-for-picker', () => {
  const artworks = loadArtworks()
  return artworks.map((a) => {
    let imageData = ''
    if (a.filePath && fs.existsSync(a.filePath)) {
      const data = fs.readFileSync(a.filePath)
      const ext = path.extname(a.filePath).slice(1)
      imageData = `data:image/${ext};base64,${data.toString('base64')}`
    }
    return {
      id: a.id,
      title: a.title,
      category: a.category,
      tags: a.tags || [],
      imageData,
      filePath: a.filePath
    }
  })
})

// --- Batch import: 选择多张图片文件 ---

ipcMain.handle('select-images-for-board', async () => {
  const parentWin = referenceWindow || mainWindow
  const result = await dialog.showOpenDialog(parentWin, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return []
  }

  // 返回每个文件的路径和 base64 数据
  const images = []
  for (const fp of result.filePaths) {
    try {
      const data = fs.readFileSync(fp)
      const ext = path.extname(fp).slice(1)
      const imageData = `data:image/${ext};base64,${data.toString('base64')}`
      images.push({ filePath: fp, imageData })
    } catch { /* skip unreadable files */ }
  }
  return images
})

// --- Sub-window control handlers ---

ipcMain.on('capture-window-close', () => {
  if (captureWindow) { captureWindow.close(); captureWindow = null }
})

ipcMain.on('reference-window-close', () => {
  if (referenceWindow) { referenceWindow.close(); referenceWindow = null }
})

ipcMain.on('reference-window-minimize', () => {
  referenceWindow?.minimize()
})

ipcMain.on('reference-window-maximize', () => {
  if (referenceWindow?.isMaximized()) {
    referenceWindow.unmaximize()
  } else {
    referenceWindow?.maximize()
  }
})

// --- AI Chat IPC handler ---

function makeHttpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const client = parsedUrl.protocol === 'https:' ? https : http
    const req = client.request(url, options, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf-8')
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
      res.on('error', reject)
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

ipcMain.handle('ai-chat', async (event, { provider, apiKey, model, messages, baseUrl }) => {
  try {
    const providerBaseUrls = {
      openai: 'https://api.openai.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
      zhipu: 'https://open.bigmodel.cn/api/paas/v4',
      qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    }

    if (provider === 'claude') {
      // Anthropic Claude format
      const effectiveBaseUrl = baseUrl || 'https://api.anthropic.com/v1'
      const systemMsg = messages.find(m => m.role === 'system')
      const nonSystemMsgs = messages.filter(m => m.role !== 'system')
      const body = {
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 2048,
        messages: nonSystemMsgs.map(m => ({ role: m.role, content: m.content })),
      }
      if (systemMsg) body.system = systemMsg.content
      const result = await makeHttpsRequest(
        `${effectiveBaseUrl}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        },
        JSON.stringify(body)
      )
      return result.content[0].text
    } else {
      // OpenAI-compatible format (OpenAI, DeepSeek, Zhipu, Qwen, custom)
      const effectiveBaseUrl = provider === 'custom'
        ? baseUrl
        : (providerBaseUrls[provider] || baseUrl || 'https://api.openai.com/v1')
      const result = await makeHttpsRequest(
        `${effectiveBaseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        },
        JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        })
      )
      return result.choices[0].message.content
    }
  } catch (error) {
    throw new Error(error.message || 'AI request failed')
  }
})

// --- App Config IPC handlers ---

ipcMain.handle('load-app-config', () => {
  return loadConfig()
})

ipcMain.handle('save-app-config', (event, config) => {
  saveConfig(config)
  return true
})

// --- Unsplash IPC handlers ---

ipcMain.handle('unsplash-search', async (event, { accessKey, query, page, perPage }) => {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage || 20}`
    const result = await makeHttpsRequest(url, {
      method: 'GET',
      headers: { 'Authorization': `Client-ID ${accessKey}` }
    })
    return result
  } catch (error) {
    throw new Error(error.message || 'Unsplash search failed')
  }
})

ipcMain.handle('unsplash-random', async (event, { accessKey, count, query }) => {
  try {
    let url = `https://api.unsplash.com/photos/random?count=${count || 6}`
    if (query) url += `&query=${encodeURIComponent(query)}`
    const result = await makeHttpsRequest(url, {
      method: 'GET',
      headers: { 'Authorization': `Client-ID ${accessKey}` }
    })
    return result
  } catch (error) {
    throw new Error(error.message || 'Unsplash random failed')
  }
})

ipcMain.handle('download-external-image', async (event, { url, title }) => {
  try {
    ensureDirectories()
    const { buffer, ext } = await downloadImage(url)
    const uniqueName = `${Date.now()}-discover.${ext}`
    const filePath = path.join(artworksPath, uniqueName)
    fs.writeFileSync(filePath, buffer)
    const artwork = createArtworkRecord(filePath, title || '素材发现')
    return { success: true, artwork: { id: artwork.id, title: artwork.title, filePath } }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

import { app, BrowserWindow, shell, ipcMain, protocol } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'

import sequelize from '../database/initialize'
import '../database/associations'

import { handleDeleteDirectory, handleDirectoriesFileCount, handleListDirectories, handleOpenDirectory, handleAddDirectory, handleRefreshDirectories, handleSelectDirectory, handleRefreshSingleDirectory } from '../handlers/directory'
import { handleFileRename, handleListFiles, handleSelectFile } from '../handlers/file'
import { handleListTags, handleTagFile, handleUntagFile, handleTagFiles, handleUntagFiles } from '../handlers/tag'
import { handleBulkExtractAudio, handleSelectExtractAudioFiles, handleSelectSpliceVideoFile, handleSpliceVideo, handleGetVideoFramerate, handleAutoSplice, handleGetAudioSampleRate, handleGetVideoDuration, handleConvertVideo } from '../handlers/ffmpeg'
import { handleListNotes, handleAddNote, handleUpdateNote, handleDeleteNote } from '../handlers/note'
import { handleDatabaseExport, handleDatabaseImport, handleDatabaseReset } from '../handlers/database'
import { handleSaveToJSON, handleLoadFromJSON } from '../handlers/json'
import { type AutoSpliceSettings, type AudioFileFormat, type SpliceRegion, type FileTypes } from '../../shared/types'
import { type File } from '../database/schemas'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow (): Promise<void> {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    void win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    void win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) void shell.openExternal(url)
    return { action: 'deny' }
  })
}

void app.whenReady().then(() => {
  protocol.registerFileProtocol('media-loader', (request, callback) => {
    const url = request.url.replace('media-loader://', '')
    try {
      callback(url)
    } catch (error) {
      console.error(error)
      callback(join(__dirname, '../index.html'))
    }
  })

  void createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    void createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void childWindow.loadURL(`${url}#${arg}`)
  } else {
    void childWindow.loadFile(indexHtml, { hash: arg })
  }
})

void sequelize.sync()

// Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err)
  })

//
// DIRECTORY
//

ipcMain.on('add-directory', (event) => {
  if (win) {
    void handleAddDirectory(win, event)
  }
})

ipcMain.on('list-directories', (event) => {
  void handleListDirectories(event)
})

ipcMain.on('open-directory', (_, arg: { path: string }) => {
  void handleOpenDirectory(arg)
})

ipcMain.on('delete-directory', (event, arg: { directoryId: number }) => {
  void handleDeleteDirectory(event, arg)
})

ipcMain.on('list-directories-file-count', (event) => {
  void handleDirectoriesFileCount(event)
})

ipcMain.on('refresh-directories', (event, arg: { directoryIds: number[] }) => {
  void handleRefreshDirectories(event, arg)
})

ipcMain.on('refresh-single-directory', (event, arg: { directoryId: number }) => {
  void handleRefreshSingleDirectory(event, arg)
})

ipcMain.on('select-directory', (event) => {
  if (win) {
    void handleSelectDirectory(win, event)
  }
})

//
// FFMPEG
//

ipcMain.on('bulk-extract-audio', (event, arg: { files: string[], fileFormat: AudioFileFormat, outputDirectory: string }) => {
  void handleBulkExtractAudio(event, arg)
})

ipcMain.on('select-extract-audio-files', (event) => {
  if (win) {
    void handleSelectExtractAudioFiles(win, event)
  }
})

ipcMain.on('select-splice-video-file', (event) => {
  if (win) {
    void handleSelectSpliceVideoFile(win, event)
  }
})

ipcMain.on('splice-video', (event, arg: { videoPath: string, spliceRegions: SpliceRegion[], outputDirectory?: string, videoBasename: string }) => {
  void handleSpliceVideo(event, arg)
})

ipcMain.on('get-video-framerate', (event, arg: { videoPath: string }) => {
  void handleGetVideoFramerate(event, arg)
})

ipcMain.on('get-video-duration', (event, arg: { videoPath: string }) => {
  handleGetVideoDuration(event, arg)
})

ipcMain.on('auto-splice', (event, arg: { videoPath: string, autoSpliceSettings: AutoSpliceSettings, outputDirectory?: string }) => {
  void handleAutoSplice(event, arg)
})

ipcMain.on('get-audio-sample-rate', (event, arg: { filePath: string }) => {
  void handleGetAudioSampleRate(event, arg)
})

ipcMain.on('convert-video', (event, arg: { videoPath: string }) => {
  void handleConvertVideo(event, arg)
})

//
// FILE
//

ipcMain.on('select-file', (event) => {
  if (win) {
    void handleSelectFile(win, event)
  }
})

ipcMain.on('list-files', (event, arg: { directories?: number[], tags?: number[], fileTypes?: FileTypes[], searchTerm?: string }) => {
  void handleListFiles(event, arg)
})

ipcMain.on('open-file', (_, arg: string) => {
  void shell.openPath(arg)
})

ipcMain.on('open-file-folder', (_, arg: string) => {
  console.log(arg)
  shell.showItemInFolder(arg)
})

ipcMain.on('rename-file', (event, arg: { file: File, name: string }) => {
  void handleFileRename(event, arg)
})

//
// TAG
//

ipcMain.on('tag-file', (event, arg: { fileId: number, tag: string }) => {
  void handleTagFile(event, arg)
})

ipcMain.on('tag-files', (event, arg: { fileIds: number[], tag: string }) => {
  void handleTagFiles(event, arg)
})

ipcMain.on('list-tags', (event) => {
  void handleListTags(event)
})

ipcMain.on('untag-file', (event, arg: { fileId: number, tagId: number }) => {
  void handleUntagFile(event, arg)
})

ipcMain.on('untag-files', (event, arg: { fileIds: number[], tagId: number }) => {
  void handleUntagFiles(event, arg)
})

//
// NOTES
//

ipcMain.on('list-notes', (event, arg: { fileId: number }) => {
  void handleListNotes(event, arg)
})

ipcMain.on('add-note', (event, arg: { fileId: number, note: string }) => {
  void handleAddNote(event, arg)
})

ipcMain.on('update-note', (event, arg: { id: number, note: string }) => {
  void handleUpdateNote(event, arg)
})

ipcMain.on('delete-note', (event, arg: { id: number }) => {
  void handleDeleteNote(event, arg)
})

//
// DATABASE
//

ipcMain.on('database-export', (event) => {
  void handleDatabaseExport(event)
})

ipcMain.on('database-import', (event) => {
  void handleDatabaseImport(event)
})

ipcMain.on('database-reset', (event) => {
  void handleDatabaseReset(event)
})

// JSON

ipcMain.on('save-to-json', (event, arg) => {
  void handleSaveToJSON(event, arg)
})

ipcMain.on('load-from-json', (event) => {
  void handleLoadFromJSON(event)
})

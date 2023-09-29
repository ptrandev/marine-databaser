import { app, BrowserWindow, shell, ipcMain, protocol } from "electron";
import { release } from "node:os";
import { join } from "node:path";

import sequelize from "../database/initialize";
import "../database/associations";

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
process.env.DIST_ELECTRON = join(__dirname, "../");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: join(process.env.PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol("media-loader", (request, callback) => {
    const url = request.url.replace("media-loader://", "");
    try {
      return callback(url);
    } catch (error) {
      console.error(error);
      return callback(join(__dirname, "../index.html"));
    }
  });

  createWindow();
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

sequelize.sync();

// Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

import { handleDeleteDirectory, handleDirectoriesFileCount, handleListDirectories, handleOpenDirectory, handleAddDirectory, handleRefreshDirectories, handleSelectDirectory } from "../handlers/directory";
import { handleFileRename, handleListFiles, handleSelectFile } from "../handlers/file";
import { handleListTags, handleTagFile, handleUntagFile, handleTagFiles, handleUntagFiles } from "../handlers/tag";
import { handleBulkExtractAudio, handleSelectExtractAudioFiles, handleSelectSpliceVideoFile, handleSpliceVideo } from "../handlers/ffmpeg";
import { handleListNotes, handleAddNote, handleUpdateNote, handleDeleteNote } from "../handlers/note";

//
// DIRECTORY
//

ipcMain.on("add-directory", async (event) => {
  handleAddDirectory(win, event);
});

ipcMain.on("list-directories", async (event) => {
  handleListDirectories(event);
});

ipcMain.on("open-directory", async (_, arg) => {
  handleOpenDirectory(arg);
});

ipcMain.on("delete-directory", async (event, arg) => {
  handleDeleteDirectory(event, arg);
});

ipcMain.on('list-directories-file-count', async (event) => {
  handleDirectoriesFileCount(event);
});

ipcMain.on('refresh-directories', async (event) => {
  handleRefreshDirectories(event);
})

ipcMain.on('select-directory', async (event) => {
  handleSelectDirectory(win, event);
})

//
// FFMPEG
//

ipcMain.on("bulk-extract-audio", async (event, arg) => {
  handleBulkExtractAudio(event, arg);
})

ipcMain.on("select-extract-audio-files", async (event) => {
  handleSelectExtractAudioFiles(win, event);
});

ipcMain.on("select-splice-video-file", async (event) => {
  handleSelectSpliceVideoFile(win, event);
});

ipcMain.on("splice-video", async (event, arg) => {
  handleSpliceVideo(event, arg);
});

//
// FILE
//

ipcMain.on("select-file", async (event) => {
  handleSelectFile(win, event);
});

ipcMain.on("list-files", async (event, arg) => {
  handleListFiles(event, arg);
});

ipcMain.on("open-file", async (_, arg) => {
  shell.openPath(arg);
});

ipcMain.on("rename-file", async (event, arg) => {
  handleFileRename(event, arg);
});

//
// TAG
//

ipcMain.on("tag-file", async (event, arg) => {
  handleTagFile(event, arg);
});

ipcMain.on("tag-files", async (event, arg) => {
  handleTagFiles(event, arg);
});

ipcMain.on("list-tags", async (event) => {
  handleListTags(event);
});

ipcMain.on("untag-file", async (event, arg) => {
  handleUntagFile(event, arg);
});

ipcMain.on("untag-files", async (event, arg) => {
  handleUntagFiles(event, arg);
});

//
// NOTES
//

ipcMain.on("list-notes", async (event, arg) => {
  handleListNotes(event, arg);
})

ipcMain.on("add-note", async (event, arg) => {
  handleAddNote(event, arg);
})

ipcMain.on("update-note", async (event, arg) => {
  handleUpdateNote(event, arg);
})

ipcMain.on("delete-note", async (event, arg) => {
  handleDeleteNote(event, arg);
})
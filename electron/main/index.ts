import { app, BrowserWindow, shell, ipcMain } from "electron";
import { release } from "node:os";
import { join } from "node:path";

import sequelize from "../database/initialize";
import { Directory, File, Tag, FileTag } from "../database/schemas";
import "../database/associations";

import path from "path";

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

app.whenReady().then(createWindow);

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

import { dialog } from "electron";
import { FindOptions } from "sequelize";
const fs = require("fs").promises;

const getFileList = async (directory) => {
  let files = [];
  const items = await fs.readdir(directory, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      files = files.concat(await getFileList(`${directory}/${item.name}`));
    } else {
      files.push(`${directory}/${item.name}`);
    }
  }

  return files;
};

ipcMain.on("select-directory", async (event) => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });

  if (result.filePaths.length === 0) return;

  event.reply("selected-directory", result.filePaths);

  // add directory to database
  const directory = await Directory.create({
    name: result.filePaths[0].split("/").pop(),
    path: result.filePaths[0],
  });

  // look at files in directory; make sure to crawl subdirectories
  const files = await getFileList(result.filePaths[0]);

  await File.bulkCreate(
    files.map((file) => ({
      name: file.split("/").pop(),
      path: file,
      directory_id: directory.id,
    }))
  );

  event.reply("initialized-directory");
});

ipcMain.on("select-file", async (event) => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
  });

  const file: File = await File.create(
    {
      name: result.filePaths[0].split("/").pop(),
      path: result.filePaths[0],
    },
    { raw: true }
  );

  event.reply("selected-file", file);
});

ipcMain.on("list-files", async (event, arg) => {
  const {
    directories,
    tags,
  }: {
    directories: number[];
    tags: number[];
  } = arg;

  const options: FindOptions = {
    where: {},
    include: {
      model: Tag,
    },
  };

  if (directories.length > 0) {
    options.where["directory_id"] = directories;
  }

  if (tags.length > 0) {
    options.include = [
      {
        model: Tag,
        where: {
          id: tags,
        },
      },
    ];
  }

  const files: File[] = await File.findAll(options).then((files) =>
    files.map((file) => file.toJSON())
  );

  event.reply("listed-files", files);
});

ipcMain.on("open-file", async (_, arg) => {
  shell.openPath(arg);
});

ipcMain.on("list-directories", async (event) => {
  const directories: Directory[] = await Directory.findAll().then(
    (dictionaries) => dictionaries.map((dictionary) => dictionary.toJSON())
  );
  event.reply("listed-directories", directories);
});

ipcMain.on("open-directory", async (_, arg) => {
  const { path }: { path: string } = arg;
  shell.openPath(path);
});

ipcMain.on("delete-directory", async (event, arg) => {
  const { directory_id }: { directory_id: number } = arg;

  await Directory.destroy({
    where: {
      id: directory_id,
    },
  });

  // remove all files associated with directory
  await File.destroy({
    where: {
      directory_id: directory_id,
    },
  });

  event.reply("deleted-directory", arg);
});

ipcMain.on("list-tags", async (event) => {
  const tags: Tag[] = await Tag.findAll().then((tags) =>
    tags.map((tag) => tag.toJSON())
  );
  event.reply("listed-tags", tags);
});

const createTag = async (name) => {
  const existingTag: Tag | null = await Tag.findOne({
    where: {
      name,
    },
  });

  // tag already exists, so just return it
  if (existingTag) return existingTag;

  const tag: Tag = await Tag.create({
    name,
  });

  return tag;
};

ipcMain.on("tag-file", async (event, arg) => {
  const {
    file,
    tag,
  }: {
    file: File;
    tag: string;
  } = arg;

  const _tag: Tag = await createTag(tag);

  // check if file already has tag
  const _file: File | null = await File.findOne({
    where: {
      id: file.id,
    },
    include: [
      {
        model: Tag,
        where: {
          name: tag,
        },
      },
    ],
  });

  if (_file) return;

  // else add tag to file
  const fileTag: FileTag = await FileTag.create({
    file_id: file.id,
    tag_id: _tag.id,
  });

  event.reply("tagged-file", fileTag);
});

ipcMain.on("untag-file", async (event, arg) => {
  const {
    file_id,
    tag_id,
  }: {
    file_id: number;
    tag_id: number;
  } = arg;

  await FileTag.destroy({
    where: {
      file_id,
      tag_id,
    },
  });

  event.reply("untagged-file", arg);
});

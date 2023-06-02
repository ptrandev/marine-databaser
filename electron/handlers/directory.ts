import { BrowserWindow, IpcMainEvent, dialog, shell } from "electron";
import { Directory, File } from "../database/schemas";
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

export const handleSelectDirectory = async (win : BrowserWindow, event : IpcMainEvent) => {
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
};

export const handleListDirectories = async (event : IpcMainEvent) => {
  const directories: Directory[] = await Directory.findAll().then(
    (dictionaries) => dictionaries.map((dictionary) => dictionary.toJSON())
  );
  event.reply("listed-directories", directories);
};

export const handleOpenDirectory = async (arg : { path: string }) => {
  const { path } = arg;
  shell.openPath(path);
};

export const handleDeleteDirectory = async (event : IpcMainEvent, arg : { directory_id: number }) => {
  const { directory_id } = arg;

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
}
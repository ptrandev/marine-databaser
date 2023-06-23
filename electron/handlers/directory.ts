import { BrowserWindow, IpcMainEvent, dialog, shell } from "electron";
import { Directory, File } from "../database/schemas";
const fs = require("fs").promises;
import mime from "mime-types";
import { Sequelize, Op } from "sequelize";

const getFileList = async (directory) => {
  let files = [];
  const items = await fs.readdir(directory, { withFileTypes: true }).catch(() => {
    return [];
  });

  for (const item of items) {
    if (item.isDirectory()) {
      files = files.concat(await getFileList(`${directory}/${item.name}`));
    } else {
      files.push(`${directory}/${item.name}`);
    }
  }

  return files;
};

export const handleSelectDirectory = async (win: BrowserWindow, event: IpcMainEvent) => {
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
    await Promise.all(files.map(async (file) => ({
      name: file.split("/").pop(),
      path: file,
      directory_id: directory.id,
      mimeType: mime.lookup(file).toString(),
      lastModified: (await fs.stat(file)).mtime,
      fileSize: (await fs.stat(file)).size,
    })))
  );

  event.reply("initialized-directory");
};

export const handleListDirectories = async (event: IpcMainEvent) => {
  const directories: Directory[] = await Directory.findAll().then(
    (dictionaries) => dictionaries.map((dictionary) => dictionary.toJSON())
  );
  event.reply("listed-directories", directories);
};

export const handleDirectoriesFileCount = async (event: IpcMainEvent) => {
  // get number of files for each directory
  const directories = await Directory.findAll({
    attributes: [
      "id",
      [Sequelize.fn("COUNT", Sequelize.col("files.id")), "file_count"],
    ],
    include: [
      {
        model: File,
        attributes: [],
      },
    ],
    group: ["directory.id"],
  }).then(
    (directories) =>
      directories.reduce((acc, directory) => {
        // @ts-ignore
        const { id, file_count } = directory.toJSON();
        acc[id] = file_count;
        return acc;
      }, {})
  );

  event.reply("listed-directories-file-count", directories);
};

export const handleOpenDirectory = async (arg: { path: string }) => {
  const { path } = arg;
  shell.openPath(path);
};

export const handleDeleteDirectory = async (event: IpcMainEvent, arg: { directory_id: number }) => {
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

/**
 * Refreshes the files in every directory
 * @param event
 * @returns
 */
export const handleRefreshDirectories = async (event: IpcMainEvent) => {
  // get all directories
  const directories = await Directory.findAll().then(
    (dictionaries) => dictionaries.map((dictionary) => dictionary.toJSON())
  )

  directories.forEach(async (directory) => {
    const files = await getFileList(directory.path);

    // check if file already exists in database
    const existingFiles = await File.findAll({
      where: {
        path: files,
      },
    }).then((files) => files.map((file) => file.toJSON()));

    // if it does, update the lastModified and fileSize
    await Promise.all(
      existingFiles.map(async (file) => {
        const { lastModified, fileSize } = await fs.stat(file.path);
        await File.update(
          {
            lastModified,
            fileSize,
          },
          {
            where: {
              id: file.id,
            },
          }
        );
      }
      )
    );

    // if it doesn't, add it to the database
    await File.bulkCreate(
      await Promise.all(
        files
          .filter((file) => !existingFiles.map((file) => file.path).includes(file))
          .map(async (file) => ({
            name: file.split("/").pop(),
            path: file,
            directory_id: directory.id,
            mimeType: mime.lookup(file).toString(),
            lastModified: (await fs.stat(file)).mtime,
            fileSize: (await fs.stat(file)).size,
          }))
      )
    );

    // get all files that are in the database but not in the directory
    const deletedFiles = await File.findAll({
      where: {
        directory_id: directory.id,
        path: {
          [Op.notIn]: files,
        },
      },
    }).then((files) => files.map((file) => file.toJSON()));

    // delete them
    await File.destroy({
      where: {
        id: deletedFiles.map((file) => file.id),
      },
    });

    event.reply("refreshed-directories", directory);
  })
}
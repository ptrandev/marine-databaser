import { BrowserWindow, IpcMainEvent, dialog, shell } from "electron";
import { Directory, File, FileTag } from "../database/schemas";
const fs = require("fs").promises;
import mime from "mime-types";
import { Sequelize, Op } from "sequelize";
import { handleKillOrphanedTags } from "./tag";

const getFileList = async (directory: string): Promise<string[]> => {
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

const addFilesToDatabase = async ({ files, directoryId }: {
  files: string[],
  directoryId: number
}): Promise<File[]> => {
  return await File.bulkCreate(
    await Promise.all(
      files.map(async (file) => {
        return await addFileToDatabase({ file, directoryId });
      }
      )
    )
  )
}

const addFileToDatabase = async ({ file, directoryId }: {
  file: string,
  directoryId: number
}): Promise<
  {
    name: string,
    path: string,
    directoryId: number,
    mimeType: string,
    lastModified: Date,
    birthTime: Date,
    fileSize: number
  }> => {
  const { mtime, birthtime, size } = await fs.stat(file);

  return {
    name: file.split("/").pop(),
    path: file,
    directoryId,
    mimeType: mime.lookup(file).toString(),
    lastModified: mtime,
    birthTime: birthtime,
    fileSize: size,
  }
}

export const handleAddDirectory = async (win: BrowserWindow, event: IpcMainEvent) => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });

  if (result.filePaths.length === 0) return;

  event.reply("added-directory", result.filePaths);

  // add directory to database
  const directory = await Directory.create({
    name: result.filePaths[0].split("/").pop(),
    path: result.filePaths[0],
  });

  // look at files in directory; make sure to crawl subdirectories
  const files = await getFileList(result.filePaths[0]);

  await addFilesToDatabase({ files, directoryId: directory.id });

  event.reply("initialized-directory");
};

/**
 * Allows the user to select a single directory
 * @param {BrowserWindow} win - the window to show the dialog in
 * @param {IpcMainEvent} event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when the directory has been selected
 */
export const handleSelectDirectory = async (win: BrowserWindow, event: IpcMainEvent) => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });

  if (result.filePaths.length === 0) return;

  event.reply("selected-directory", result.filePaths);
}

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

  // make sure the directory exists before opening it
  await fs.stat(path).catch(() => {
    throw new Error("Directory does not exist");
  });

  shell.openPath(path);
};

export const handleDeleteDirectory = async (event: IpcMainEvent, arg: { directoryId: number }) => {
  const { directoryId } = arg;

  await Directory.destroy({
    where: {
      id: directoryId,
    },
  });

  // remove all files associated with directory
  await File.destroy({
    where: {
      directoryId: directoryId,
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

  if (directories.length === 0) {
    event.reply("refreshed-directories")
    return
  }

  directories.forEach(async (directory) => {
    const currentTime = new Date();

    const files = await getFileList(directory.path);

    // get files that already exist in the database
    // to exist in the database, it must have the same path and birthTime
    const _existingFiles = await File.findAll({
      where: {
        path: {
          [Op.in]: files
        }
      }
    })

    // filter out files that don't have the same birthTime as the file on disk
    // use await fs.stat(file.path) to get the birthTime of the file on disk
    const existingFiles = await Promise.all(
      _existingFiles.map(async (file) => {
        const { birthtime } = await fs.stat(file.path);
        if (birthtime.getTime() === file.birthTime.getTime()) {
          return file
        }
        return null
      })
    ).then((files) => files.filter((file) => file !== null))

    // for files that already exist in the database, update metadata based upon the file id
    const updateExistingFiles = await Promise.all(
      existingFiles.map(async (file) => {
        const { mtime, size } = await fs.stat(file.path);
        return {
          ...file.toJSON(),
          lastModified: mtime,
          fileSize: size,
          updatedAt: currentTime,
        }
      }
      )
    )

    await File.bulkCreate(updateExistingFiles, {
      updateOnDuplicate: [
        "lastModified",
        "fileSize",
        "updatedAt"
      ]
    })

    const existingFilesPaths = existingFiles.map((file) => file.path);

    // get files that have been renamed
    // to be renamed, the file must have the same birthTime, fileSize, mimeType,
    // and lastModified, but a different path
    const renamedFiles = await Promise.all(
      files
        .filter((file) => !existingFilesPaths.includes(file))
        .map(async (file) => {
          const { birthtime, size, mtime } = await fs.stat(file);
          const mimeType = mime.lookup(file).toString();

          const renamedFile = await File.findOne({
            where: {
              birthTime: birthtime,
              fileSize: size,
              lastModified: mtime,
              mimeType,
            },
          });

          // if the file was renamed, update the database
          if (renamedFile !== null) {
            await File.update(
              {
                name: file.split("/").pop(),
                path: file,
                updatedAt: currentTime,
              },
              {
                where: {
                  id: renamedFile.id,
                },
              }
            )

            return await File.findOne({
              where: {
                id: renamedFile.id,
              },
            });
          }

          return null;
        })
    ).then((files) => files.filter((file) => file !== null));

    const renamedFilesPaths = renamedFiles.map((file) => file.path);

    // add new files to the database
    await addFilesToDatabase({
      files: files.filter(
        (file) =>
          !existingFilesPaths.includes(file) &&
          !renamedFilesPaths.includes(file)
      ),
      directoryId: directory.id
    });

    // get all files that are in the database but not in the directory
    const deletedFiles = await File.findAll({
      where: {
        directoryId: directory.id,
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

    // remove file tag associations for deleted files
    await FileTag.destroy({
      where: {
        // @ts-ignore
        file_id: deletedFiles.map((file) => file.id),
      },
    });

    event.reply("refreshed-directory", directory.id);
  })

  // remove tags that no longer have any associations
  await handleKillOrphanedTags(event);

  event.reply("refreshed-directories")
}
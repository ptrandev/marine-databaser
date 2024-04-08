import { type BrowserWindow, type IpcMainEvent, dialog, shell } from 'electron'
import { Directory, File, FileTag } from '../database/schemas'
import mime from 'mime-types'
import { Sequelize, Op } from 'sequelize'
import { handleKillOrphanedTags } from './tag'
import fs from 'fs/promises'
import { type RefreshedDirectories } from 'shared/types'
import path from 'path'
import sequelize from '../database/initialize'

/**
 * Given a directory, returns a list of all files in it
 * @param {string} directory - the directory to search
 * @returns {Promise<string[]>} - a promise that resolves with a list of all files in the directory
 */
const getFileList = async (directory: string): Promise<string[]> => {
  let files: string[] = []

  const items = await fs.readdir(directory, { withFileTypes: true }).catch(() => {
    return []
  })

  for (const item of items) {
    if (item.isDirectory()) {
      files = files.concat(await getFileList(`${directory}/${item.name}`))
    } else {
      files.push(`${directory}/${item.name}`)
    }
  }

  return files
}

/**
 * Adds files to the database
 * @param files - the files to add
 * @param directoryId - the directory to add the files to
 * @returns a promise that resolves with the files that were added
 */
export const addFilesToDatabase = async ({ files, directoryId }: {
  files: string[]
  directoryId: number
}): Promise<File[]> => {
  return await File.bulkCreate(
    // @ts-expect-error - files is an array of strings
    await Promise.all(
      files.map(async (file) => {
        return await addFileToDatabase({ file, directoryId })
      }
      )
    )
  )
}

/**
 * Give a path, finds the directory that matches it
 * @param path - the path to search for
 * @returns a promise that resolves with the directory that matches the path
 */
export const findDirectoryByPath = async (path: string): Promise<Directory | null> => {
  return await Directory.findAll({
    where: {
      path: {
        [Op.startsWith]: path
      }
    }
  }).then((directories) => {
    return directories.sort((a, b) => b.path.length - a.path.length)[0]
  })
}

/**
 * Adds a file to the database
 * @param file - the file to add
 * @param directoryId - the directory to add the file to
 * @returns a promise that resolves with the file that was added
 */
const addFileToDatabase = async ({ file, directoryId }: {
  file: string
  directoryId: number
}): Promise<{
  name: string
  path: string
  directoryId: number
  mimeType: string
  lastModified: Date
  birthTime: Date
  fileSize: number
}> => {
  const { mtime, birthtime, size } = await fs.stat(file)

  return {
    name: path.basename(file),
    path: file,
    directoryId,
    mimeType: mime.lookup(file).toString(),
    lastModified: mtime,
    birthTime: birthtime,
    fileSize: size
  }
}

/**
 * Refreshes a directory
 * @param {number} directoryId - the id of the directory to refresh
 * @returns {Promise<RefreshedDirectories>} - a promise that resolves with the number of files that were updated
 */
const refreshDirectory = async (directoryId: number): Promise<RefreshedDirectories> => {
  const directory = await Directory.findOne({
    where: {
      id: directoryId
    }
  })

  // if the directory doesn't exist, return an error
  if (directory === null) {
    throw new Error('Directory does not exist.')
  }

  // use fs to see if we have access to the directory
  try {
    await fs.access(directory.path)
  } catch {
    throw new Error('Directory cannot be found. It may be deleted or exists on an external drive that is not connected.')
  }

  const currentTime = new Date()

  const files = await getFileList(directory.path)

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
  const existingFiles: File[] = await Promise.all(
    _existingFiles.map(async (file) => {
      const { birthtime } = await fs.stat(file.path)
      if (birthtime.getTime() === file.birthTime.getTime()) {
        return file
      }
      return null
    })
  ).then((files) => files.filter((file) => file !== null)) as File[]

  // for files that already exist in the database, update metadata based upon the file id
  const updateExistingFiles = await Promise.all(
    existingFiles.map(async (file) => {
      const { mtime, size } = await fs.stat(file.path)
      return {
        ...file.toJSON(),
        lastModified: mtime,
        fileSize: size,
        updatedAt: currentTime
      }
    }
    )
  )

  await File.bulkCreate(updateExistingFiles, {
    updateOnDuplicate: [
      'lastModified',
      'fileSize',
      'updatedAt'
    ]
  })

  const existingFilesPaths = existingFiles.map((file) => file.path)

  // get files that have been renamed
  // to be renamed, the file must have the same birthTime, fileSize, mimeType,
  // and lastModified, but a different path
  const renamedFiles: File[] = await Promise.all(
    files
      .filter((file) => !existingFilesPaths.includes(file))
      .map(async (file) => {
        const { birthtime, size, mtime } = await fs.stat(file)
        const mimeType = mime.lookup(file).toString()

        const renamedFile = await File.findOne({
          where: {
            birthTime: birthtime,
            fileSize: size,
            lastModified: mtime,
            mimeType
          }
        })

        // if the file was renamed, update the database
        if (renamedFile !== null) {
          await File.update(
            {
              name: file.split('/').pop(),
              path: file,
              updatedAt: currentTime
            },
            {
              where: {
                id: renamedFile.id
              }
            }
          )

          return await File.findOne({
            where: {
              id: renamedFile.id
            }
          })
        }

        return null
      })
  ).then((files) => files.filter((file) => file !== null)) as File[]

  const renamedFilesPaths = renamedFiles.map((file) => file.path)

  // add new files to the database
  await addFilesToDatabase({
    files: files.filter(
      (file) =>
        !existingFilesPaths.includes(file) &&
        !renamedFilesPaths.includes(file)
    ),
    directoryId: directory.id
  })

  // get all files that are in the database but not in the directory
  const deletedFiles = await File.findAll({
    where: {
      directoryId: directory.id,
      path: {
        [Op.notIn]: files
      }
    }
  }).then((files) => files.map((file) => file.toJSON()))

  // delete them
  await File.destroy({
    where: {
      id: deletedFiles.map((file) => file.id)
    }
  })

  // remove file tag associations for deleted files
  await FileTag.destroy({
    where: {
      fileId: deletedFiles.map((file) => file.id)
    }
  })

  return {
    directoryId: directory.id,
    numExistingFiles: existingFiles.length,
    numRenamedFiles: renamedFiles.length,
    numDeletedFiles: deletedFiles.length,
    numNewFiles: files.length - existingFiles.length - renamedFiles.length
  }
}

/**
 * Adds a directory to the database
 * @param {BrowserWindow} win - the window to show the dialog in
 * @param {IpcMainEvent} event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when the directory has been added
 */
export const handleAddDirectory = async (win: BrowserWindow, event: IpcMainEvent): Promise<void> => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })

  if (result.filePaths.length === 0) return

  // ensure that directory is not already in database
  const existingDirectory = await Directory.findOne({
    where: {
      path: result.filePaths[0]
    }
  })

  if (existingDirectory !== null) {
    event.reply('add-directory-error', 'The directory is already in the database.')
    return
  }

  // add directory to database
  // @ts-expect-error - result.filePaths is an array of strings
  const directory = await Directory.create({
    name: path.basename(result.filePaths[0]),
    path: result.filePaths[0]
  })

  event.reply('added-directory', result.filePaths)

  // look at files in directory; make sure to crawl subdirectories
  const files = await getFileList(result.filePaths[0])

  await addFilesToDatabase({ files, directoryId: directory.id })

  event.reply('initialized-directory')
}

/**
 * Allows the user to select a single directory
 * @param {BrowserWindow} win - the window to show the dialog in
 * @param {IpcMainEvent} event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when the directory has been selected
 */
export const handleSelectDirectory = async (win: BrowserWindow, event: IpcMainEvent): Promise<void> => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })

  if (result.filePaths.length === 0) return

  event.reply('selected-directory', result.filePaths)
}

/**
 * Lists all directories in the database
 * @param event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when all directories have been listed
 */
export const handleListDirectories = async (event: IpcMainEvent): Promise<void> => {
  // get all directories, sort by name
  const directories: Directory[] = await Directory.findAll({
    order: [
      ['name', 'ASC']
    ]
  }).then(
    (dictionaries) => dictionaries.map((dictionary) => dictionary.toJSON())
  )

  event.reply('listed-directories', directories)
}

/**
 * Given a directory, returns the number of files in it
 * @param event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when the number of files in each directory has been calculated
 */
export const handleDirectoriesFileCount = async (event: IpcMainEvent): Promise<void> => {
  // get number of files for each directory
  const directories = await Directory.findAll({
    attributes: [
      'id',
      [Sequelize.fn('COUNT', Sequelize.col('files.id')), 'fileCount']
    ],
    include: [
      {
        model: File,
        attributes: []
      }
    ],
    group: ['directory.id']
  }).then(
    (directories) =>
      directories.reduce((acc: Record<number, number>, directory) => {
        // @ts-expect-error - directory is an object
        const { id, fileCount } = directory.toJSON()
        acc[id] = fileCount
        return acc
      }, {})
  )

  event.reply('listed-directories-file-count', directories)
}

/**
 * Opens a directory in the file explorer
 * @param {string} arg.path - the path of the directory to open
 * @returns {Promise<void>} - a promise that resolves when the directory has been opened
 */
export const handleOpenDirectory = async (event: IpcMainEvent, arg: { path: string }): Promise<void> => {
  const { path } = arg

  // make sure the directory exists before opening it
  await fs.stat(path).then(async () => {
    await shell.openPath(path)
  }).catch(() => {
    event.reply('open-directory-error', 'Directory cannot be found. It may have moved, been deleted, or is on an external drive that is not connected.')
  })
}

/**
 * Deletes a directory and all files associated with it
 * @param event - the event to reply to
 * @param arg.directoryId - the directory to delete
 * @returns {Promise<void>} - a promise that resolves when the directory has been deleted
 */
export const handleDeleteDirectory = async (event: IpcMainEvent, arg: { directoryId: number }): Promise<void> => {
  const { directoryId } = arg

  await Directory.destroy({
    where: {
      id: directoryId
    }
  })

  // remove all files associated with directory
  await File.destroy({
    where: {
      directoryId
    }
  })

  await handleKillOrphanedTags(event)

  event.reply('deleted-directory', arg)
}

/**
 * Refreshes the files in every directory
 * @param event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when all directories have been refreshed
 */
export const handleRefreshDirectories = async (event: IpcMainEvent, arg: { directoryIds: number[] }): Promise<void> => {
  // get all directories to refresh
  const directories = await Directory.findAll({
    where: {
      id: {
        [Op.in]: arg.directoryIds
      }
    }
  }).then((directories) => directories.map((directory) => directory.toJSON()))

  if (directories.length === 0) {
    event.reply('refreshed-directories')
    return
  }

  for (const directory of directories) {
    try {
      const refreshedDirectory = await refreshDirectory(directory.id)
      event.reply('refreshed-directory', refreshedDirectory)
    } catch (err) {
      event.reply('refresh-directory-error', {
        errMessage: (err as Error).message,
        directoryId: directory.id
      })
    }
  }

  // remove tags that no longer have any associations
  await handleKillOrphanedTags(event)

  event.reply('refreshed-directories')
}

/**
 * Given a current directory, sets a new directory location
 * @param event
 * @param arg.directoryId - the directory to change
 * @param arg.newPath - the new path to set
 * @returns
 */
export const handleSetDirectoryLocation = async (win: BrowserWindow, event: IpcMainEvent, arg: { directoryId: number }): Promise<void> => {
  const { directoryId } = arg

  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })

  if (result.filePaths.length === 0) return

  const newPath = result.filePaths[0]

  // ensure that directory is not already in database
  const existingDirectory = await Directory.findOne({
    where: {
      path: newPath
    }
  })

  if (existingDirectory !== null) {
    event.reply('set-directory-location-error', 'The directory is already in the database.')
    return
  }

  const t = await sequelize.transaction()

  try {
    // find the directory that we want to change
    const directory = await Directory.findOne({
      where: {
        id: directoryId
      },
      transaction: t
    })

    if (directory === null) {
      throw new Error('Directory does not exist.')
    }

    // get all files in the directory
    const files = await File.findAll({
      where: {
        directoryId
      },
      transaction: t
    })

    // for each file, update the path
    await Promise.all(
      files.map(async (file) => {
        await File.update(
          {
            path: file.path.replace(directory.path, newPath)
          },
          {
            where: {
              id: file.id
            },
            transaction: t
          }
        )
      })
    )

    // update the directory path
    await Directory.update(
      {
        path: newPath,
        name: path.basename(newPath)
      },
      {
        where: {
          id: directoryId
        },
        transaction: t
      }
    )

    await t.commit()
  } catch (err) {
    await t.rollback()
    event.reply('set-directory-location-error', (err as Error).message)
    return
  }

  await refreshDirectory(directoryId)

  event.reply('set-directory-location-success', newPath)
}

export const handleListDirectoriesAccess = async (event: IpcMainEvent, arg: { directoryIds: string[] }): Promise<void> => {
  // get all directories to check access
  const directories = await Directory.findAll({
    where: {
      id: {
        [Op.in]: arg.directoryIds
      }
    }
  })

  const directoriesAccess: Record<number, boolean> = {}

  // check access for each directory using fs
  await Promise.all(
    directories.map(async (directory) => {
      try {
        await fs.access(directory.path)
        directoriesAccess[directory.id] = true
      } catch {
        directoriesAccess[directory.id] = false
      }
    })
  )

  event.reply('listed-directories-access', directoriesAccess)
}

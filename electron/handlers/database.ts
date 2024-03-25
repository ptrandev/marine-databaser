import { type IpcMainEvent, dialog } from 'electron'
import { DATABASE_PATH } from '../constants'
import fs from 'fs/promises'
import sequelize from '../database/initialize'

/**
 * Exports the entire SQL database to a sqlite file and allow the user to save it
 */
export const handleDatabaseExport = async (event: IpcMainEvent): Promise<void> => {
  const result = await dialog.showSaveDialog({
    title: 'Export Database',
    defaultPath: 'database.sqlite'
  })

  if (result.canceled) {
    event.reply('database-export-canceled')
    return
  }

  if (!result.filePath) {
    event.reply('database-export-error', 'No file path provided')
    return
  }

  // our database is stored in a sqlite file, so we can just copy it
  await fs.copyFile(DATABASE_PATH, result.filePath).then(() => {
    event.reply('database-export-success')
  }).catch((err: Error) => {
    event.reply('database-export-error', err.message)
  })
}

export const handleDatabaseImport = async (event: IpcMainEvent): Promise<void> => {
  const result = await dialog.showOpenDialog({
    title: 'Import Database',
    defaultPath: 'database.sqlite',
    properties: ['openFile'],
    filters: [{ name: 'SQLite', extensions: ['sqlite'] }]
  })

  if (result.canceled) {
    event.reply('database-import-canceled')
    return
  }

  // our database is stored in a sqlite file, so we can just copy it
  await fs.copyFile(result.filePaths[0], DATABASE_PATH).then(() => {
    event.reply('database-import-success')
  }).catch((err: Error) => {
    console.error(err)
    event.reply('database-import-error')
  })
}

export const handleDatabaseReset = async (event: IpcMainEvent): Promise<void> => {
  await sequelize.sync({ force: true }).then(() => {
    event.reply('database-reset-success')
  }
  ).catch((err: Error) => {
    console.error(err)
    event.reply('database-reset-error')
  })
}

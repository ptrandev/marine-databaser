import { type IpcMainEvent, dialog } from 'electron'
import { DATABASE_PATH } from '../constants'
import fs from 'fs/promises'

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
  await fs.copyFile(DATABASE_PATH, result.filePath).catch((err: Error) => {
    event.reply('database-export-error', err.message)
  })

  event.reply('database-export-success')
}

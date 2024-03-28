import { type IpcMainEvent, shell } from 'electron'
import fs from 'fs/promises'
import path from 'path'

export const handleOpenFile = async (event: IpcMainEvent, arg: string): Promise<void> => {
  const res = await shell.openPath(arg)

  if (res !== '') {
    event.reply('open-file-error', res)
  }
}

export const handleOpenFileFolder = async (event: IpcMainEvent, arg: string): Promise<void> => {
  // argument is a file path; we need to get the folder path; do so using path.dirname
  const folder = path.dirname(arg)

  // check if the folder exists using fs; if so, shell.showItemInFolder
  try {
    await fs.access(folder)
    shell.showItemInFolder(arg)
  } catch (err) {
    event.reply('open-file-folder-error', (err as Error).message)
  }
}

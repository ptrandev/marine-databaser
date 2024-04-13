import { dialog, type IpcMainEvent } from 'electron'
import fs from 'fs/promises'
import path from 'path'

/**
 * Saves a JSON file to the user's computer. Prompt the user where to save the file.
 * @param event The event that triggered this function.
 * @param arg.data The data to save.
 * @param {string} [arg.filename] The filename to save the data as.
 * @returns
 */
export const handleSaveToJSON = async (event: IpcMainEvent, arg: {
  data: any
  filename?: string
}): Promise<void> => {
  if (!arg.data) {
    event.reply('save-to-json-error')
    return
  }

  const result = await dialog.showSaveDialog({
    title: 'Save to JSON',
    defaultPath: arg?.filename ?? 'data.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (result.canceled) {
    event.reply('save-to-json-canceled')
    return
  }

  if (!result.filePath) {
    event.reply('save-to-json-error')
    return
  }

  try {
    await fs.writeFile(result.filePath, JSON.stringify(arg.data))
    event.reply('save-to-json-success')
  } catch (err) {
    console.error(err)
    event.reply('save-to-json-error')
  }
}

/**
 * Turns a JSON file into a JS object.
 * @param event The event that triggered this function.
 * @returns
 */
export const handleLoadFromJSON = async (event: IpcMainEvent): Promise<void> => {
  const result = await dialog.showOpenDialog({
    title: 'Load from JSON',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (result.canceled) {
    event.reply('load-from-json-canceled')
    return
  }

  try {
    const data = JSON.parse((await fs.readFile(result.filePaths[0])).toString())

    if (!data?.selectedVideo || !data?.spliceRegions || typeof data?.selectedVideo !== 'string' || !Array.isArray(data?.spliceRegions)) {
      throw new Error('Invalid JSON data.')
    }

    // throw error if spliceRegions does not match SpliceRegion[] type
    if (data.spliceRegions.some((region: any) => {
      return typeof region?.start !== 'number' || typeof region?.end !== 'number' || typeof region?.name !== 'string'
    })) {
      throw new Error('Invalid JSON data.')
    }

    // check if selectedVideo exists using fs
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await fs.access(path.resolve(data.selectedVideo))
    } catch {
      throw new Error('Selected video cannot be found.')
    }

    event.reply('load-from-json-success', data)
  } catch (err) {
    console.error(err)
    event.reply('load-from-json-error', (err as Error).message)
  }
}

import { FileParent, File } from '../database/schemas'
import { type IpcMainEvent } from 'electron'
import { fn, col } from 'sequelize'

/**
 * Creates a relationship between an input fileParentId and an array of fileChildrenIds
 * @param fileParentId - The id of the parent file
 * @param fileChildrenIds - The ids of the children files
 * @returns The created fileParents
 */
export const addFileParent = async ({ fileParentId, fileChildrenIds }: {
  fileParentId: number
  fileChildrenIds: number[]
}): Promise<FileParent[]> => {
  return await FileParent.bulkCreate(
    fileChildrenIds.map((fileChildId) => {
      return { fileParentId, fileChildId }
    })
  )
}

/**
 * Gets a list of files represented by all fileParentIds
 */
export const handleListFileParents = async (event: IpcMainEvent): Promise<void> => {
  // get all fileParents, join File and get count of fileChildren
  const fileParentFiles = await FileParent.findAll({
    include: [
      {
        model: File
      }
    ],
    attributes: ['fileParentId', [fn('COUNT', col('fileChildId')), 'fileChildrenCount']],
    group: ['fileParentId'],
    raw: true
  }).then((fileParents) => {
    return fileParents.map((fileParent) => {
      // for each key prefixed with Files., remove the prefix
      const fileParentFile = Object.keys(fileParent).reduce((acc, key) => {
        if (key.startsWith('Files.')) {
          // @ts-expect-error - we are removing the prefix
          acc[key.slice(6)] = fileParent[key]
        } else {
          // @ts-expect-error - we are removing the prefix
          acc[key] = fileParent[key]
        }
        return acc
      }, {})

      return fileParentFile
    })
  })

  event.reply('listed-file-parents', fileParentFiles)
}

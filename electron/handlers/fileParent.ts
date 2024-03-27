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
  // get all unique fileParentId values from the fileParents table
  const fileParents: FileParent[] = await FileParent.findAll({
    attributes: ['fileParentId', [fn('COUNT', col('fileChildId')), 'fileChildrenCount']],
    group: ['fileParentId']
  })

  // associate these with the File table
  const files: File[] = await File.findAll({
    where: {
      id: fileParents.map((fileParent) => fileParent.fileParentId)
    }
  }).then((files) => files.map((file) => file.toJSON()))

  event.reply('listed-file-parents', files)
}

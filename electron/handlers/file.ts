import { type BrowserWindow, type IpcMainEvent, dialog } from 'electron'
import { Tag, File, FileNote, FileParent, FileTag } from '../database/schemas'
import { type FindOptions, Op, Sequelize } from 'sequelize'
import { type FileTypes } from '../../shared/types'
import fs from 'fs/promises'
import path from 'path'

export const handleSelectFile = async (win: BrowserWindow, event: IpcMainEvent): Promise<void> => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile']
  })

  const file: File = await File.create(
    // @ts-expect-error - result.filePaths is an array of strings
    // TODO - this is a hacky way to get the file name and path
    {
      name: path.basename(result.filePaths[0]),
      path: result.filePaths[0]
    },
    { raw: true }
  )

  event.reply('selected-file', file)
}

export const handleListFiles = async (event: IpcMainEvent, arg: {
  directories?: number[]
  tags?: number[]
  fileTypes?: FileTypes[]
  searchTerm?: string
  fileParents?: number[]
}): Promise<void> => {
  const { directories, tags, fileTypes, searchTerm, fileParents } = arg

  const options: FindOptions = {
    where: {},
    include: []
  }

  if (directories && directories.length > 0) {
    // @ts-expect-error - we are using the sequelize operator
    options.where.directoryId = directories
  }

  if (fileTypes && fileTypes.length > 0) {
    // @ts-expect-error - we are using the sequelize operator
    options.where.mimeType = {
      [Op.or]: matchMimeTypes(fileTypes).map((mimeType) => { return { [Op.like]: mimeType } })
    }
  }

  if (fileParents && fileParents.length > 0) {
    const parents = await FileParent.findAll({
      where: {
        fileParentId: fileParents
      }
    }).then((fileParents) => {
      return fileParents.map((fileParent) => fileParent.toJSON())
    })

    const fileChildrenIds = parents.map((fileParent) => fileParent.fileChildId)
    const fileParentIds = parents.map((fileParent) => fileParent.fileParentId)

    // the files MUST have a parent that matches the fileParentId
    options.where = {
      ...options.where,
      id: [...fileChildrenIds, ...fileParentIds]
    }

    options.include = [
      {
        model: FileParent
      }
    ]
  }

  if (searchTerm && searchTerm?.length > 0) {
    const fileNotes = await FileNote.findAll({
      where: {
        note: {
          [Op.like]: `%${searchTerm.toLowerCase()}%`
        }
      }
    }).then((fileNotes) => {
      return fileNotes.map((fileNote) => fileNote.toJSON())
    })

    const fileNotesIds = fileNotes.map((fileNote) => fileNote.fileId)

    // the files MUST have a note or path that matches the search term
    options.where = {
      ...options.where,
      [Op.or]: [
        {
          id: fileNotesIds
        },
        {
          name: {
            [Op.like]: `%${searchTerm.toLowerCase()}%`
          }
        }
      ]
    }

    options.include = [
      {
        model: FileNote
      }
    ]
  }

  if (tags && tags.length > 0) {
    options.include = [
      {
        model: Tag,
        where: {
          id: tags
        }
      }
    ]
  }

  options.limit = 10000

  const fileIds: number[] = await File.findAll(options).then((files) => files.map((file) => file.toJSON().id))

  const files: File[] = await File.findAll({
    where: {
      id: fileIds
    },
    include: [
      {
        model: Tag
      },
      {
        model: FileNote
      },
      {
        model: FileParent
      }
    ],
    order: [
      [
        {
          model: Tag,
          as: 'Tags'
        },
        'name',
        'ASC'
      ]
    ]
  }).then((files) => files.map((file) => file.toJSON()))

  event.reply('listed-files', files)
}

/**
 * Returns a flattened array of mime types based on the file types. This is used
 * to filter the files based on the file types.
 * @param FileTypes[] The file types to match
 * @returns string[] The mime types to match
 */
const matchMimeTypes = (FileTypes: FileTypes[]): string[] => {
  return FileTypes.map((fileType) => {
    switch (fileType) {
      case 'image':
        return 'image/%'
      case 'video':
        return 'video/%'
      case 'audio':
        return 'audio/%'
      case 'document':
        return [
          'application/pdf',
          'application/msword',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'text/%'
        ]
      case 'archive':
        return [
          'application/zip',
          'application/x-rar-compressed',
          'application/x-7z-compressed',
          'application/x-tar',
          'application/x-bzip',
          'application/x-bzip2',
          'application/x-gzip',
          'application/x-xz',
          'application/x-lzip',
          'application/x-lzma',
          'application/x-lzop',
          'application/x-snappy-framed',
          'application/xz',
          'application/x-gtar'
        ]
      case 'executable':
        return [
          'application/x-msdownload',
          'application/x-dosexec',
          'application/x-executable',
          'application/x-sharedlib',
          'application/x-shellscript',
          'application/x-pie-executable',
          'application/x-object',
          'application/x-archive',
          'application/x-mach-binary'
        ]
      default:
        return 'false'
    }
  }).flat()
}

/**
 * Given a path, find the File that matches the path and return the File
 */
export const findFileByPath = async (path: string): Promise<File | null> => {
  return await File.findOne({
    where: {
      path
    }
  }).then((file) => file?.toJSON()) as File | null
}

export const handleFileRename = async (event: IpcMainEvent, arg: {
  file: File
  name: string
}): Promise<void> => {
  const { file, name } = arg

  const _path: string = path.join(path.dirname(file.path), name)

  // first change filename on disk
  await fs.rename(file.path, _path)

  // then update database ... remember to update name and path
  await File.update(
    {
      name,
      path: _path
    },
    {
      where: {
        id: file.id
      }
    }
  )

  event.reply('renamed-file', file)
}

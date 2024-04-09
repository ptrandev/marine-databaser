import { type BrowserWindow, type IpcMainEvent, dialog } from 'electron'
import { Tag, File, FileNote, FileParent } from '../database/schemas'
import { type FindOptions, Op } from 'sequelize'
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
  }

  if (directories && directories.length > 0) {
    // @ts-expect-error - we are using the sequelize operator
    options.where.directoryId = directories
  }

  if (tags && tags.length > 0) {
    options.include = [
      {
        model: Tag,
        where: {
          id: tags
        }
      },
      {
        model: FileNote
      }
    ]
  }

  if (fileTypes && fileTypes.length > 0) {
    // @ts-expect-error - we are using the sequelize operator
    options.where.mimeType = {
      [Op.or]: matchMimeTypes(fileTypes).map((mimeType) => { return { [Op.like]: mimeType } })
    }
  }

  if (searchTerm && searchTerm?.length > 0) {
    const fileNotes = await FileNote.findAll({
      where: {
        note: {
          [Op.like]: `%${searchTerm.toLowerCase()}%`
        }
      }
    })

    const fileIds = fileNotes.map((fileNote) => fileNote.fileId)

    // make an or statement for the file ids and path
    options.where = {
      ...options.where,
      [Op.or]: [
        {
          id: fileIds
        },
        {
          path: {
            [Op.like]: `%${searchTerm.toLowerCase()}%`
          }
        }
      ]
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

    const fileIds = parents.map((fileParent) => fileParent.fileChildId)

    options.where = {
      ...options.where,
      [Op.or]: [
        {
          id: fileIds
        }
      ]
    }
  }

  options.limit = 10000

  // get all files, sort Tags by name
  const files: File[] = await File.findAll(options).then((files) => {
    return files.map((file) => file.toJSON())
  })

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

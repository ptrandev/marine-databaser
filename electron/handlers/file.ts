import { BrowserWindow, IpcMainEvent, dialog } from "electron";
import { Tag, File, FileNote } from "../database/schemas";
import { FindOptions, Op } from "sequelize";
import { FileTypes } from "../../shared/types"
import fs from "fs";

export const handleSelectFile = async (win: BrowserWindow, event: IpcMainEvent) => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
  });

  const file: File = await File.create(
    {
      name: result.filePaths[0].split("/").pop(),
      path: result.filePaths[0],
    },
    { raw: true }
  );

  event.reply("selected-file", file);
};

export const handleListFiles = async (event: IpcMainEvent, arg: {
  directories?: number[],
  tags?: number[],
  fileTypes?: FileTypes[],
  searchTerm?: string
}) => {
  const { directories, tags, fileTypes, searchTerm } = arg;

  const options: FindOptions = {
    where: {},
    include: [
      {
        model: Tag,
      },
      {
        model: FileNote,
      }
    ],
  };

  if (directories?.length > 0) {
    options.where["directory_id"] = directories;
  }

  if (tags?.length > 0) {
    options.include = [
      {
        model: Tag,
        where: {
          id: tags,
        },
      },
      {
        model: FileNote,
      }
    ];
  }

  if (fileTypes?.length > 0) {
    options.where['mimeType'] = {
      [Op.or]: matchMimeTypes(fileTypes).map((mimeType) => { return { [Op.like]: mimeType } })
    }
  }

  if (searchTerm?.length > 0) {
    const fileNotes = await FileNote.findAll({
      where: {
        note: {
          [Op.like]: `%${searchTerm.toLowerCase()}%`,
        },
      },
    });

    const fileIds = fileNotes.map((fileNote) => fileNote.file_id);

    // make an or statement for the file ids and path
    options.where = {
      ...options.where,
      [Op.or]: [
        {
          id: fileIds,
        },
        {
          path: {
            [Op.like]: `%${searchTerm.toLowerCase()}%`,
          },
        },
      ],
    };
  }

  options.limit = 10000;

  const files: File[] = await File.findAll(options).then((files) =>
    files.map((file) => file.toJSON())
  );

  event.reply("listed-files", files);
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
        return 'image/%';
      case 'video':
        return 'video/%';
      case 'audio':
        return 'audio/%';
      case 'document':
        return [
          'application/pdf',
          'application/msword',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'text/%'
        ];
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
          'application/x-gtar',
        ];
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
          'application/x-mach-binary',
        ];
      default:
        return 'false';
    }
  }).flat();
}

export const handleFileRename = async (event: IpcMainEvent, arg: {
  file: File;
  name: string;
}) => {
  const { file, name } = arg;

  const path = file.path.replace(file.name, name)

  // first change filename on disk
  fs.renameSync(file.path, path);

  // then update database ... remember to update name and path
  await File.update(
    {
      name,
      path,
    },
    {
      where: {
        id: file.id,
      },
    }
  );

  event.reply("renamed-file", file);
}
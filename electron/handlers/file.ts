import { BrowserWindow, IpcMainEvent, dialog } from "electron";
import { Tag, File } from "../database/schemas";
import { FindOptions, Op } from "sequelize";
import { FileTypes } from "../../shared/types"

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
  directories: number[],
  tags: number[],
  fileTypes: FileTypes[],
}) => {
  const { directories, tags, fileTypes } = arg;

  const options: FindOptions = {
    where: {},
    include: {
      model: Tag,
    },
  };

  if (directories.length > 0) {
    options.where["directory_id"] = directories;
  }

  if (tags.length > 0) {
    options.include = [
      {
        model: Tag,
        where: {
          id: tags,
        },
      },
    ];
  }

  if (fileTypes.length > 0) {
    options.where['mime_type'] = {
      [Op.or]: matchMimeTypes(fileTypes).map((mimeType) => { return { [Op.like]: mimeType } })
    }
  }

  options.limit = 50000;

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
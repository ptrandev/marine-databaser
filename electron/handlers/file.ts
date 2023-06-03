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
      [Op.or]: fileTypes.map((fileType) => {
        switch (fileType) {
          case 'image':
            return { [Op.like]: 'image/%' };
          case 'video':
            return { [Op.like]: 'video/%' };
          case 'audio':
            return { [Op.like]: 'audio/%' };
          default:
            return 'false';
        }
      })
    }
  }

  const files: File[] = await File.findAll(options).then((files) =>
    files.map((file) => file.toJSON())
  );

  event.reply("listed-files", files);
}
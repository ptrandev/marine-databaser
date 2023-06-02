import { BrowserWindow, IpcMainEvent, dialog } from "electron";
import { Tag, File } from "../database/schemas";
import { FindOptions } from "sequelize";
import mime from "mime-types";

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
}) => {
  const {
    directories,
    tags,
  }: {
    directories: number[];
    tags: number[];
  } = arg;

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

  const files: File[] = await File.findAll(options).then((files) =>
    files.map((file) => file.toJSON())
  );

  event.reply("listed-files", files);
}
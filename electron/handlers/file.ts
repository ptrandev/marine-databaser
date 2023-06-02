import { BrowserWindow, IpcMainEvent, dialog } from "electron";
import { Tag, File } from "../database/schemas";
import { FindOptions } from "sequelize";
import mime from "mime-types";
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

  const files: File[] = await File.findAll(options).then((files) =>
    files
      .filter((file) => {
        if (fileTypes.length === 0) return true;

        // matches file type
        // video -> mimeType.startsWith("video")
        // audio -> mimeType.startsWith("audio")
        // image -> mimeType.startsWith("image")
        // document -> mimeType.startsWith("text")

        console.log(file.mimeType.startsWith("image"))

        for (const fileType of fileTypes) {
          if (fileType === "video" && file.mimeType.startsWith("video")) return true;
          if (fileType === "audio" && file.mimeType.startsWith("audio")) return true;
          if (fileType === "image" && file.mimeType.startsWith("image")) return true;
          if (fileType === "document" && file.mimeType.startsWith("text")) return true;
        }

        return false;
      })
      .map((file) => file.toJSON())
  );

  event.reply("listed-files", files);
}
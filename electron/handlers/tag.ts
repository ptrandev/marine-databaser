import { BrowserWindow, IpcMainEvent, dialog, shell } from "electron";
import { FileTag, File, Tag } from "../database/schemas";
const fs = require("fs").promises;

const createTag = async (name) => {
  const existingTag: Tag | null = await Tag.findOne({
    where: {
      name,
    },
  });

  // tag already exists, so just return it
  if (existingTag) return existingTag;

  const tag: Tag = await Tag.create({
    name,
  });

  return tag;
};

export const handleTagFile = async (event: IpcMainEvent, arg: {
  file: File;
  tag: string;
}) => {
  const { file, tag } = arg;

  const _tag: Tag = await createTag(tag);

  // check if file already has tag
  const _file: File | null = await File.findOne({
    where: {
      id: file.id,
    },
    include: [
      {
        model: Tag,
        where: {
          name: tag,
        },
      },
    ],
  });

  if (_file) return;

  // else add tag to file
  const fileTag: FileTag = await FileTag.create({
    file_id: file.id,
    tag_id: _tag.id,
  });

  event.reply("tagged-file", fileTag);
}

export const handleListTags = async (event: IpcMainEvent) => {
  const tags: Tag[] = await Tag.findAll().then((tags) =>
    tags.map((tag) => tag.toJSON())
  );
  event.reply("listed-tags", tags);
}

export const handleUntagFile = async (event: IpcMainEvent, arg: {
  file_id: number;
  tag_id: number;
}) => {
  const { file_id, tag_id } = arg;

  
  await FileTag.destroy({
    where: {
      // @ts-ignore
      file_id,
      tag_id,
    },
  });

  event.reply("untagged-file", arg);
}
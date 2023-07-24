import { IpcMainEvent } from "electron";
import { FileTag, File, Tag } from "../database/schemas";

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
  file_id: number;
  tag: string;
}) => {
  const { file_id, tag } = arg;

  const _tag: Tag = await createTag(tag);

  // check if file already has tag
  const hasTag: FileTag | null = await FileTag.findOne({
    where: {
      // @ts-ignore
      file_id,
      tag_id: _tag.id,
    },
  });

  if (hasTag) {
    event.reply("tagged-file");
    return;
  }

  // else add tag to file
  const fileTag: FileTag = await FileTag.create({
    file_id: file_id,
    tag_id: _tag.id,
  }).then((fileTag) => fileTag.toJSON());

  event.reply("tagged-file", fileTag);
}

export const handleTagFiles = async (event: IpcMainEvent, arg: {
  file_ids: number[];
  tag: string;
}) => {
  const { file_ids, tag } = arg;

  const _tag: Tag = await createTag(tag);

  // only add tag to files that don't already have it
  const fileTags: FileTag[] = await Promise.all(
    file_ids.map(async (file_id) => {
      const hasTag: FileTag | null = await FileTag.findOne({
        where: {
          // @ts-ignore
          file_id,
          tag_id: _tag.id,
        },
      });

      if (hasTag) return;

      const fileTag: FileTag = await FileTag.create({
        file_id,
        tag_id: _tag.id,
      }).then((fileTag) => fileTag.toJSON());

      return fileTag;
    })
  );

  event.reply("tagged-files", fileTags);
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

export const handleUntagFiles = async (event: IpcMainEvent, arg: {
  file_ids: number[];
  tag_id: number;
}) => {
  const { file_ids, tag_id } = arg;

  await Promise.all(
    file_ids.map(async (file_id) => {
      await FileTag.destroy({
        where: {
          // @ts-ignore
          file_id,
          tag_id,
        },
      });
    }
  ));

  event.reply("untagged-files", arg);
}
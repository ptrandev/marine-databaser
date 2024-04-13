import { type IpcMainEvent } from 'electron'
import { FileTag, Tag } from '../database/schemas'

/**
 * Creates a tag if it doesn't already exist
 * Returns the tag
 * @param name Name of the tag
 * @returns Tag object
 */
const createTag = async (name: string): Promise<Tag> => {
  const existingTag: Tag | null = await Tag.findOne({
    where: {
      name
    }
  }).then((tag) => tag?.toJSON()) as Tag | null

  // tag already exists, so just return it
  if (existingTag) return existingTag

  // @ts-expect-error - we are creating a new tag
  await Tag.create({ name })

  const tag: Tag = await Tag.findOne({
    where: {
      name
    }
  }).then((tag) => tag?.toJSON()) as Tag

  return tag
}

/**
 * Tags a file with a tag
 * If the tag doesn't exist, it will be created
 * If the file already has the tag, nothing will happen
 * If the file doesn't have the tag, it will be added
 */
export const handleTagFile = async (event: IpcMainEvent, arg: {
  fileId: number
  tag: string
}): Promise<void> => {
  const { fileId, tag } = arg

  const _tag: Tag = await createTag(tag)

  // check if file already has tag
  const hasTag: FileTag | null = await FileTag.findOne({
    where: {
      fileId,
      tagId: _tag.id
    }
  }).then((fileTag) => fileTag?.toJSON()) as FileTag | null

  if (hasTag) {
    event.reply('tagged-file')
    return
  }

  // else add tag to file
  const fileTag: FileTag = await FileTag.create({
    fileId,
    tagId: _tag.id
  }).then((fileTag) => fileTag.toJSON()) as FileTag

  event.reply('tagged-file', fileTag)
}

/**
 * Tags multiple files with a tag
 */
export const handleTagFiles = async (event: IpcMainEvent, arg: {
  fileIds: number[]
  tag: string
}): Promise<void> => {
  const { fileIds, tag } = arg

  const _tag: Tag = await createTag(tag)

  // only add tag to files that don't already have it
  const fileTags: FileTag[] = (await Promise.all(
    fileIds.map(async (fileId) => {
      const hasTag: FileTag | null = await FileTag.findOne({
        where: {
          fileId,
          tagId: _tag.id
        }
      }).then((fileTag) => fileTag?.toJSON()) as FileTag | null

      if (hasTag) return null

      const fileTag: FileTag = await FileTag.create({
        fileId,
        tagId: _tag.id
      }).then((fileTag) => fileTag.toJSON()) as FileTag

      return fileTag
    })
  )).filter((fileTag) => fileTag !== null) as FileTag[]

  event.reply('tagged-files', fileTags)
}

/**
 * Lists all tags
 */
export const handleListTags = async (event: IpcMainEvent): Promise<void> => {
  // get all tags, sorted in alphabetical order
  const tags: Tag[] = await Tag.findAll({
    order: [['name', 'ASC']]
  }).then((tags) => tags.map((tag) => tag.toJSON()))

  event.reply('listed-tags', tags)
}

/**
 * Untags a file from a tag
 */
export const handleUntagFile = async (event: IpcMainEvent, arg: {
  fileId: number
  tagId: number
}): Promise<void> => {
  const { fileId, tagId } = arg

  await FileTag.destroy({
    where: {
      fileId,
      tagId
    }
  })

  await handleKillOrphanedTags(event)

  event.reply('untagged-file', arg)
}

/**
 * Untags multiple files from a tag
 */
export const handleUntagFiles = async (event: IpcMainEvent, arg: {
  fileIds: number[]
  tagId: number
}): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { fileIds, tagId } = arg

  await Promise.all(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    fileIds.map(async (fileId) => {
      await FileTag.destroy({
        where: {
          fileId,
          tagId
        }
      })
    })
  )

  await handleKillOrphanedTags(event)

  event.reply('untagged-files', arg)
}

/**
 * Checks to see if any tag is orphaned (i.e. no files are tagged with it)
 * If so, delete the tag
 */
export const handleKillOrphanedTags = async (event: IpcMainEvent): Promise<void> => {
  const tags: Tag[] = await Tag.findAll().then((tags) => tags.map((tag) => tag.toJSON())) as Tag[]

  const fileTags: FileTag[] = await FileTag.findAll().then((fileTags) => fileTags.map((fileTag) => fileTag.toJSON())) as FileTag[]

  // get orphaned tags
  const orphanedTags: Tag[] = tags.filter((tag) => {
    const hasTag: boolean = fileTags.some((fileTag) => fileTag.tagId === tag.id)
    return !hasTag
  })

  // use a transaction to ensure that all tags are deleted
  // if one fails to delete, then the entire transaction is rolled back
  if (Tag.sequelize) {
    await Tag.sequelize.transaction(async (t) => {
      await Promise.all(
        orphanedTags.map(async (tag) => {
          await Tag.destroy({
            where: {
              id: tag.id
            },
            transaction: t
          })
        })
      )
    })
  }

  event.reply('killed-orphaned-tags')
}

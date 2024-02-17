import { type IpcMainEvent } from 'electron'
import { FileTag, Tag } from '../database/schemas'

/**
 * Creates a tag if it doesn't already exist
 * Returns the tag
 * @param name Name of the tag
 * @returns Tag object
 */
const createTag = async (name: string) => {
  const existingTag: Tag | null = await Tag.findOne({
    where: {
      name
    }
  })

  // tag already exists, so just return it
  if (existingTag) return existingTag

  const tag: Tag = await Tag.create({
    name
  })

  return tag
}

/**
 * Tags a file with a tag
 * If the tag doesn't exist, it will be created
 * If the file already has the tag, nothing will happen
 * If the file doesn't have the tag, it will be added
 */
export const handleTagFile = async (event: IpcMainEvent, arg: {
  file_id: number
  tag: string
}) => {
  const { file_id, tag } = arg

  const _tag: Tag = await createTag(tag)

  // check if file already has tag
  const hasTag: FileTag | null = await FileTag.findOne({
    where: {
      // @ts-expect-error
      file_id,
      tag_id: _tag.id
    }
  })

  if (hasTag) {
    event.reply('tagged-file')
    return
  }

  // else add tag to file
  const fileTag: FileTag = await FileTag.create({
    file_id,
    tag_id: _tag.id
  }).then((fileTag) => fileTag.toJSON())

  event.reply('tagged-file', fileTag)
}

/**
 * Tags multiple files with a tag
 */
export const handleTagFiles = async (event: IpcMainEvent, arg: {
  file_ids: number[]
  tag: string
}) => {
  const { file_ids, tag } = arg

  const _tag: Tag = await createTag(tag)

  // only add tag to files that don't already have it
  const fileTags: FileTag[] = await Promise.all(
    file_ids.map(async (file_id) => {
      const hasTag: FileTag | null = await FileTag.findOne({
        where: {
          // @ts-expect-error
          file_id,
          tag_id: _tag.id
        }
      })

      if (hasTag) return

      const fileTag: FileTag = await FileTag.create({
        file_id,
        tag_id: _tag.id
      }).then((fileTag) => fileTag.toJSON())

      return fileTag
    })
  )

  event.reply('tagged-files', fileTags)
}

/**
 * Lists all tags
 */
export const handleListTags = async (event: IpcMainEvent) => {
  const tags: Tag[] = await Tag.findAll().then((tags) =>
    tags.map((tag) => tag.toJSON())
  )
  event.reply('listed-tags', tags)
}

/**
 * Untags a file from a tag
 */
export const handleUntagFile = async (event: IpcMainEvent, arg: {
  file_id: number
  tag_id: number
}) => {
  const { file_id, tag_id } = arg

  await FileTag.destroy({
    where: {
      // @ts-expect-error
      file_id,
      tag_id
    }
  })

  await handleKillOrphanedTags(event)

  event.reply('untagged-file', arg)
}

/**
 * Untags multiple files from a tag
 */
export const handleUntagFiles = async (event: IpcMainEvent, arg: {
  file_ids: number[]
  tag_id: number
}) => {
  const { file_ids, tag_id } = arg

  await Promise.all(
    file_ids.map(async (file_id) => {
      await FileTag.destroy({
        where: {
          // @ts-expect-error
          file_id,
          tag_id
        }
      })
    }
    ))

  await handleKillOrphanedTags(event)

  event.reply('untagged-files', arg)
}

/**
 * Checks to see if any tag is orphaned (i.e. no files are tagged with it)
 * If so, delete the tag
 */
export const handleKillOrphanedTags = async (event: IpcMainEvent) => {
  const tags: Tag[] = await Tag.findAll()

  const fileTags: FileTag[] = await FileTag.findAll()

  // get orphaned tags
  const orphanedTags: Tag[] = tags.filter((tag) => {
    // @ts-expect-error
    const hasTag: boolean = fileTags.some((fileTag) => fileTag.tag_id === tag.id)
    return !hasTag
  })

  // use a transaction to ensure that all tags are deleted
  // if one fails to delete, then the entire transaction is rolled back
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

  event.reply('killed-orphaned-tags')
}

import { type IpcMainEvent } from 'electron'
import { FileNote } from '../database/schemas'

export const handleListNotes = async (event: IpcMainEvent, arg: {
  fileId: number
}): Promise<void> => {
  const { fileId } = arg

  const fileNotes: FileNote[] = await FileNote.findAll({
    where: {
      fileId
    }
  }).then((fileNotes) => fileNotes.map((fileNote) => fileNote.toJSON()))

  event.reply('listed-notes', fileNotes)
}

export const handleAddNote = async (event: IpcMainEvent, arg: {
  fileId: number
  note: string
}): Promise<void> => {
  const { fileId, note } = arg

  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'fileNote' implicitly has an 'any' type.
  const fileNote: FileNote = await FileNote.create({
    fileId,
    note
  })

  event.reply('added-note', fileNote)
}

export const handleUpdateNote = async (event: IpcMainEvent, arg: {
  id: number
  note: string
}): Promise<void> => {
  const { id, note } = arg

  const fileNote: FileNote | null = await FileNote.findByPk(id)

  await fileNote?.update({
    note,
    updatedAt: new Date()
  })

  const _fileNote: FileNote | null = await FileNote.findByPk(id).then((fileNote) => fileNote?.toJSON()) as FileNote | null

  event.reply('updated-note', _fileNote)
}

export const handleDeleteNote = async (event: IpcMainEvent, arg: {
  id: number
}): Promise<void> => {
  const { id } = arg

  const fileNote: FileNote | null = await FileNote.findByPk(id)

  if (fileNote) {
    await fileNote.destroy()
  }

  event.reply('deleted-note', fileNote)
}

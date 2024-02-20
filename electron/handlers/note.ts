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

  const fileNote: FileNote = await FileNote.findByPk(id)

  fileNote.note = note

  await fileNote.save()

  event.reply('updated-note', fileNote)
}

export const handleDeleteNote = async (event: IpcMainEvent, arg: {
  id: number
}): Promise<void> => {
  const { id } = arg

  const fileNote: FileNote = await FileNote.findByPk(id)

  await fileNote.destroy()

  event.reply('deleted-note', fileNote)
}

import { IpcMainEvent } from "electron";
import { FileNote } from "../database/schemas";

export const handleListNotes = async (event: IpcMainEvent, arg: {
  file_id: number
}) => {
  const { file_id } = arg;

  const fileNotes: FileNote[] = await FileNote.findAll({
    where: {
      file_id,
    },
  }).then((fileNotes) => fileNotes.map((fileNote) => fileNote.toJSON()));

  event.reply("listed-notes", fileNotes);
};

export const handleAddNote = async (event: IpcMainEvent, arg: {
  file_id: number
  note: string
}) => {
  const { file_id, note } = arg;

  const fileNote: FileNote = await FileNote.create({
    file_id,
    note,
  });

  event.reply("added-note", fileNote);
};

export const handleUpdateNote = async (event: IpcMainEvent, arg: {
  id: number
  note: string
}) => {
  const { id, note } = arg;

  const fileNote: FileNote = await FileNote.findByPk(id);

  fileNote.note = note;

  await fileNote.save();

  event.reply("updated-note", fileNote);
}

export const handleDeleteNote = async (event: IpcMainEvent, arg: {
  id: number
}) => {
  const { id } = arg;

  const fileNote: FileNote = await FileNote.findByPk(id);

  await fileNote.destroy();

  event.reply("deleted-note", fileNote);
}
import { IpcMainEvent } from "electron";
import { FileNote } from "../database/schemas";

export const handleCreateNote = async (event: IpcMainEvent, arg: {
  file_id: number
  note: string
}) => {
  const { file_id, note } = arg;

  const fileNote: FileNote = await FileNote.create({
    file_id,
    note,
  });

  event.reply("created-note", fileNote);
};

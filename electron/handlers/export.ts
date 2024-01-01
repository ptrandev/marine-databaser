import { IpcMainEvent, dialog } from "electron";
const fs = require("fs").promises;
import { DATABASE_PATH } from "../constants";

/**
 * Exports the entire SQL database to a sqlite file and allow the user to save it
 */
export const handleDatabaseExport = async (event: IpcMainEvent) => {
  const result = await dialog.showSaveDialog({
    title: "Export Database",
    defaultPath: "database.sqlite",
  });

  if (result.canceled) {
    event.reply("database-export-canceled");
    return;
  }

  // our database is stored in a sqlite file, so we can just copy it
  await fs.copyFile(DATABASE_PATH, result.filePath).catch((err: Error) => {
    console.error(err);
    event.reply("database-export-error");
    return;
  });

  event.reply("database-export-success");
}
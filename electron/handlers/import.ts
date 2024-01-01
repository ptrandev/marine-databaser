import { IpcMainEvent, dialog } from 'electron/main';
const fs = require('fs').promises;
import { DATABASE_PATH } from '../constants';

export const handleDatabaseImport = async (event: IpcMainEvent) => {
  const result = await dialog.showOpenDialog({
    title: 'Import Database',
    defaultPath: 'database.sqlite',
    properties: ['openFile'],
    filters: [{ name: 'SQLite', extensions: ['sqlite'] }]
  });

  if (result.canceled) {
    event.reply('database-import-canceled');
    return;
  }

  // our database is stored in a sqlite file, so we can just copy it
  await fs.copyFile(result.filePaths[0], DATABASE_PATH).catch((err: Error) => {
    console.error(err);
    event.reply('database-import-error');
    return;
  });

  event.reply('database-import-success');
}
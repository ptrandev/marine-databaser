import { dialog } from 'electron'
const fs = require('fs').promises;

/**
 * Saves a JSON file to the user's computer. Prompt the user where to save the file.
 * @param event The event that triggered this function.
 * @param arg.data The data to save.
 * @returns
 */
export const handleSaveToJSON = async (event, arg) => {
  if (!arg.data) {
    event.reply('save-to-json-error');
    return;
  }

  const result = await dialog.showSaveDialog({
    title: 'Save to JSON',
    defaultPath: 'data.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (result.canceled) {
    event.reply('save-to-json-canceled');
    return;
  }

  try {
    await fs.writeFile(result.filePath, JSON.stringify(arg.data));
    event.reply('save-to-json-success');
  } catch (err) {
    console.error(err);
    event.reply('save-to-json-error');
  }
}

/**
 * Turns a JSON file into a JS object.
 * @param event The event that triggered this function.
 * @returns
 */
export const handleLoadFromJSON = async (event) => {
  const result = await dialog.showOpenDialog({
    title: 'Load from JSON',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (result.canceled) {
    event.reply('load-from-json-canceled');
    return;
  }

  try {
    const data = await fs.readFile(result.filePaths[0]);
    event.reply('load-from-json-success', JSON.parse(data));
  } catch (err) {
    console.error(err);
    event.reply('load-from-json-error');
  }
}
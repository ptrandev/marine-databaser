import { dialog, BrowserWindow, IpcMainEvent } from 'electron';
import { Op } from 'sequelize';
import { File } from '../database/schemas';
import mime from 'mime-types';

const ffmpeg = require('fluent-ffmpeg');

//Get the paths to the packaged versions of the binaries we want to use
const ffmpegPath = require('ffmpeg-static').replace(
  'app.asar',
  'app.asar.unpacked'
);
const ffprobePath = require('ffprobe-static').path.replace(
  'app.asar',
  'app.asar.unpacked'
);

// tell the ffmpeg package where it can find the needed binaries.
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * extract the audio from a video
 * @param {string} inputPath - the path to the video to extract audio from
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
const extractAudio = async (inputPath: string) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
    .outputOptions('-acodec', 'pcm_s16le')
    .toFormat('wav')
    // save in the same directory as the input file, but with a .wav extension and audio appended to the name
    .save(`${inputPath.replace(/\.[^/.]+$/, "")}-audio.wav`)
    .on('end', () => {
      return resolve();
    })
    .on('error', (err) => {
      console.error('Error extracting audio:', err);
      return reject(err);
    }).run();
  });
}

/**
 * splice a video
 * @param {string} inputPath - the path to the video to splice
 * @param {number} startTime - the time to start the splice at
 * @param {number} endTime - the time to end the splice at
 * @returns {Promise<void>} - a promise that resolves when the video has been spliced
 */
const spliceVideo = async (inputPath: string, startTime: number, endTime: number) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .outputOptions('-c', 'copy')
      .save(`${inputPath.replace(/\.[^/.]+$/, "")}-${startTime}-${endTime}.mp4`)
      .on('end', () => {
        return resolve();
      })
      .on('error', (err) => {
        console.error('Error splicing video:', err);
        return reject(err);
      }).run();
  });
}

/**
 * extract the audio from a video
 * @param {BrowserWindow} win - the window to show the dialog in
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleExtractAudio = async (win: BrowserWindow): Promise<void> => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] }
    ]
  });

  if (result.filePaths.length === 0) return;
  const inputPath = result.filePaths[0];

  return await extractAudio(inputPath);
}

/**
 * extract the audio from multiple videos
 * @param {IpcMainEvent} event - the event to reply to
 * @param {number[] | string[]} arg.files - the files to extract audio from
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleBulkExtractAudio = async (event: IpcMainEvent, arg: { files: number[] | string[] }) => {
  if (arg.files.length === 0) return;

  // if typeof files is number
  if (typeof arg.files[0] === 'number') {
    // get all the files from the database; ensure that mimetype is video
    const files = await File.findAll({
      where: {
        id: arg.files,
        mimeType: {
          [Op.like]: 'video/%'
        },
      }
    });

    // for each file, extract the audio
    files?.forEach(async (file) => {
      await extractAudio(file.path)
    });

    return
  }

  // if typeof files is string
  // filter mimetype to video
  const files: string[] = await arg.files.map((file) => {
    if (mime.lookup(file).toString().includes('video')) {
      return file;
    }
  })

  // for each file, extract the audio
  for (const file of files) {
    await extractAudio(file)
    event.reply('extracted-audio')
  }

  event.reply('bulk-extract-audio');
}

/**
 * allow selection of multiple files to extract audio from
 * @param {BrowserWindow} win - the window to show the dialog in
 * @param {IpcMainEvent} event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleSelectExtractAudioFiles = async (win: BrowserWindow, event: IpcMainEvent) => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] }
    ]
  });

  event.reply('selected-extract-audio-files', result.filePaths);
}

/**
 * allow selection of a file to splice
 * @param {BrowserWindow} win - the window to show the dialog in
 * @param {IpcMainEvent} event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleSelectSpliceVideoFile = async (win: BrowserWindow, event: IpcMainEvent) => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] }
    ]
  });

  event.reply('selected-splice-video-file', result.filePaths[0]);
}

/**
 * splice a video
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.videoPath - the path to the video to splice
 * @param {number[]} arg.splicePoints - the points to splice the video at
 * @returns {Promise<void>} - a promise that resolves when the video has been spliced
 */
export const handleSpliceVideo = async (event: IpcMainEvent, arg: { videoPath: string, splicePoints: number[] }) => {
  const { videoPath, splicePoints } = arg;

  // turn splicePoints number[] into splicePoints [number, number][]
  // for example, [1, 2, 3, 4] => [[1, 2], [2, 3], [3, 4]]
  const splicePointsArray = splicePoints.map((splicePoint, index) => {
    return [splicePoint, splicePoints[index + 1]];
  }).filter((splicePoint) => splicePoint[1] !== undefined);

  // for each splice point, splice the video; ensure this happens synchronously
  for (const splicePoint of splicePointsArray) {
    await spliceVideo(videoPath, splicePoint[0], splicePoint[1]);
  }

  event.reply('spliced-video');
}

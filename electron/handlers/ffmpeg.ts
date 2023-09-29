import { dialog, BrowserWindow, IpcMainEvent } from 'electron';
import { Op } from 'sequelize';
import { File } from '../database/schemas';
import mime from 'mime-types';
import path from 'path';
import { AudioFileFormat } from '../../shared/types/Audio';

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
 * @param {AudioFileFormat} fileFormat - the format to extract the audio in
 * @param {string} inputPath - the path to the video to extract audio from
 * @param {string} outputDirectory - the directory to save the audio to
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
const extractAudio = async ({
  fileFormat = 'pcm_s16le',
  inputPath,
  outputDirectory,
}: {
  fileFormat?: AudioFileFormat;
  inputPath: string;
  outputDirectory?: string;
}) => {
  return new Promise<void>((resolve, reject) => {
    const date = new Date();

    // if outputDirectory is not defined, save the audio in the same directory as the input file
    if (!outputDirectory) {
      outputDirectory = path.dirname(inputPath);
    }

    ffmpeg(inputPath)
      .outputOptions('-acodec', fileFormat)
      .toFormat('wav')
      // save in the same directory as the input file, but with a .wav extension and audio appended to the name
      .save(`${outputDirectory}/${path.basename(inputPath).replace(/\.[^/.]+$/, "")}-audio-${date.getTime()}.wav`)
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
      .save(`${inputPath.replace(/\.[^/.]+$/, "")}-${startTime}-${endTime}.${path.extname(inputPath)}`)
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
 * extract the audio from multiple videos
 * @param {IpcMainEvent} event - the event to reply to
 * @param {number[] | string[]} arg.files - the files to extract audio from
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleBulkExtractAudio = async (event: IpcMainEvent, arg: {
  files: number[] | string[],
  fileFormat: AudioFileFormat,
  outputDirectory: string
}) => {
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
      await extractAudio({ inputPath: file.path, fileFormat: arg.fileFormat, outputDirectory: arg.outputDirectory })
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
    await extractAudio({ inputPath: file, fileFormat: arg.fileFormat, outputDirectory: arg.outputDirectory })
    event.reply('extracted-audio')
  }

  event.reply('bulk-extract-audio');
}

/**
 * splice a video
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.videoPath - the path to the video to splice
 * @param {[number, number][]} arg.splicePoints - the points to splice the video at
 * @returns {Promise<void>} - a promise that resolves when the video has been spliced
 */
export const handleSpliceVideo = async (event: IpcMainEvent, arg: { videoPath: string, splicePoints: [number, number][] }) => {
  const { videoPath, splicePoints } = arg;

  // for each splice point, splice the video; ensure this happens synchronously
  for (const splicePoint of splicePoints) {
    await spliceVideo(videoPath, splicePoint[0], splicePoint[1]);
    event.reply('spliced-point-video');
  }

  event.reply('spliced-video');
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
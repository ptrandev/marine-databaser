import { dialog, BrowserWindow, IpcMainEvent } from 'electron';
import mime from 'mime-types';
import path from 'path';
import { AudioFileFormat, AutoSpliceSettings } from '../../shared/types';
import fs from 'fs';

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
const spliceVideo = async ({
  inputPath,
  startTime,
  endTime,
  outputDirectory,
}: {
  inputPath: string;
  startTime: number;
  endTime: number;
  outputDirectory?: string;
}) => {
  return new Promise<void>((resolve, reject) => {
    if (!outputDirectory) {
      outputDirectory = path.dirname(inputPath);
    }

    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .outputOptions('-c', 'copy')
      .save(`${outputDirectory}/${path.basename(inputPath).replace(/\.[^/.]+$/, "")}-${startTime}-${endTime}.${path.extname(inputPath)}`)
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
 * Using ffmpeg, find the length of the video
 * @param {string} videoPath - the path to the video to get the length of
 * @returns {Promise<number>} - a promise that resolves with the length of the video
 */
const getVideoLength = (videoPath: string) => {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      }

      const duration = metadata.format.duration;

      resolve(duration);
    });
  });
}

/**
 * Using a list of silence timestamps, find the timestamps containing noise
 * @param {[number, number][]} silenceTimestamps - the list of silence timestamps
 * @param {number} audioLength - the length of the audio
 * @returns {[number, number][]} - a list of timestamps containing noise
 */
const findNoiseTimeStamps = (silenceTimestamps: [number, number][], audioLength: number) => {
  let noiseTimestamps = [];

  // If the list of silence timestamps is empty, the whole audio contains noise
  if (silenceTimestamps.length === 0) {
    noiseTimestamps.push([0, audioLength]);
    return noiseTimestamps;
  }

  // Check for noise before the first silence timestamp
  if (silenceTimestamps[0][0] > 0) {
    noiseTimestamps.push([0, silenceTimestamps[0][0]]);
  }

  // Check for noise between silence timestamps
  for (let i = 1; i < silenceTimestamps.length; i++) {
    let start = silenceTimestamps[i - 1][1];
    let end = silenceTimestamps[i][0];

    if (end > start) {
      noiseTimestamps.push([start, end]);
    }
  }

  // Check for noise after the last silence timestamp
  if (silenceTimestamps[silenceTimestamps.length - 1][1] < audioLength) {
    noiseTimestamps.push([silenceTimestamps[silenceTimestamps.length - 1][1], audioLength]);
  }

  return noiseTimestamps;
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

  // if typeof files is string
  // filter mimetype to video
  const files: string[] = await arg.files.map((file) => {
    if (mime.lookup(file).toString().includes('video')) {
      return file;
    }
  })

  // for each file, extract the audio
  for (const file of files) {
    await extractAudio({ inputPath: file, fileFormat: arg.fileFormat, outputDirectory: arg.outputDirectory }).catch((err) => {
      event.reply('extracted-audio-failed', err.message);
    });

    event.reply('extracted-audio')
  }

  event.reply('bulk-extract-audio');
}

/**
 * splice a video
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.videoPath - the path to the video to splice
 * @param {[number, number][]} arg.splicePoints - the points to splice the video at
 * @param {string} arg.outputDirectory - the directory to save the spliced videos to
 * @returns {Promise<void>} - a promise that resolves when the video has been spliced
 */
export const handleSpliceVideo = async (event: IpcMainEvent, arg: { videoPath: string, splicePoints: [number, number][], outputDirectory?: string }) => {
  const { videoPath, splicePoints, outputDirectory } = arg;

  // for each splice point, splice the video; ensure this happens synchronously
  for (const splicePoint of splicePoints) {
    await spliceVideo({ inputPath: videoPath, startTime: splicePoint[0], endTime: splicePoint[1], outputDirectory }).catch((err) => {
      event.reply('splice-point-video-failed', err.message);
    });

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

/**
 * get the framerate of a video
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.videoPath - the path to the video to get the framerate of
 * @returns {Promise<void>} - a promise that resolves when the framerate has been retrieved
 */
export const handleGetVideoFramerate = async (event: IpcMainEvent, arg: { videoPath: string }) => {
  ffmpeg.ffprobe(arg.videoPath, (err, metadata) => {
    if (err) {
      event.reply('failed-to-get-video-framerate', err);
      return;
    }

    // find first metadata.stream with codec_type video; get r_frame_rate from that stream
    const framerate = metadata.streams.find((stream: { codec_type: string }) => stream.codec_type === 'video')?.r_frame_rate;

    if (!framerate) {
      event.reply('failed-to-get-video-framerate', 'Failed to get framerate of video.');
      return;
    }

    event.reply('got-video-framerate', framerate);
  });
}

export const handleAutoSplice = async (event: IpcMainEvent, arg: { videoPath: string, autoSpliceSettings: AutoSpliceSettings, outputDirectory?: string }) => {
  let splicePoints = [];

  const { minFrequency, maxFrequency, minAmplitude, minDuration } = arg.autoSpliceSettings;
  const { videoPath } = arg;

  if (!arg.outputDirectory) {
    arg.outputDirectory = path.dirname(videoPath);
  }

  const outputDirectory = arg.outputDirectory;

  const videoLength = await getVideoLength(videoPath);

  // use a timestamp as the temporary file name
  const timestamp = new Date().getTime().toString(16) + '.wav';

  // Apply the following audio filters:
  // - filter out frequencies below minFrequency and above maxFrequency
  // - filter out silence below minAmplitude for at least minDuration
  ffmpeg()
    .input(videoPath)
    .audioCodec('pcm_s16le') // Output audio in PCM format
    .audioFilter(`highpass=f=${minFrequency},lowpass=f=${maxFrequency}`)
    .audioFilters(`silencedetect=n=${minAmplitude}dB:d=${minDuration}`)
    .on('end', async () => {
      const noiseTimestamps = findNoiseTimeStamps(splicePoints, videoLength);

      fs.unlinkSync(timestamp);
      event.reply('auto-spliced', noiseTimestamps);
    })
    .on('error', (err) => {
      event.reply('auto-splice-failed', err.message);
      fs.unlinkSync(timestamp);
    })
    .on('stderr', (stderrLine) => {
      if (stderrLine.includes('silence_start')) {
        const start = parseFloat(stderrLine.split('silence_start: ')[1]);
        splicePoints.push([start]);
      }

      if (stderrLine.includes('silence_end')) {
        const end = parseFloat(stderrLine.split('silence_end: ')[1]);
        splicePoints[splicePoints.length - 1].push(end);

        console.log('auto-splice-progress', end / videoLength);

        // progress is the endpoint / video length
        event.reply('auto-spliced-progress', end / videoLength);
      }
    })
    .save(timestamp);
}
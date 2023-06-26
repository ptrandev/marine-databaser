import { dialog, BrowserWindow } from 'electron';
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

//tell the ffmpeg package where it can find the needed binaries.
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * extract the audio from a video
 * @param {BrowserWindow} win - the window to show the dialog in
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleExtractAudio = async (win : BrowserWindow): Promise<void> => {
  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] }
    ]
  });

  if (result.filePaths.length === 0) return;
  const inputPath = result.filePaths[0];

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-acodec', 'pcm_s16le')
      .toFormat('wav')
      // save in the same directory as the input file, but with a .wav extension and audio appended to the name
      .save(`${inputPath.replace(/\.[^/.]+$/, "")}-audio.wav`)
      .on('end', () => {
        console.log('Audio extraction complete');
      })
      .on('error', (err) => {
        console.error('Error extracting audio:', err);
      }).run();
  });
}
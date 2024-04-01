import { dialog, type BrowserWindow, type IpcMainEvent, app } from 'electron'
import mime from 'mime-types'
import path from 'path'
import { type AudioFileFormat, type AutoSpliceSettings, type SpliceRegion } from '../../shared/types'
import fs from 'fs'

import ffmpeg, { type FfprobeStream } from 'fluent-ffmpeg'

// Get the paths to the packaged versions of the binaries we want to use
import ffmpegPath from 'ffmpeg-static'
import ffprobePath from 'ffprobe-static'
import { addFilesToDatabase, findDirectoryByPath } from './directory'
import { addFileParent } from './fileParent'
import { findFileByPath } from './file'

// tell the ffmpeg package where it can find the needed binaries.
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath.replace('app.asar', 'app.asar.unpacked'))
}
ffmpeg.setFfprobePath(ffprobePath.path.replace('app.asar', 'app.asar.unpacked'))

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
  outputDirectory
}: {
  fileFormat?: AudioFileFormat
  inputPath: string
  outputDirectory: string
}): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
    const date = new Date()

    const audioPath = `${outputDirectory}/${path.basename(inputPath).replace(/\.[^/.]+$/, '')}-audio-${date.getTime()}.wav`

    ffmpeg(inputPath)
      .outputOptions('-acodec', fileFormat)
      .toFormat('wav')
      // save in the same directory as the input file, but with a .wav extension and audio appended to the name
      .save(audioPath)
      .on('end', () => {
        resolve(audioPath)
      })
      .on('error', (err) => {
        console.error('Error extracting audio:', err)
        reject(err)
      }).run()
  })
}

/**
 * splice a video
 * @param {string} inputPath - the path to the video to splice
 * @param {number} startTime - the time to start the splice at
 * @param {number} endTime - the time to end the splice at
 * @param {string} name - the name to give the spliced video
 * @param {string} outputDirectory - the directory to save the spliced video to
 * @param {string} videoBasename - the base name of the video
 * @returns {Promise<void>} - a promise that resolves when the video has been spliced
 */
const spliceVideo = async ({
  inputPath,
  startTime,
  endTime,
  name,
  outputDirectory,
  videoBasename
}: {
  inputPath: string
  startTime: number
  endTime: number
  name: string
  outputDirectory: string
  videoBasename: string
}): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .outputOptions('-c', 'copy')
      .save(`${outputDirectory}/${videoBasename}${name}${path.extname(inputPath)}`)
      .on('end', () => {
        resolve()
      })
      .on('error', (err) => {
        console.error('Error splicing video:', err)
        reject(err)
      }).run()
  })
}

/**
 * Using ffmpeg, find the length of the video
 * @param {string} videoPath - the path to the video to get the length of
 * @returns {Promise<number>} - a promise that resolves with the length of the video
 */
const getVideoDuration = async (videoPath: string): Promise<number> => {
  return await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err)
      }

      const duration: number = metadata.format.duration ?? 0

      resolve(duration)
    })
  })
}

/**
 * A thin wrapper around getVideoDuration to handle the event reply
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.videoPath - the path to the video to get the duration of
 */
export const handleGetVideoDuration = (event: IpcMainEvent, arg: {
  videoPath: string
}): void => {
  getVideoDuration(arg.videoPath).then((duration) => {
    event.reply('got-video-duration', duration)
  }).catch((err) => {
    event.reply('get-video-duration-error', err.message)
  })
}

/**
 * Using a list of silence timestamps, find the timestamps containing noise
 * @param {SpliceRegion[]} silenceTimestamps - the list of silence timestamps
 * @param {number} audioLength - the length of the audio
 * @returns {SpliceRegion[]} - a list of timestamps containing noise
 */
const findNoiseTimeStamps = (silenceTimestamps: SpliceRegion[], audioLength: number): SpliceRegion[] => {
  const noiseTimestamps: SpliceRegion[] = []

  // If the list of silence timestamps is empty, the whole audio contains noise
  if (silenceTimestamps.length === 0) {
    noiseTimestamps.push({
      name: `${Date.now()}`,
      start: 0,
      end: audioLength
    })
    return noiseTimestamps
  }

  // Check for noise before the first silence timestamp
  if (silenceTimestamps[0].start > 0) {
    noiseTimestamps.push({
      name: `${Date.now()}`,
      start: 0,
      end: silenceTimestamps[0].start
    })
  }

  // Check for noise between silence timestamps
  for (let i = 1; i < silenceTimestamps.length; i++) {
    const start = silenceTimestamps[i - 1].end
    const end = silenceTimestamps[i].start

    if (end > start) {
      noiseTimestamps.push({
        name: `${Date.now()}`,
        start,
        end
      })
    }
  }

  // Check for noise after the last silence timestamp
  if (silenceTimestamps[silenceTimestamps.length - 1].end < audioLength) {
    noiseTimestamps.push({
      name: `${Date.now()}`,
      start: silenceTimestamps[silenceTimestamps.length - 1].end,
      end: audioLength
    })
  }

  return noiseTimestamps
}

/**
 * extract the audio from multiple videos
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string[]} arg.files - the files to extract audio from
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleBulkExtractAudio = async (event: IpcMainEvent, arg: {
  files: string[]
  fileFormat: AudioFileFormat
  outputDirectory: string
}): Promise<void> => {
  if (arg.files.length === 0) return

  // if typeof files is string
  // filter mimetype to video
  const files: string[] = arg.files.map((file) => {
    if (mime.lookup(file).toString().includes('video')) {
      return file
    }
    return null
  }).filter((file) => file !== null) as string[]

  // for each file, extract the audio
  for (const file of files) {
    const outputDirectory = arg.outputDirectory ?? path.dirname(file)

    await extractAudio({ inputPath: file, fileFormat: arg.fileFormat, outputDirectory }).then(async (audioPath) => {
      // check if file is in the database of Files, and if outputDirectory is tracked in the database of directories
      const parentFile = await findFileByPath(file)
      const childDirectory = await findDirectoryByPath(outputDirectory)

      if (!parentFile || !childDirectory) return

      // track created file in database
      const files = await addFilesToDatabase({
        files: [audioPath],
        directoryId: childDirectory.id
      })

      // create relationship between parent video and extracted audio
      await addFileParent({
        fileParentId: parentFile.id,
        fileChildrenIds: files.map((file) => file.id)
      })
    }).catch((err) => {
      event.reply('extracted-audio-error', err.message)
    })

    event.reply('extracted-audio')
  }

  event.reply('bulk-extract-audio')
}

/**
 * splice a video
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.videoPath - the path to the video to splice
 * @param {SpliceRegion[]} arg.spliceRegions - the points to splice the video at
 * @param {string} arg.outputDirectory - the directory to save the spliced videos to
 * @param {string} arg.videoBasename - the base name of the video
 * @param {boolean} arg.trackInDatabase - whether to track the spliced videos in the database
 * @returns {Promise<void>} - a promise that resolves when the video has been spliced
 */
export const handleSpliceVideo = async (event: IpcMainEvent, arg: { videoPath: string, spliceRegions: SpliceRegion[], outputDirectory?: string, videoBasename: string }): Promise<void> => {
  const { videoPath, spliceRegions, videoBasename } = arg
  const outputDirectory = arg.outputDirectory ?? path.dirname(videoPath)

  // check if videoPath is in the database of Files
  const parentVideo = await findFileByPath(videoPath)

  // check if outputDirectory is tracked in the database of directories; sort by length of the path string in descending order
  const childDirectory = await findDirectoryByPath(outputDirectory)

  // for each splice region, splice the video; ensure this happens synchronously
  for (const spliceRegion of spliceRegions) {
    await spliceVideo({
      inputPath: videoPath,
      startTime: spliceRegion.start,
      endTime: spliceRegion.end,
      name: spliceRegion.name,
      outputDirectory,
      videoBasename
    }).then(async () => {
      if (!parentVideo || !childDirectory) return

      // track created file in database
      const files = await addFilesToDatabase({
        files: [`${outputDirectory}/${videoBasename}${spliceRegion.name}${path.extname(videoPath)}`],
        directoryId: childDirectory.id
      })

      // create relationship between parent video and spliced video
      await addFileParent({
        fileParentId: parentVideo.id,
        fileChildrenIds: files.map((file) => file.id)
      })
    }).catch((err) => {
      event.reply('splice-point-video-error', err.message)
    })

    event.reply('spliced-point-video')
  }

  event.reply('spliced-video')
}

/**
 * allow selection of multiple files to extract audio from
 * @param {BrowserWindow} win - the window to show the dialog in
 * @param {IpcMainEvent} event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleSelectExtractAudioFiles = async (win: BrowserWindow, event: IpcMainEvent): Promise<void> => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] }
    ]
  })

  event.reply('selected-extract-audio-files', result.filePaths)
}

/**
 * allow selection of a file to splice
 * @param {BrowserWindow} win - the window to show the dialog in
 * @param {IpcMainEvent} event - the event to reply to
 * @returns {Promise<void>} - a promise that resolves when the audio has been extracted
 */
export const handleSelectSpliceVideoFile = async (win: BrowserWindow, event: IpcMainEvent): Promise<void> => {
  // use mime type package to get all extensions that have type of video/*

  // find all keys containing 'video' in the mime database and return their value; then flatten
  const extensions = Object.keys(mime.extensions).filter((key) => key.includes('video')).map((key) => mime.extensions[key]).flat()

  extensions.push('dv')

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions }
    ]
  })

  // analyze the video and see if it has any audio; if not, return an error
  ffmpeg.ffprobe(result.filePaths[0], (err, metadata) => {
    if (err) {
      event.reply('selected-splice-video-file-error', err.message)
      return
    }

    // find first metadata.stream with codec_type audio; if not found, return an error
    // @ts-expect-error - we are using the ffmpeg metadata
    const audioStream = metadata.streams.find((stream: { codec_type: string }) => stream.codec_type === 'audio')

    if (!audioStream) {
      event.reply('selected-splice-video-file-error', 'Video has no audio, cannot splice.')
    } else {
      event.reply('selected-splice-video-file', result.filePaths[0])
    }
  })
}

/**
 * get the framerate of a video
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.videoPath - the path to the video to get the framerate of
 * @returns {Promise<void>} - a promise that resolves when the framerate has been retrieved
 */
export const handleGetVideoFramerate = async (event: IpcMainEvent, arg: { videoPath: string }): Promise<void> => {
  ffmpeg.ffprobe(arg.videoPath, (err, metadata) => {
    if (err) {
      event.reply('failed-to-get-video-framerate', err.message)
      return
    }

    // find first metadata.stream with codec_type video; get r_frame_rate from that stream
    // @ts-expect-error - we are using the ffmpeg metadata
    const framerate = metadata.streams.find((stream: { codec_type: string }) => stream.codec_type === 'video')?.r_frame_rate

    if (!framerate) {
      event.reply('failed-to-get-video-framerate', 'Failed to get framerate of video.')
      return
    }

    event.reply('got-video-framerate', framerate)
  })
}

export const handleAutoSplice = async (event: IpcMainEvent, arg: { videoPath: string, autoSpliceSettings: AutoSpliceSettings, outputDirectory?: string }): Promise<void> => {
  const spliceRegions: SpliceRegion[] = []

  const { minFrequency, maxFrequency, minAmplitude, minDuration } = arg.autoSpliceSettings
  const { videoPath } = arg

  if (!arg.outputDirectory) {
    arg.outputDirectory = path.dirname(videoPath)
  }

  const videoDuration = await getVideoDuration(videoPath)

  // use a timestamp as the temporary file name
  const timestamp = new Date().getTime().toString(16) + '.wav'

  // Apply the following audio filters:
  // - filter out frequencies below minFrequency and above maxFrequency
  // - filter out silence below minAmplitude for at least minDuration
  ffmpeg()
    .input(videoPath)
    .audioCodec('pcm_s16le') // Output audio in PCM format
    .audioFilter(`highpass=f=${minFrequency},lowpass=f=${maxFrequency}`)
    .audioFilters(`silencedetect=n=${minAmplitude}dB:d=${minDuration}`)
    .on('end', () => {
      const noiseTimestamps = findNoiseTimeStamps(spliceRegions, videoDuration)

      fs.unlinkSync(timestamp)

      event.reply('auto-spliced', noiseTimestamps)
    })
    .on('error', (err) => {
      event.reply('auto-splice-error', err.message)
      fs.unlinkSync(timestamp)
    })
    .on('stderr', (stderrLine) => {
      if (stderrLine.includes('silence_start')) {
        const start = parseFloat(stderrLine.split('silence_start: ')[1] as string)
        spliceRegions.push({
          name: `${Date.now()}`,
          start,
          end: 0
        })
      }

      if (stderrLine.includes('silence_end')) {
        const end = parseFloat(stderrLine.split('silence_end: ')[1] as string)
        spliceRegions[spliceRegions.length - 1] = {
          ...spliceRegions[spliceRegions.length - 1],
          end
        }

        // progress is the endpoint / video length
        event.reply('auto-spliced-progress', end / videoDuration)
      }
    })
    .save(timestamp)
}

/**
 * get the sample rate of an audio or video file
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.audioPath - the path to the audio or video file to get the sample rate of
 * @returns {Promise<void>} - a promise that resolves when the sample rate has been retrieved
 */
export const handleGetAudioSampleRate = async (event: IpcMainEvent, arg: { filePath: string }): Promise<void> => {
  const { filePath } = arg

  ffmpeg.ffprobe(filePath, (err, metadata) => {
    if (err) {
      event.reply('failed-to-get-audio-sample-rate', err.message)
      return
    }

    // find first metadata.stream with codec_type audio; get sample_rate from that stream
    // @ts-expect-error - we are using the ffmpeg metadata
    const sampleRate = metadata.streams.find((stream: { codec_type: string }) => stream.codec_type === 'audio')?.sample_rate

    if (!sampleRate) {
      event.reply('failed-to-get-audio-sample-rate', 'Failed to get sample rate of audio.')
      return
    }

    event.reply('got-audio-sample-rate', sampleRate)
  })
}

/**
 * Converts the video to a compatible format; send the progress to the renderer and reply with the path to the converted video
 * @param {IpcMainEvent} event - the event to reply to
 * @param {string} arg.videoPath - the path to the video to convert
 * @returns {Promise<void>} - a promise that resolves when the video has been converted
 */
export const handleConvertVideo = async (event: IpcMainEvent, arg: { videoPath: string }): Promise<void> => {
  if (!arg.videoPath) {
    event.reply('convert-video-error', 'No video path provided.')
    return
  }

  // get video file name without extension
  const videoBasename = path.basename(arg.videoPath).replace(/\.[^/.]+$/, '')

  // use system temp directory to store the converted video
  const tempPath = path.join(app.getPath('temp'), `${videoBasename}.mov`)

  const audioStream = await new Promise<FfprobeStream | undefined>((resolve, reject) => {
    ffmpeg.ffprobe(arg.videoPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      // @ts-expect-error - we are using the ffmpeg metadata
      const audioStream = metadata.streams.find((stream: { codec_type: string }) => stream.codec_type === 'audio')
      resolve(audioStream)
    })
  })

  const video = ffmpeg().input(arg.videoPath)

  if (audioStream) {
    const bitsPerSample = audioStream.bits_per_sample ?? 16

    if (bitsPerSample <= 8) {
      video.audioCodec('pcm_u8')
    } else if (bitsPerSample <= 16) {
      video.audioCodec('pcm_s16le')
    } else if (bitsPerSample <= 24) {
      video.audioCodec('pcm_s24le')
    } else if (bitsPerSample <= 32) {
      video.audioCodec('pcm_s32le')
    }

    video
      .audioChannels(audioStream.channels ?? 2)
      .audioFrequency(audioStream.sample_rate ?? 44100)
  }

  video
    .videoCodec('libx264')
    .on('progress', (progress) => {
      event.reply('convert-video-progress', progress.percent)
    })
    .on('end', () => {
      event.reply('converted-video', tempPath)
    })
    .on('error', (err) => {
      event.reply('convert-video-error', err.message)
    })
    .save(tempPath)
}

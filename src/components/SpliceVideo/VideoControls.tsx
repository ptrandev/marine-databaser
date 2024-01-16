import { FC, useEffect, useState, useMemo } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, IconButton, Slider, Stack, Tooltip, Typography } from '@mui/material'
import { FirstPage, LastPage, PlayArrow, SkipNext, SkipPrevious, Pause, Replay, Replay5, Forward5, Replay10, Forward10 } from '@mui/icons-material'
import fs from 'fs'
import WavesurferPlayer from '@wavesurfer/react'
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram.js"
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'
import colormap from 'colormap'
import { ipcRenderer } from 'electron'

const colors = colormap({
  colormap: 'hot',
  nshades: 256,
  format: 'float',
  alpha: 1,
})

const VideoControls: FC = () => {
  const { selectedVideo, videoFramerate, setVideoRef } = useSpliceVideo()

  const video = document.getElementById('splice-video') as HTMLVideoElement

  const [videoState, setVideoState] = useState<'playing' | 'paused'>('paused')

  const [zoom, setZoom] = useState<number>(1)
  const [frequencyMax, setFrequencyMax] = useState<number>(22_050)
  const [audioSampleRate, setAudioSampleRate] = useState<number>(44_100)

  useEffect(() => {
    if (!selectedVideo) {
      return
    }

    // restore values to default
    setZoom(1)
    setFrequencyMax(22_050)
    setAudioSampleRate(44_100)

    ipcRenderer.send('get-audio-sample-rate', {
      filePath: selectedVideo,
    })

    ipcRenderer.once('got-audio-sample-rate', (_, sampleRate) => {
      setAudioSampleRate(sampleRate)
    })
  }, [selectedVideo])

  useEffect(() => {
    setFrequencyMax(audioSampleRate / 2)
  }, [audioSampleRate])

  const videoUrl = useMemo(() => {
    if (!selectedVideo) {
      return null
    }

    const blob = fs.readFileSync(selectedVideo)
    return URL.createObjectURL(new Blob([blob]))
  }, [selectedVideo])

  useEffect(() => {
    if (!video) {
      return
    }

    const handlePlay = () => {
      setVideoState('playing')
    }

    const handlePause = () => {
      setVideoState('paused')
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [video])

  const handleGoToStart = () => {
    video.currentTime = 0
  }

  const handleGoToEnd = () => {
    video.currentTime = video.duration
  }

  const handlePlayPause = () => {
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  const handleGoBackOneFrame = () => {
    if (!videoFramerate) {
      return
    }

    video.currentTime -= 1 / videoFramerate
  }

  const handleGoForwardOneFrame = () => {
    if (!videoFramerate) {
      return
    }

    video.currentTime += 1 / videoFramerate
  }

  const handleSecondsOffset = (seconds: number) => {
    video.currentTime += seconds
  }

  return (
    <>
      {videoUrl && (
        <>
          <video
            id='splice-video'
            controls
            key={selectedVideo}
            style={{ width: '100%', height: 'auto', maxHeight: '100%' }}
            ref={setVideoRef}
            src={videoUrl}
          />
          <Box display='flex' justifyContent='center'>
            <Stack direction='row' gap={1}>
              <Box>
                <Tooltip title='Go to start of video'>
                  <IconButton onClick={handleGoToStart}>
                    <SkipPrevious />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go backward 10 seconds'>
                  <IconButton onClick={() => handleSecondsOffset(-10)}>
                    <Replay10 />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go backward 5 seconds'>
                  <IconButton onClick={() => handleSecondsOffset(-5)}>
                    <Replay5 />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go backward 1 second'>
                  <IconButton onClick={() => handleSecondsOffset(-1)}>
                    <Replay />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go backward one frame'>
                  <IconButton onClick={handleGoBackOneFrame}>
                    <FirstPage />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <IconButton onClick={handlePlayPause}>
                  {
                    videoState === 'playing'
                      ? <Pause />
                      : <PlayArrow />
                  }
                </IconButton>
              </Box>
              <Box>
                <Tooltip title='Go forward one frame'>
                  <IconButton onClick={handleGoForwardOneFrame}>
                    <LastPage />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go forward 1 second'>
                  <IconButton onClick={() => handleSecondsOffset(1)}>
                    <Replay sx={{ transform: 'scaleX(-1)' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go forward 5 seconds'>
                  <IconButton onClick={() => handleSecondsOffset(5)}>
                    <Forward5 />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go forward 10 seconds'>
                  <IconButton onClick={() => handleSecondsOffset(10)}>
                    <Forward10 />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go to end of video'>
                  <IconButton onClick={handleGoToEnd}>
                    <SkipNext />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </Box>
          <Box>
            <WavesurferPlayer
              height={100}
              media={video}
              progressColor='#1976d2'
              minPxPerSec={zoom}
              dragToSeek
              normalize
              // @ts-ignore
              splitChannels
              sampleRate={audioSampleRate}
              frequencyMax={frequencyMax}
              onRedraw={(wavesurfer) => {
                const activePlugins = wavesurfer.getActivePlugins()

                // detect if timeline plugin is active
                if (!activePlugins.some((plugin) => (plugin as any).timelineWrapper)) {
                  wavesurfer.registerPlugin(TimelinePlugin.create())
                }

                // detect if spectrogram plugin is active
                if (!activePlugins.some((plugin) => (plugin as any).colorMap)) {
                  wavesurfer.registerPlugin(SpectrogramPlugin.create({
                    labels: true,
                    frequencyMax,
                    labelsBackground: '#00000066',
                    colorMap: colors,
                    splitChannels: false,
                  }))
                }
              }}
            />
            <Box maxWidth='calc(100% - 32px)'>
              <Stack direction='row' alignItems='center' gap={2}>
                <Typography variant='body2'>
                  Zoom
                </Typography>
                <Slider
                  value={zoom}
                  onChange={(_, value) => setZoom(value as number)}
                  min={1}
                  max={5000}
                />
              </Stack>
              <Stack direction='row' alignItems='center' gap={2}>
                <Typography variant='body2' noWrap>
                  Max Frequency (Hz)
                </Typography>
                <Slider
                  value={frequencyMax}
                  onChange={(_, value) => setFrequencyMax(value as number)}
                  min={0}
                  max={audioSampleRate / 2}
                  valueLabelDisplay='auto'
                  sx={{
                    flex: 1,
                  }}
                />
              </Stack>
            </Box>
          </Box>
        </>
      )}
    </>
  )
}

export default VideoControls
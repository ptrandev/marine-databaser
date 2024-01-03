import { FC, useEffect, useState } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Alert, Box, IconButton, Snackbar, Stack, Tooltip } from '@mui/material'
import { FirstPage, LastPage, PlayArrow, SkipNext, SkipPrevious, Pause } from '@mui/icons-material'
import { ipcRenderer } from 'electron'

const VideoControls: FC = () => {
  const { selectedVideo } = useSpliceVideo()

  const video = document.getElementById('splice-video') as HTMLVideoElement

  const [videoState, setVideoState] = useState<'playing' | 'paused'>('paused')
  const [videoFramerate, setVideoFramerate] = useState<number | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // when selectedVideo changes, use electron to get the framerate of the video
  useEffect(() => {
    if (!selectedVideo) {
      setVideoFramerate(null)
      return
    }

    ipcRenderer.send('get-video-framerate', {
      videoPath: selectedVideo,
    })

    ipcRenderer.once('got-video-framerate', (_, framerate) => {
      // evaluate the string as a number; it is in the form of '30/1'
      framerate = eval(framerate)
      setVideoFramerate(framerate)
    })

    ipcRenderer.once('get-video-framerate-failed', (_, errorMessage) => {
      setErrorMessage(errorMessage)
    })


    return () => {
      ipcRenderer.removeAllListeners('got-video-framerate')
      ipcRenderer.removeAllListeners('get-video-framerate-failed')
    }
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

  const handleGoToEnd = () => {
    video.currentTime = video.duration
  }

  return (
    <>
      {selectedVideo && (
        <>
          <video id='splice-video' controls key={selectedVideo} style={{ width: '100%', height: 'auto', maxHeight: '100%' }}>
            <source src={`media-loader://${selectedVideo}`} />
          </video>
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
                <Tooltip title='Go to end of video'>
                  <IconButton onClick={handleGoToEnd}>
                    <SkipNext />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </Box>
        </>
      )}
      {!!errorMessage && (
        <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={() => setErrorMessage(null)}>
          <Alert severity='error' onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        </Snackbar>
      )}
    </>
  )
}

export default VideoControls
import { FC, useEffect, useState } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, IconButton, Stack, Tooltip } from '@mui/material'
import { FirstPage, LastPage, PlayArrow, SkipNext, SkipPrevious, Pause, Replay, Replay5, Forward5, Replay10, Forward10 } from '@mui/icons-material'


const VideoControls: FC = () => {
  const { selectedVideo, videoFramerate, videoRef } = useSpliceVideo()

  const video = document.getElementById('splice-video') as HTMLVideoElement

  const [videoState, setVideoState] = useState<'playing' | 'paused'>('paused')

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
      {selectedVideo && (
        <>
          <video id='splice-video' controls key={selectedVideo} style={{ width: '100%', height: 'auto', maxHeight: '100%' }} ref={videoRef}>
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
        </>
      )}
    </>
  )
}

export default VideoControls
import { type FC, useEffect, useState, useMemo } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, IconButton, Stack, Tooltip } from '@mui/material'
import { FirstPage, LastPage, PlayArrow, SkipNext, SkipPrevious, Pause, Replay, Replay5, Forward5, Replay10, Forward10 } from '@mui/icons-material'
import fs from 'fs'

const VideoControls: FC = () => {
  const { selectedVideo, videoFramerate, updateVideoRef, videoRef } = useSpliceVideo()

  const [videoState, setVideoState] = useState<'playing' | 'paused'>('paused')

  const videoUrl = useMemo(() => {
    if (!selectedVideo) {
      return null
    }

    const blob = fs.readFileSync(selectedVideo)
    return URL.createObjectURL(new Blob([blob]))
  }, [selectedVideo])

  useEffect(() => {
    if (!videoRef) {
      return
    }

    const handlePlay = (): void => {
      setVideoState('playing')
    }

    const handlePause = (): void => {
      setVideoState('paused')
    }

    videoRef.addEventListener('play', handlePlay)
    videoRef.addEventListener('pause', handlePause)

    return () => {
      videoRef.removeEventListener('play', handlePlay)
      videoRef.removeEventListener('pause', handlePause)

      // Revoke the object URL to prevent memory leaks
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoRef])

  const handleGoToStart = (): void => {
    if (videoRef) {
      videoRef.currentTime = 0
    }
  }

  const handleGoToEnd = (): void => {
    if (videoRef) {
      videoRef.currentTime = videoRef.duration
    }
  }

  const handlePlayPause = (): void => {
    if (!videoRef) {
      return
    }

    if (videoRef.paused) {
      void videoRef.play()
    } else {
      videoRef.pause()
    }
  }

  const handleGoBackOneFrame = (): void => {
    if (!videoFramerate || !videoRef) {
      return
    }

    videoRef.currentTime -= 1 / videoFramerate
  }

  const handleGoForwardOneFrame = (): void => {
    if (!videoFramerate || !videoRef) {
      return
    }

    videoRef.currentTime += 1 / videoFramerate
  }

  const handleSecondsOffset = (seconds: number): void => {
    if (videoRef) {
      videoRef.currentTime += seconds
    }
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
            ref={updateVideoRef}
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
                  <IconButton onClick={() => { handleSecondsOffset(-10) }}>
                    <Replay10 />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go backward 5 seconds'>
                  <IconButton onClick={() => { handleSecondsOffset(-5) }}>
                    <Replay5 />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go backward 1 second'>
                  <IconButton onClick={() => { handleSecondsOffset(-1) }}>
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
                  <IconButton onClick={() => { handleSecondsOffset(1) }}>
                    <Replay sx={{ transform: 'scaleX(-1)' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go forward 5 seconds'>
                  <IconButton onClick={() => { handleSecondsOffset(5) }}>
                    <Forward5 />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Tooltip title='Go forward 10 seconds'>
                  <IconButton onClick={() => { handleSecondsOffset(10) }}>
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

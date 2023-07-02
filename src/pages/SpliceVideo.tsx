import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, Button, Container, Typography } from '@mui/material'
import { FC, useEffect, useState } from 'react'
import { ipcRenderer } from 'electron'

const SpliceVideo: FC = () => {
  const { selectedVideo, updateSelectedVideo } = useSpliceVideo()

  const [splicePoints, updateSplicePoints] = useState<number[]>([])

  const handleSelectVideo = () => {
    ipcRenderer.send('select-splice-video-file')

    ipcRenderer.on('selected-splice-video-file', (_, path) => {
      updateSelectedVideo(path)
    })
  }

  const handleSpliceVideo = () => {
    // get length of video
    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    ipcRenderer.send('splice-video', {
      videoPath: selectedVideo,
      splicePoints: [0, ...splicePoints, video.duration]
    })

    ipcRenderer.on('spliced-video', (_, path) => {
      updateSelectedVideo(path)
    })
  }

  const handleAddSplicePoint = () => {
    // get current time of video
    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    const splicePoint = video.currentTime

    updateSplicePoints((prevSplicePoints) => {
      if (!prevSplicePoints) {
        return [splicePoint]
      }

      // return in sorted order
      return [...prevSplicePoints, splicePoint].sort((a, b) => a - b)
    })
  }

  const handleRemoveSplicePoint = (splicePoint: number) => {
    updateSplicePoints((prevSplicePoints) => {
      if (!prevSplicePoints) {
        return []
      }

      return prevSplicePoints.filter((point) => point !== splicePoint)
    })
  }

  const handleGoToSplicePoint = (splicePoint: number) => {
    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    video.currentTime = splicePoint
  }

  useEffect(() => {
    updateSplicePoints([])
  }, [selectedVideo])

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('selected-splice-video-file')
    }
  }, [])

  return (
    <Box>
      <Typography variant="h4">
        Splice Video
      </Typography>
      <Button onClick={handleSelectVideo} variant='contained'>
        Select Video
      </Button>
      <Button onClick={handleSpliceVideo} disabled={!selectedVideo}>
        Splice Video
      </Button>
      <Container maxWidth='md'>
        {
          selectedVideo && (
            <video id='splice-video' controls key={selectedVideo} style={{ width: '100%' }}>
              <source src={`media-loader://${selectedVideo}`} />
            </video>
          )
        }
      </Container>
      <Button onClick={handleAddSplicePoint} disabled={!selectedVideo}>
        Add Splice Point
      </Button>
      {
        splicePoints && splicePoints.map((splicePoint) => (
          <Box>
            <Typography variant="body1">
              {splicePoint}
            </Typography>
            <Button onClick={() => handleGoToSplicePoint(splicePoint)}>
              Go to Splice Point
            </Button>
            <Button color='error' onClick={() => handleRemoveSplicePoint(splicePoint)}>
              Remove
            </Button>
          </Box>
        ))
      }
    </Box>
  )
}

export default SpliceVideo
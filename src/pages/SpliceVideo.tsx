import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, Button, Container, Typography, Stack, Grid } from '@mui/material'
import { FC, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import Progress from '@/components/SpliceVideo/Progress'

const SpliceVideo: FC = () => {
  const { selectedVideo, updateSelectedVideo, splicePoints, updateSplicePoints } = useSpliceVideo()

  const handleSelectVideo = () => {
    ipcRenderer.send('select-splice-video-file')

  }

  const handleAddSplicePoint = () => {
    // get current time of video
    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    const splicePoint = video.currentTime

    updateSplicePoints(splicePoints.length === 0 ? [splicePoint] : [...splicePoints, splicePoint].sort((a, b) => a - b))
  }

  const handleRemoveSplicePoint = (splicePoint: number) => {
    updateSplicePoints(splicePoints.length == 0 ? [] : splicePoints.filter((point) => point !== splicePoint))
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
    ipcRenderer.on('selected-splice-video-file', (_, path) => {
      updateSelectedVideo(path)
    })

    ipcRenderer.on('spliced-video', (_, path) => {
      updateSelectedVideo(path)
    })

    return () => {
      ipcRenderer.removeAllListeners('selected-splice-video-file')
      ipcRenderer.removeAllListeners('spliced-video')
    }
  }, [])

  return (
    <>
      <Box>
        <Stack flexWrap='wrap' direction='row' justifyContent='space-between' width='100%' mb={2} gap={2} alignItems='center'>
          <Typography variant="h4">
            Splice Video
          </Typography>
          <Box>
            <Button onClick={handleSelectVideo} variant='contained'>
              Select Video
            </Button>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {
              selectedVideo && (
                <video id='splice-video' controls key={selectedVideo} style={{ width: '100%' }}>
                  <source src={`media-loader://${selectedVideo}`} />
                </video>
              )
            }
          </Grid>
          <Grid item xs={12} md={6}>
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
          </Grid>
        </Grid>
      </Box>
      <Progress />
    </>
  )
}

export default SpliceVideo
import { FC } from 'react'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Add, Delete } from '@mui/icons-material'

const SplicePoints: FC = () => {
  const { selectedVideo, splicePoints, addSplicePoint, deleteSplicePoint } = useSpliceVideo()

  const handleAddSplicePoint = () => {
    // get current time of video
    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    addSplicePoint(video.currentTime)
  }

  const handleGoToSplicePoint = (splicePoint: number) => {
    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    video.currentTime = splicePoint
  }

  return (
    <>
      <Button
        onClick={handleAddSplicePoint}
        disabled={!selectedVideo}
        startIcon={<Add />}
        sx={{
          mb: 2
        }}
      >
        Add Splice Point
      </Button>
      {
        splicePoints && splicePoints.map(([start, end]) => (
          <Stack key={`${start}-${end}`} direction='row' justifyContent='space-between' alignItems='center' mb={2} ml={{
            xs: 0,
            md: 1.5,
          }}>
            <Typography variant="body1">
              {start} - {end}
            </Typography>
            <IconButton color='error' onClick={() => deleteSplicePoint([start, end])}>
              <Delete />
            </IconButton>
          </Stack>
        ))
      }
    </>
  )
}

export default SplicePoints
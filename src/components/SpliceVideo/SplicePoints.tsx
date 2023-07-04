import { FC } from 'react'
import { Box, Button, Typography } from '@mui/material'
import useSpliceVideo from '@/hooks/useSpliceVideo'

const SplicePoints: FC = () => {
  const { selectedVideo, splicePoints, updateSplicePoints } = useSpliceVideo()

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

  return (
    <>
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
    </>
  )
}

export default SplicePoints
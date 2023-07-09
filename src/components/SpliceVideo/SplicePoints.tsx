import { FC, useMemo } from 'react'
import { Box, Button, IconButton, Input, Stack, Typography } from '@mui/material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Add, Delete } from '@mui/icons-material'

const SplicePoints: FC = () => {
  const { selectedVideo, splicePoints, addSplicePoint, deleteSplicePoint, modifySplicePoint } = useSpliceVideo()

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

  // handle setting startpoint; make sure it's not after the end point
  const handleSetStartPoint = (splicePoint: [number, number]) => {
    const [_, endPoint] = splicePoint

    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    const newStartPoint = video.currentTime

    if (newStartPoint > endPoint) {
      return
    }

    modifySplicePoint(splicePoint, [newStartPoint, endPoint])
  }

  // handle setting endpoint; make sure it's not before the start point
  const handleSetEndPoint = (splicePoint: [number, number]) => {
    const [startPoint, _] = splicePoint

    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    const newEndPoint = video.currentTime

    if (newEndPoint < startPoint) {
      return
    }

    modifySplicePoint(splicePoint, [startPoint, newEndPoint])
  }

  const videoDuration = useMemo(() => {
    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return 0
    }

    return video.duration
  }, [selectedVideo])

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
      <Box
        style={{
          height: 'calc(100vh - 64px - 128px - 64px)',
          overflowY: 'scroll'
        }}
      >
        {
          splicePoints && splicePoints.map(([start, end]) => (
            <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2} ml={{
              xs: 0,
              md: 1.5,
            }}>
              <Stack direction='row' alignItems='center' spacing={2}>
                <Stack alignItems='center'>
                  <Input
                    type='number'
                    value={start}
                    componentsProps={{
                      input: {
                        min: 0,
                        max: end,
                      }
                    }}
                    fullWidth
                    onChange={(e) => {
                      const newStart = Number(e.target.value)

                      if (newStart > end || newStart < 0) {
                        return
                      }

                      modifySplicePoint([start, end], [newStart, end])
                    }}
                  />
                  <Button onClick={() => handleSetStartPoint([start, end])}>
                    Set Current
                  </Button>
                  <Button onClick={() => handleGoToSplicePoint(start)}>
                    Go to Time
                  </Button>
                </Stack>
                <Stack alignItems='center'>
                  <Input
                    type='number'
                    value={end}
                    componentsProps={{
                      input: {
                        min: start,
                        max: videoDuration,
                      }
                    }}
                    fullWidth
                    onChange={(e) => {
                      const newEnd = Number(e.target.value)

                      if (newEnd > videoDuration || newEnd < start) {
                        return
                      }

                      modifySplicePoint([start, end], [start, newEnd])
                    }}
                  />
                  <Button onClick={() => handleSetEndPoint([start, end])}>
                    Set Current
                  </Button>
                  <Button onClick={() => handleGoToSplicePoint(end)}>
                    Go to Time
                  </Button>
                </Stack>
              </Stack>
              <IconButton color='error' onClick={() => deleteSplicePoint([start, end])}>
                <Delete />
              </IconButton>
            </Stack>
          ))
        }
      </Box>
    </>
  )
}

export default SplicePoints
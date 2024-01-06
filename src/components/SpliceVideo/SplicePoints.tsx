import { FC, useMemo } from 'react'
import { Box, Button, IconButton, Input, InputLabel, Stack } from '@mui/material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Add, Delete } from '@mui/icons-material'

const SplicePoints: FC = () => {
  const { selectedVideo, splicePoints, addSplicePoint, deleteSplicePoint, modifySplicePoint, videoRef, videoFramerate } = useSpliceVideo()

  const handleAddSplicePoint = () => {
    if (!videoRef) {
      return
    }

    addSplicePoint(videoRef.currentTime)
  }

  const handleGoToSplicePoint = (splicePoint: number) => {
    if (!videoRef) {
      return
    }

    videoRef.currentTime = splicePoint
  }

  // handle setting startpoint; make sure it's not after the end point
  const handleSetStartPoint = (splicePoint: [number, number]) => {
    const [_, endPoint] = splicePoint

    if (!videoRef) {
      return
    }

    const newStartPoint = videoRef.currentTime

    if (newStartPoint > endPoint) {
      return
    }

    modifySplicePoint(splicePoint, [newStartPoint, endPoint])
  }

  // handle setting endpoint; make sure it's not before the start point
  const handleSetEndPoint = (splicePoint: [number, number]) => {
    const [startPoint, _] = splicePoint

    if (!videoRef) {
      return
    }

    const newEndPoint = videoRef.currentTime

    if (newEndPoint < startPoint) {
      return
    }

    modifySplicePoint(splicePoint, [startPoint, newEndPoint])
  }

  const videoDuration = useMemo(() => {
    return videoRef?.duration || 0
  }, [videoRef?.duration])

  const convertSecondsToHoursMinutesSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds - hours * 3600) / 60)
    const secondsLeft = seconds - hours * 3600 - minutes * 60

    return [hours, minutes, secondsLeft]
  }

  const convertSecondsToFrames = (seconds: number) => {
    return Math.floor(seconds * videoFramerate!)
  }

  const convertFramesToSeconds = (frames: number) => {
    return frames / videoFramerate!
  }

  const videoTotalFrames = useMemo(() => {
    return convertSecondsToFrames(videoDuration)
  }, [videoDuration])

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
          splicePoints && splicePoints.map(([start, end], i) => {
            const [startHours, startMinutes, startSeconds] = convertSecondsToHoursMinutesSeconds(start)
            const [endHours, endMinutes, endSeconds] = convertSecondsToHoursMinutesSeconds(end)

            const startFrames = convertSecondsToFrames(start)
            const endFrames = convertSecondsToFrames(end)

            return (
              <Stack key={i} gap={2} direction='row' justifyContent='space-between' alignItems='center' mb={2} ml={{
                xs: 0,
                md: 1.5,
              }}>
                <Stack direction='row' alignItems='center' spacing={2} width='100%'>
                  <Stack alignItems='center' width='100%'>
                    <Stack direction='row' spacing={2} width='100%'>
                      <Box width='100%'>
                        <InputLabel>Hours</InputLabel>
                        <Input
                          type='number'
                          value={startHours}
                          componentsProps={{
                            input: {
                              min: 0,
                              max: endHours,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newStartHours = Number(e.target.value)

                            if (!videoRef || newStartHours > endHours || newStartHours < 0) {
                              return
                            }

                            videoRef.currentTime = newStartHours * 3600 + startMinutes * 60 + startSeconds

                            modifySplicePoint([start, end], [newStartHours * 3600 + startMinutes * 60 + startSeconds, end])
                          }}
                        />
                      </Box>
                      <Box width='100%'>
                        <InputLabel>Minutes</InputLabel>
                        <Input
                          type='number'
                          value={startMinutes}
                          componentsProps={{
                            input: {
                              min: 0,
                              max: endMinutes,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newStartMinutes = Number(e.target.value)

                            if (!videoRef || newStartMinutes > endMinutes || newStartMinutes < 0) {
                              return
                            }

                            videoRef.currentTime = startHours * 3600 + newStartMinutes * 60 + startSeconds

                            modifySplicePoint([start, end], [startHours * 3600 + newStartMinutes * 60 + startSeconds, end])
                          }}
                        />
                      </Box>
                      <Box width='100%'>
                        <InputLabel>Seconds</InputLabel>
                        <Input
                          type='number'
                          value={startSeconds}
                          componentsProps={{
                            input: {
                              min: 0,
                              max: endSeconds,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newStartSeconds = Number(e.target.value)

                            if (!videoRef || newStartSeconds > endSeconds || newStartSeconds < 0) {
                              return
                            }

                            videoRef.currentTime = startHours * 3600 + startMinutes * 60 + newStartSeconds

                            modifySplicePoint([start, end], [startHours * 3600 + startMinutes * 60 + newStartSeconds, end])
                          }}
                        />
                      </Box>
                    </Stack>
                    <Box width='100%' mt={1}>
                      <InputLabel>Frame</InputLabel>
                      <Input
                        type='number'
                        value={startFrames}
                        componentsProps={{
                          input: {
                            min: 0,
                            max: endFrames,
                          }
                        }}
                        fullWidth
                        onChange={(e) => {
                          const newStartFrames = Number(e.target.value)
                          let newSeconds = convertFramesToSeconds(newStartFrames)

                          if (!videoRef || newStartFrames > endFrames || newStartFrames < 0) {
                            return
                          }

                          // TODO: A hack, but it works for now
                          // if newStartFrames and startFrames are the same...
                          // very slightly increment newSeconds so that the video will actually update
                          if (convertSecondsToFrames(newSeconds) === startFrames) {
                            newSeconds += 0.0001
                          }

                          videoRef.currentTime = newSeconds

                          modifySplicePoint([start, end], [newSeconds, end])
                        }}
                      />
                    </Box>
                    <Button onClick={() => handleSetStartPoint([start, end])}>
                      Set Current
                    </Button>
                    <Button onClick={() => handleGoToSplicePoint(start)}>
                      Go to Time
                    </Button>
                  </Stack>
                  <Stack alignItems='center' width='100%'>
                    <Stack direction='row' spacing={2} width='100%'>
                      <Box width='100%'>
                        <InputLabel>Hours</InputLabel>
                        <Input
                          type='number'
                          value={endHours}
                          componentsProps={{
                            input: {
                              min: startHours,
                              max: Math.floor(videoDuration / 3600),
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newEndHours = Number(e.target.value)

                            if (!videoRef || newEndHours < startHours || newEndHours > Math.floor(videoDuration / 3600)) {
                              return
                            }

                            videoRef.currentTime = newEndHours * 3600 + endMinutes * 60 + endSeconds

                            modifySplicePoint([start, end], [start, newEndHours * 3600 + endMinutes * 60 + endSeconds])
                          }}
                        />
                      </Box>
                      <Box width='100%'>
                        <InputLabel>Minutes</InputLabel>
                        <Input
                          type='number'
                          value={endMinutes}
                          componentsProps={{
                            input: {
                              min: startMinutes,
                              max: 59,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newEndMinutes = Number(e.target.value)

                            if (!video || newEndMinutes < startMinutes || newEndMinutes > 59) {
                              return
                            }

                            video.currentTime = endHours * 3600 + newEndMinutes * 60 + endSeconds

                            modifySplicePoint([start, end], [start, endHours * 3600 + newEndMinutes * 60 + endSeconds])
                          }}
                        />
                      </Box>
                      <Box width='100%'>
                        <InputLabel>Seconds</InputLabel>
                        <Input
                          type='number'
                          value={endSeconds}
                          componentsProps={{
                            input: {
                              min: startSeconds,
                              max: 59,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newEndSeconds = Number(e.target.value)

                            if (!videoRef || newEndSeconds < startSeconds || newEndSeconds > 59) {
                              return
                            }

                            videoRef.currentTime = endHours * 3600 + endMinutes * 60 + newEndSeconds

                            modifySplicePoint([start, end], [start, endHours * 3600 + endMinutes * 60 + newEndSeconds])
                          }}
                        />
                      </Box>
                    </Stack>
                    <Box width='100%' mt={1}>
                      <InputLabel>Frame</InputLabel>
                      <Input
                        type='number'
                        value={endFrames}
                        componentsProps={{
                          input: {
                            min: startFrames,
                            max: videoTotalFrames,
                          }
                        }}
                        fullWidth
                        onChange={(e) => {
                          const newEndFrames = Number(e.target.value)
                          let newSeconds = convertFramesToSeconds(newEndFrames)

                          if (!videoRef || newEndFrames < startFrames || newEndFrames > videoTotalFrames) {
                            return
                          }

                          // TODO: A hack, but it works for now
                          // if newEndFrames and endFrames are the same...
                          // very slightly increment newSeconds so that the video will actually update
                          if (convertSecondsToFrames(newSeconds) === endFrames) {
                            newSeconds += 0.0001
                          }

                          videoRef.currentTime = newSeconds

                          modifySplicePoint([start, end], [start, newSeconds])
                        }}
                      />
                    </Box>
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
            )
          })
        }
      </Box>
    </>
  )
}

export default SplicePoints
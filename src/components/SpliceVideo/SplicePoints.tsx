import { FC, useMemo } from 'react'
import { Box, Button, IconButton, Input, InputLabel, Stack, Typography } from '@mui/material'
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

  const convertHoursMinutesSecondsToSeconds = (hours: number, minutes: number, seconds: number) => {
    return hours * 3600 + minutes * 60 + seconds
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

  const verifyStartSeconds = (startSeconds: number, endSeconds: number) => {
    return (startSeconds <= endSeconds && startSeconds >= 0 && startSeconds <= videoDuration)
  }

  const verifyEndSeconds = (startSeconds: number, endSeconds: number) => {
    return (endSeconds >= startSeconds && endSeconds <= videoDuration && endSeconds >= 0)
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
      <Box
        style={{
          height: 'calc(100vh - 64px - 128px - 64px)',
          overflowY: 'auto'
        }}
      >
        {
          splicePoints && splicePoints.map(([start, end], i) => {
            const [startHours, startMinutes, startSeconds] = convertSecondsToHoursMinutesSeconds(start)
            const [endHours, endMinutes, endSeconds] = convertSecondsToHoursMinutesSeconds(end)

            const startFrames = convertSecondsToFrames(start)
            const endFrames = convertSecondsToFrames(end)

            return (
              <Stack key={i} gap={2} direction='row' justifyContent='space-between' alignItems='center' mb={4} ml={{
                xs: 0,
                md: 1.5,
              }}>
                <Stack direction='row' alignItems='center' spacing={2} width='100%'>
                  <Stack alignItems='center' width='100%' spacing={1}>
                    <Stack direction='row' spacing={2} width='100%'>
                      <Box width='100%'>
                        <InputLabel>Hours</InputLabel>
                        <Input
                          type='number'
                          value={startHours}
                          componentsProps={{
                            input: {
                              min: 0,
                              max: Math.floor(videoDuration / 3600),
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newStartHours = Number(e.target.value)

                            const newTimestamp = convertHoursMinutesSecondsToSeconds(newStartHours, startMinutes, startSeconds)

                            // check if newStartHours would make startFrames > endFrames
                            // or make the number of seconds a negative number; if so, return
                            if (!videoRef || !verifyStartSeconds(newTimestamp, end)) {
                              return
                            }

                            videoRef.currentTime = newTimestamp

                            modifySplicePoint([start, end], [newTimestamp, end])
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
                              min: -1,
                              max: 60,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newStartMinutes = Number(e.target.value)

                            const newTimestamp = convertHoursMinutesSecondsToSeconds(startHours, newStartMinutes, startSeconds)

                            // check if newStartMinutes would make startFrames > endFrames
                            // or make the number of seconds a negative number; if so, return
                            if (!videoRef || !verifyStartSeconds(newTimestamp, end)) {
                              return
                            }

                            videoRef.currentTime = newTimestamp

                            modifySplicePoint([start, end], [newTimestamp, end])
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
                              min: -1,
                              max: 60,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newStartSeconds = Number(e.target.value)

                            const newTimestamp = convertHoursMinutesSecondsToSeconds(startHours, startMinutes, newStartSeconds)

                            // check if newStartSeconds would make startFrames > endFrames
                            // or make the number of seconds a negative number; if so, return
                            if (!videoRef || !verifyStartSeconds(newTimestamp, end)) {
                              return
                            }

                            videoRef.currentTime = newTimestamp

                            modifySplicePoint([start, end], [newTimestamp, end])
                          }}
                        />
                      </Box>
                    </Stack>
                    <Box>
                      <Typography variant='caption'>
                        OR
                      </Typography>
                    </Box>
                    <Box width='100%'>
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

                          if (!videoRef || newStartFrames > endFrames) {
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
                    <Stack>
                      <Button onClick={() => handleSetStartPoint([start, end])}>
                        Set to Current Time
                      </Button>
                      <Button onClick={() => handleGoToSplicePoint(start)}>
                        Go to Time
                      </Button>
                    </Stack>
                  </Stack>
                  <Stack alignItems='center' width='100%' spacing={1}>
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

                            const newTimestamp = convertHoursMinutesSecondsToSeconds(newEndHours, endMinutes, endSeconds)

                            // check if newEndHours would make startFrames > endFrames
                            if (!videoRef || !verifyEndSeconds(start, newTimestamp)) {
                              return
                            }

                            videoRef.currentTime = newTimestamp

                            modifySplicePoint([start, end], [start, newTimestamp])
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
                              min: -1,
                              max: 60,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newEndMinutes = Number(e.target.value)

                            const newTimestamp = convertHoursMinutesSecondsToSeconds(endHours, newEndMinutes, endSeconds)

                            // check if newEndMinutes would make startFrames > endFrames
                            if (!videoRef || !verifyEndSeconds(start, newTimestamp)) {
                              return
                            }

                            videoRef.currentTime = newTimestamp

                            modifySplicePoint([start, end], [start, newTimestamp])
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
                              min: -1,
                              max: 60,
                            }
                          }}
                          fullWidth
                          onChange={(e) => {
                            const newEndSeconds = Number(e.target.value)

                            const newTimestamp = convertHoursMinutesSecondsToSeconds(endHours, endMinutes, newEndSeconds)

                            // check if newEndSeconds would make startFrames > endFrames
                            // if so, return
                            if (!videoRef || !verifyEndSeconds(start, newTimestamp)) {
                              return
                            }

                            videoRef.currentTime = newTimestamp

                            modifySplicePoint([start, end], [start, newTimestamp])
                          }}
                        />
                      </Box>
                    </Stack>
                    <Box>
                      <Typography variant='caption'>
                        OR
                      </Typography>
                    </Box>
                    <Box width='100%'>
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
                    <Stack>
                      <Button onClick={() => handleSetEndPoint([start, end])}>
                        Set to Current Time
                      </Button>
                      <Button onClick={() => handleGoToSplicePoint(end)}>
                        Go to Time
                      </Button>
                    </Stack>
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
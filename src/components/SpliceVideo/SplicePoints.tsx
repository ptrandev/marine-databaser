import { FC, useMemo } from 'react'
import { Box, Button, IconButton, Input, InputLabel, Stack, Typography } from '@mui/material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Add, Delete } from '@mui/icons-material'

const SplicePoints: FC= () => {
  const { selectedVideo, splicePoints, addSplicePoint, deleteSplicePoint, modifySplicePoint, videoRef } = useSpliceVideo()

  const video = videoRef?.current

  const handleAddSplicePoint = () => {
    if (!video) {
      return
    }

    addSplicePoint(video.currentTime)
  }

  const handleGoToSplicePoint = (splicePoint: number) => {
    if (!video) {
      return
    }

    video.currentTime = splicePoint
  }

  // handle setting startpoint; make sure it's not after the end point
  const handleSetStartPoint = (splicePoint: [number, number]) => {
    const [_, endPoint] = splicePoint

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
    return video?.duration || 0
  }, [video?.duration])

  const convertSecondsToHoursMinutesSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds - hours * 3600) / 60)
    const secondsLeft = seconds - hours * 3600 - minutes * 60

    return [hours, minutes, secondsLeft]
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
          overflowY: 'scroll'
        }}
      >
        {
          splicePoints && splicePoints.map(([start, end], i) => {
            const [startHours, startMinutes, startSeconds] = convertSecondsToHoursMinutesSeconds(start)
            const [endHours, endMinutes, endSeconds] = convertSecondsToHoursMinutesSeconds(end)

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

                            if (!video || newStartHours > endHours || newStartHours < 0) {
                              return
                            }

                            video.currentTime = newStartHours * 3600 + startMinutes * 60 + startSeconds

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

                            if (!video || newStartMinutes > endMinutes || newStartMinutes < 0) {
                              return
                            }

                            video.currentTime = startHours * 3600 + newStartMinutes * 60 + startSeconds

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

                            if (!video || newStartSeconds > endSeconds || newStartSeconds < 0) {
                              return
                            }

                            video.currentTime = startHours * 3600 + startMinutes * 60 + newStartSeconds

                            modifySplicePoint([start, end], [startHours * 3600 + startMinutes * 60 + newStartSeconds, end])
                          }}
                        />
                      </Box>
                    </Stack>
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

                        if (!video || newStart > end || newStart < 0) {
                          return
                        }

                        video.currentTime = newStart

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

                            if (!video || newEndHours < startHours || newEndHours > Math.floor(videoDuration / 3600)) {
                              return
                            }

                            video.currentTime = newEndHours * 3600 + endMinutes * 60 + endSeconds

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

                            if (!video || newEndSeconds < startSeconds || newEndSeconds > 59) {
                              return
                            }

                            video.currentTime = endHours * 3600 + endMinutes * 60 + newEndSeconds

                            modifySplicePoint([start, end], [start, endHours * 3600 + endMinutes * 60 + newEndSeconds])
                          }}
                        />
                      </Box>
                    </Stack>
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

                        if (!video || newEnd > videoDuration || newEnd < start) {
                          return
                        }

                        video.currentTime = newEnd

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
            )
          })
        }
      </Box>
    </>
  )
}

export default SplicePoints
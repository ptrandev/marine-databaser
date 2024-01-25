import { FC, useEffect, useState } from 'react'
import { Box, Button, IconButton, Input, InputLabel, Stack, Typography } from '@mui/material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Add, Check, Delete, Restore, Undo, Redo } from '@mui/icons-material'
import { Modal, ModalProps } from '../Modal'
import { convertSecondsToFrames, convertFramesToSeconds, convertHoursMinutesSecondsToSeconds, convertSecondsToHoursMinutesSeconds } from '@/utils/video'

interface DeleteModalProps extends Omit<ModalProps, 'children'> { }

const DeleteModal: FC<DeleteModalProps> = ({ open, onClose }) => {
  const { deleteAllSplicePoints } = useSpliceVideo()

  return (
    <Modal open={open} onClose={onClose}>
      <Box>
        <Typography variant='h5' mb={2}>
          Delete All Splice Points?
        </Typography>
        <Typography variant='body1' mb={2}>
          Are you sure you want to delete all splice points? This action cannot be undone.
        </Typography>
        <Stack direction='row' justifyContent='flex-end' spacing={2}>
          <Box>
            <Button onClick={onClose}>
              Cancel Deletion
            </Button>
          </Box>
          <Box>
            <Button color='error' variant='contained' onClick={() => {
              deleteAllSplicePoints()
              onClose()
            }}>
              Delete All Splice Points
            </Button>
          </Box>
        </Stack>
      </Box>
    </Modal>
  )
}

const SplicePoints: FC = () => {
  const { selectedVideo, splicePoints, initSplicePoint, videoRef, undo, redo, canUndo, canRedo } = useSpliceVideo()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleInitSplicePoint = () => {
    if (!videoRef) {
      return
    }

    initSplicePoint(videoRef.currentTime)
  }

  return (
    <>
      {
        deleteModalOpen && (
          <DeleteModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} />
        )
      }
      <Stack direction='row' flexWrap='wrap' justifyContent='space-between' alignItems='center' mb={4}>
        <Box>
          <Button
            variant='contained'
            onClick={handleInitSplicePoint}
            disabled={!selectedVideo}
            startIcon={<Add />}
            style={{
              marginRight: 8
            }}
          >
            Add Splice Point
          </Button>
          <IconButton onClick={undo} disabled={!canUndo || !selectedVideo}>
            <Undo />
          </IconButton>
          <IconButton onClick={redo} disabled={!canRedo || !selectedVideo}>
            <Redo />
          </IconButton>
        </Box>
        <Box>
          <Button
            color='error'
            disabled={!selectedVideo || splicePoints?.length === 0}
            endIcon={<Delete />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete All Splice Points
          </Button>
        </Box>
      </Stack>
      <Box
        style={{
          height: 'calc(100vh - 64px - 128px - 64px)',
          overflowY: 'auto'
        }}
      >
        {
          splicePoints && splicePoints.map(([start, end]) => {
            return <SplicePoint key={`${start}-${end}`} start={start} end={end} />
          })
        }
      </Box>
    </>
  )
}

interface SplicePointProps {
  start: number
  end: number
}

const SplicePoint: FC<SplicePointProps> = ({ start, end }) => {
  const { videoRef, videoFramerate, modifySplicePoint, deleteSplicePoint, videoDuration, videoTotalFrames, addUnsavedSplicePoint, removeUnsavedSplicePoint } = useSpliceVideo()

  const handleGoToSplicePoint = (splicePoint: number) => {
    if (!videoRef) {
      return
    }

    videoRef.currentTime = splicePoint
  }

  // handle setting startpoint; make sure it's not after the end point
  const handleSetStartPoint = () => {
    if (!videoRef) {
      return
    }

    const newStartPoint = videoRef.currentTime

    if (newStartPoint > modifiedEnd) {
      return
    }

    handleStartSecondsChange(newStartPoint)
  }

  // handle setting endpoint; make sure it's not before the start point
  const handleSetEndPoint = () => {
    if (!videoRef) {
      return
    }

    const newEndPoint = videoRef.currentTime

    if (newEndPoint < modifiedStart) {
      return
    }

    handleEndSecondsChange(newEndPoint)
  }

  const verifyStartSeconds = (startSeconds: number, endSeconds: number) => {
    return (startSeconds <= endSeconds && startSeconds >= 0 && startSeconds <= videoDuration)
  }

  const verifyEndSeconds = (startSeconds: number, endSeconds: number) => {
    return (endSeconds >= startSeconds && endSeconds <= videoDuration && endSeconds >= 0)
  }

  // keep track of the initial values for start and end
  const [startHours, startMinutes, startSeconds] = convertSecondsToHoursMinutesSeconds(start)
  const [endHours, endMinutes, endSeconds] = convertSecondsToHoursMinutesSeconds(end)
  const startFrames = convertSecondsToFrames(start, videoFramerate!)
  const endFrames = convertSecondsToFrames(end, videoFramerate!)

  // keep track of the modified values for start and end
  const [modifiedStart, setModifiedStart] = useState(start)
  const [modifiedEnd, setModifiedEnd] = useState(end)

  const [modifiedStartHours, setModifiedStartHours] = useState(startHours)
  const [modifiedStartMinutes, setModifiedStartMinutes] = useState(startMinutes)
  const [modifiedStartSeconds, setModifiedStartSeconds] = useState(startSeconds)

  const [modifiedEndHours, setModifiedEndHours] = useState(endHours)
  const [modifiedEndMinutes, setModifiedEndMinutes] = useState(endMinutes)
  const [modifiedEndSeconds, setModifiedEndSeconds] = useState(endSeconds)

  const [modifiedStartFrames, setModifiedStartFrames] = useState(startFrames)
  const [modifiedEndFrames, setModifiedEndFrames] = useState(endFrames)

  const [isModified, setIsModified] = useState<boolean>(false)

  const handleStartSecondsChange = (seconds: number) => {
    const [hours, minutes, secondsLeft] = convertSecondsToHoursMinutesSeconds(seconds)

    setModifiedStartHours(hours)
    setModifiedStartMinutes(minutes)
    setModifiedStartSeconds(secondsLeft)

    setModifiedStart(seconds)
    setModifiedStartFrames(convertSecondsToFrames(seconds, videoFramerate!))
  }

  const handleEndSecondsChange = (seconds: number) => {
    const [hours, minutes, secondsLeft] = convertSecondsToHoursMinutesSeconds(seconds)

    setModifiedEndHours(hours)
    setModifiedEndMinutes(minutes)
    setModifiedEndSeconds(secondsLeft)

    setModifiedEnd(seconds)
    setModifiedEndFrames(convertSecondsToFrames(seconds, videoFramerate!))
  }

  const handleResetSplicePoint = () => {
    handleStartSecondsChange(start)
    handleEndSecondsChange(end)
  }

  const handleConfirmSplicePoint = () => {
    modifySplicePoint([start, end], [modifiedStart, modifiedEnd])
  }

  useEffect(() => {
    const _isModified = start !== modifiedStart || end !== modifiedEnd

    if (_isModified) {
      addUnsavedSplicePoint([start, end])
    } else {
      removeUnsavedSplicePoint([start, end])
    }

    setIsModified(_isModified)

  }, [start, end, modifiedStart, modifiedEnd])

  return (
    <Stack gap={2} direction='row' justifyContent='space-between' alignItems='center' mb={4} ml={{
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
                value={modifiedStartHours}
                componentsProps={{
                  input: {
                    min: 0,
                    max: Math.floor(videoDuration / 3600),
                  }
                }}
                fullWidth
                onChange={(e) => {
                  const newStartHours = Number(e.target.value)

                  const newTimestamp = convertHoursMinutesSecondsToSeconds(newStartHours, modifiedStartMinutes, modifiedStartSeconds)

                  // check if newStartHours would make startFrames > endFrames
                  // or make the number of seconds a negative number; if so, return
                  if (!videoRef || !verifyStartSeconds(newTimestamp, modifiedEnd)) {
                    return
                  }

                  videoRef.currentTime = newTimestamp

                  handleStartSecondsChange(newTimestamp)
                }}
              />
            </Box>
            <Box width='100%'>
              <InputLabel>Minutes</InputLabel>
              <Input
                type='number'
                value={modifiedStartMinutes}
                componentsProps={{
                  input: {
                    min: -1,
                    max: 60,
                  }
                }}
                fullWidth
                onChange={(e) => {
                  const newStartMinutes = Number(e.target.value)

                  const newTimestamp = convertHoursMinutesSecondsToSeconds(modifiedStartHours, newStartMinutes, modifiedStartSeconds)

                  // check if newStartMinutes would make startFrames > endFrames
                  // or make the number of seconds a negative number; if so, return
                  if (!videoRef || !verifyStartSeconds(newTimestamp, modifiedEnd)) {
                    return
                  }

                  videoRef.currentTime = newTimestamp

                  handleStartSecondsChange(newTimestamp)
                }}
              />
            </Box>
            <Box width='100%'>
              <InputLabel>Seconds</InputLabel>
              <Input
                type='number'
                value={modifiedStartSeconds}
                componentsProps={{
                  input: {
                    min: -1,
                    max: 60,
                  }
                }}
                fullWidth
                onChange={(e) => {
                  const newStartSeconds = Number(e.target.value)

                  const newTimestamp = convertHoursMinutesSecondsToSeconds(modifiedStartHours, modifiedStartMinutes, newStartSeconds)

                  // check if newStartSeconds would make startFrames > endFrames
                  // or make the number of seconds a negative number; if so, return
                  if (!videoRef || !verifyStartSeconds(newTimestamp, modifiedEnd)) {
                    return
                  }

                  videoRef.currentTime = newTimestamp

                  handleStartSecondsChange(newTimestamp)
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
              value={modifiedStartFrames}
              componentsProps={{
                input: {
                  min: 0,
                  max: modifiedEndFrames,
                }
              }}
              fullWidth
              onChange={(e) => {
                const newStartFrames = Number(e.target.value)
                let newSeconds = convertFramesToSeconds(newStartFrames, videoFramerate!)

                if (!videoRef || newStartFrames > endFrames) {
                  return
                }

                // TODO: A hack, but it works for now
                // if newStartFrames and startFrames are the same...
                // very slightly increment newSeconds so that the video will actually update
                if (convertSecondsToFrames(newSeconds, videoFramerate!) === modifiedStartFrames) {
                  newSeconds += 0.0001
                }

                videoRef.currentTime = newSeconds

                handleStartSecondsChange(newSeconds)
              }}
            />
          </Box>
          <Stack>
            <Button onClick={handleSetStartPoint}>
              Set to Current Time
            </Button>
            <Button onClick={() => handleGoToSplicePoint(modifiedStart)}>
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
                value={modifiedEndHours}
                componentsProps={{
                  input: {
                    min: modifiedStartHours,
                    max: Math.floor(videoDuration / 3600),
                  }
                }}
                fullWidth
                onChange={(e) => {
                  const newEndHours = Number(e.target.value)

                  const newTimestamp = convertHoursMinutesSecondsToSeconds(newEndHours, modifiedEndMinutes, modifiedEndSeconds)

                  // check if newEndHours would make startFrames > endFrames
                  if (!videoRef || !verifyEndSeconds(modifiedStart, newTimestamp)) {
                    return
                  }

                  videoRef.currentTime = newTimestamp

                  handleEndSecondsChange(newTimestamp)
                }}
              />
            </Box>
            <Box width='100%'>
              <InputLabel>Minutes</InputLabel>
              <Input
                type='number'
                value={modifiedEndMinutes}
                componentsProps={{
                  input: {
                    min: -1,
                    max: 60,
                  }
                }}
                fullWidth
                onChange={(e) => {
                  const newEndMinutes = Number(e.target.value)

                  const newTimestamp = convertHoursMinutesSecondsToSeconds(modifiedEndHours, newEndMinutes, modifiedEndSeconds)

                  // check if newEndMinutes would make startFrames > endFrames
                  if (!videoRef || !verifyEndSeconds(modifiedStart, newTimestamp)) {
                    return
                  }

                  videoRef.currentTime = newTimestamp

                  handleEndSecondsChange(newTimestamp)
                }}
              />
            </Box>
            <Box width='100%'>
              <InputLabel>Seconds</InputLabel>
              <Input
                type='number'
                value={modifiedEndSeconds}
                componentsProps={{
                  input: {
                    min: -1,
                    max: 60,
                  }
                }}
                fullWidth
                onChange={(e) => {
                  const newEndSeconds = Number(e.target.value)

                  const newTimestamp = convertHoursMinutesSecondsToSeconds(modifiedEndHours, modifiedEndMinutes, newEndSeconds)

                  // check if newEndSeconds would make startFrames > endFrames
                  // if so, return
                  if (!videoRef || !verifyEndSeconds(modifiedStart, newTimestamp)) {
                    return
                  }

                  videoRef.currentTime = newTimestamp

                  handleEndSecondsChange(newTimestamp)
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
              value={modifiedEndFrames}
              componentsProps={{
                input: {
                  min: modifiedStartFrames,
                  max: videoTotalFrames,
                }
              }}
              fullWidth
              onChange={(e) => {
                const newEndFrames = Number(e.target.value)
                let newSeconds = convertFramesToSeconds(newEndFrames, videoFramerate!)

                if (!videoRef || newEndFrames < modifiedStartFrames || newEndFrames > videoTotalFrames) {
                  return
                }

                // TODO: A hack, but it works for now
                // if newEndFrames and endFrames are the same...
                // very slightly increment newSeconds so that the video will actually update
                if (convertSecondsToFrames(newSeconds, videoFramerate!) === modifiedEndFrames) {
                  newSeconds += 0.0001
                }

                videoRef.currentTime = newSeconds

                handleEndSecondsChange(newSeconds)
              }}
            />
          </Box>
          <Stack>
            <Button onClick={handleSetEndPoint}>
              Set to Current Time
            </Button>
            <Button onClick={() => handleGoToSplicePoint(modifiedEnd)}>
              Go to Time
            </Button>
          </Stack>
        </Stack>
      </Stack>
      <Stack gap={1}>
        <IconButton color='error' onClick={() => deleteSplicePoint([start, end])}>
          <Delete />
        </IconButton>
        <IconButton onClick={handleResetSplicePoint} disabled={!isModified}>
          <Restore />
        </IconButton>
        <IconButton color='success' onClick={handleConfirmSplicePoint} disabled={!isModified}>
          <Check />
        </IconButton>
      </Stack>
    </Stack>
  )
}

export default SplicePoints
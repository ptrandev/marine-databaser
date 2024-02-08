import { Box, Typography, Button, Input, InputLabel, Stack, Grid, LinearProgress, CircularProgress } from '@mui/material'
import { FC, useState, useEffect } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { AutoSpliceSettings } from '../../../shared/types'
import { ipcRenderer } from 'electron'
import { Modal, ModalProps } from '../Modal'
import { enqueueSnackbar } from 'notistack'

const DEFAULT_AUTO_SPLICE_SETTINGS: AutoSpliceSettings = {
  startSeconds: 0,
  endSeconds: 0,
  minFrequency: 0,
  maxFrequency: 20_000,
  minAmplitude: -10,
  minDuration: 0.1,
}

interface AutoSpliceModalProps extends Omit<ModalProps, 'children'> {
  autoSpliceSettings: AutoSpliceSettings
}

const AutoSpliceModal: FC<AutoSpliceModalProps> = ({ open, onClose, autoSpliceSettings }) => {
  const { selectedVideo, loadSpliceRegions } = useSpliceVideo()

  const [isDisabled, setIsDisabled] = useState(true)
  const [isSplicing, setIsSplicing] = useState(false)

  const [splicingProgress, setSplicingProgress] = useState(0)

  const handleAutoSplice = () => {
    setIsSplicing(true)

    ipcRenderer.send('auto-splice', {
      videoPath: selectedVideo,
      autoSpliceSettings,
    })

    ipcRenderer.once('auto-spliced', (_, spliceRegions) => {
      loadSpliceRegions(spliceRegions)
      setIsSplicing(false)
      onClose()
    })

    ipcRenderer.on('auto-spliced-progress', (_, progress) => {
      // turn from fraction to percentage out of 100
      setSplicingProgress(progress * 100)
    })

    ipcRenderer.once('auto-splice-error', () => {
      setIsSplicing(false)
      onClose()
    })
  }

  useEffect(() => {
    // enable the confirm button after 2 seconds
    const timeout = setTimeout(() => {
      setIsDisabled(false)
    }, 2000)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose}>
      <Typography variant='h5'>
        Are you sure you want to auto splice?
      </Typography>
      <Typography my={2}>
        This will automatically find all parts of the video containing audio within the specified frequency range and amplitude range. if a silence is detected for longer than the specified duration, it will be considered a splice region.
        <br /> <br />
        This will override any existing splice regions. This action cannot be undone.
        <br /> <br />
        The confirm button will be enabled after 2 seconds to prevent accidental splicing.
      </Typography>
      <Stack direction='row' justifyContent='flex-end' gap={2}>
        <Box>
          <Button onClick={onClose}>
            Cancel
          </Button>
        </Box>
        <Box>
          <Button onClick={handleAutoSplice} variant='contained' disabled={isDisabled || isSplicing}>
            Confirm
          </Button>
        </Box>
      </Stack>
      {
        isSplicing && (
          <Stack direction='row' alignItems='center' spacing={2} mt={2}>
            <CircularProgress size={20} />
            <LinearProgress variant='determinate' value={splicingProgress} sx={{ flexGrow: 1 }} />
            <Typography variant='body2' textAlign='center'>
              {splicingProgress.toFixed(2)}%
            </Typography>
          </Stack>
        )
      }
    </Modal>
  )
}

const AutoSplice: FC = () => {
  const { videoDuration } = useSpliceVideo()

  const [autoSpliceSettings, setAutoSpliceSettings] = useState(DEFAULT_AUTO_SPLICE_SETTINGS)

  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  useEffect(() => {
    setAutoSpliceSettings({
      ...autoSpliceSettings,
      endSeconds: videoDuration!,
    })
  }, [videoDuration])

  useEffect(() => {
    ipcRenderer.on('auto-splice-error', (_, errMessage) => {
      enqueueSnackbar(errMessage, { variant: 'error' })
    })

    return () => {
      ipcRenderer.removeAllListeners('auto-spliced')
      ipcRenderer.removeAllListeners('auto-spliced-progress')
      ipcRenderer.removeAllListeners('auto-splice-error')
    }
  }, [])

  return (
    <>
      <Stack spacing={2}>
        <Typography variant='h6'>
          Auto Splice (Experimental)
        </Typography>
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={4}>
              <InputLabel>Start Time (s)</InputLabel>
              <Input
                type='number'
                value={autoSpliceSettings.startSeconds}
                onChange={(e) => setAutoSpliceSettings({
                  ...autoSpliceSettings,
                  startSeconds: Number(e.target.value),
                })}
                componentsProps={{
                  input: {
                    min: 0,
                    max: autoSpliceSettings.endSeconds,
                  }
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <InputLabel>End Time (s)</InputLabel>
              <Input
                type='number'
                value={autoSpliceSettings.endSeconds}
                onChange={(e) => setAutoSpliceSettings({
                  ...autoSpliceSettings,
                  endSeconds: Number(e.target.value),
                })}
                componentsProps={{
                  input: {
                    min: autoSpliceSettings.startSeconds,
                    max: videoDuration!,
                  }
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <InputLabel>Min Frequency (Hz)</InputLabel>
              <Input
                type='number'
                value={autoSpliceSettings.minFrequency}
                onChange={(e) => setAutoSpliceSettings({
                  ...autoSpliceSettings,
                  minFrequency: Number(e.target.value),
                })}
                componentsProps={{
                  input: {
                    min: 0,
                    max: autoSpliceSettings.maxFrequency,
                  }
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <InputLabel>Max Frequency (Hz)</InputLabel>
              <Input
                type='number'
                value={autoSpliceSettings.maxFrequency}
                onChange={(e) => setAutoSpliceSettings({
                  ...autoSpliceSettings,
                  maxFrequency: Number(e.target.value),
                })}
                componentsProps={{
                  input: {
                    min: autoSpliceSettings.minFrequency,
                  }
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <InputLabel>Min Amplitude (dB)</InputLabel>
              <Input
                type='number'
                value={autoSpliceSettings.minAmplitude}
                onChange={(e) => setAutoSpliceSettings({
                  ...autoSpliceSettings,
                  minAmplitude: Number(e.target.value),
                })}
                componentsProps={{
                  input: {
                    min: -145,
                    max: 0,
                  }
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <InputLabel>Min Silence Duration (s)</InputLabel>
              <Input
                type='number'
                value={autoSpliceSettings.minDuration}
                onChange={(e) => setAutoSpliceSettings({
                  ...autoSpliceSettings,
                  minDuration: Number(e.target.value),
                })}
                componentsProps={{
                  input: {
                    min: 0,
                    max: videoDuration!,
                  }
                }}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
        <Box>
          <Button variant='contained' onClick={() => setConfirmModalOpen(true)}>
            Confirm Auto Splice
          </Button>
        </Box>
      </Stack>
      {
        confirmModalOpen && (
          <AutoSpliceModal
            open={confirmModalOpen}
            onClose={() => setConfirmModalOpen(false)}
            autoSpliceSettings={autoSpliceSettings}
          />
        )
      }
    </>
  )
}

export default AutoSplice
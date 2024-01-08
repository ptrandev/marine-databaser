import { Box, Typography, Button, Input, InputLabel, Stack, Grid } from '@mui/material'
import { FC, useMemo, useState, useEffect } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { AutoSpliceSettings } from '../../../shared/types'
import { ipcRenderer } from 'electron'

const DEFAULT_AUTO_SPLICE_SETTINGS : AutoSpliceSettings = {
  startSeconds: 0,
  endSeconds: 0,
  minFrequency: 0,
  maxFrequency: 20_000,
  minAmplitude: -10,
  minDuration: 0.1,
}

const AutoSplice: FC = () => {
  const { videoRef, selectedVideo } = useSpliceVideo()

  const videoDuration = useMemo(() => {
    return videoRef?.duration || 0
  }, [videoRef?.duration])

  const [autoSpliceSettings, setAutoSpliceSettings] = useState(DEFAULT_AUTO_SPLICE_SETTINGS)

  const handleAutoSplice = () => {
    ipcRenderer.send('auto-splice', {
      videoPath: selectedVideo,
      autoSpliceSettings,
    })

    ipcRenderer.once('auto-spliced', (_, splicePoints) => {
      console.log(splicePoints)
    })
  }

  useEffect(() => {
    setAutoSpliceSettings({
      ...autoSpliceSettings,
      endSeconds: videoDuration,
    })
  }, [videoDuration])

  return (
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
                  max: videoDuration,
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
            <InputLabel>Min Duration (s)</InputLabel>
            <Input
              type='number'
              value={autoSpliceSettings.minAmplitude}
              onChange={(e) => setAutoSpliceSettings({
                ...autoSpliceSettings,
                minAmplitude: Number(e.target.value),
              })}
              componentsProps={{
                input: {
                  min: 0,
                  max: videoDuration,
                }
              }}
              fullWidth
            />
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Button variant='contained' onClick={handleAutoSplice}>
          Confirm Auto Splice
        </Button>
      </Box>
    </Stack>
  )
}

export default AutoSplice
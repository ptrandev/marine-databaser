import { Box, Typography, Button, Input, InputLabel, Stack, Grid } from '@mui/material'
import { FC, useMemo, useState, useEffect } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { AutoSpliceSettings } from '../../../shared/types'

const DEFAULT_AUTO_SPLICE_SETTINGS : AutoSpliceSettings = {
  startSeconds: 0,
  endSeconds: 0,
  minDuration: 0,
  maxDuration: 5,
  minFrequency: 0,
  maxFrequency: 20_000,
  minAmplitude: -40,
  maxAmplitude: 0,
}

const AutoSplice: FC = () => {
  const { videoRef } = useSpliceVideo()

  const videoDuration = useMemo(() => {
    return videoRef?.duration || 0
  }, [videoRef?.duration])

  const [autoSpliceSettings, setAutoSpliceSettings] = useState(DEFAULT_AUTO_SPLICE_SETTINGS)

  useEffect(() => {
    setAutoSpliceSettings({
      ...autoSpliceSettings,
      endSeconds: videoDuration,
    })
  }, [videoDuration])

  return (
    <Stack spacing={2}>
      <Typography variant='h6'>
        Auto Splice
      </Typography>
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={3}>
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
          <Grid item xs={12} md={6} lg={3}>
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
          <Grid item xs={12} md={6} lg={3}>
            <InputLabel>Min Duration (s)</InputLabel>
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
                  max: autoSpliceSettings.maxDuration,
                }
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <InputLabel>Max Duration (s)</InputLabel>
            <Input
              type='number'
              value={autoSpliceSettings.maxDuration}
              onChange={(e) => setAutoSpliceSettings({
                ...autoSpliceSettings,
                maxDuration: Number(e.target.value),
              })}
              componentsProps={{
                input: {
                  min: autoSpliceSettings.minDuration,
                  max: videoDuration,
                }
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
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
          <Grid item xs={12} md={6} lg={3}>
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
          <Grid item xs={12} md={6} lg={3}>
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
                  max: autoSpliceSettings.maxAmplitude,
                }
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <InputLabel>Max Amplitude (dB)</InputLabel>
            <Input
              type='number'
              value={autoSpliceSettings.maxAmplitude}
              onChange={(e) => setAutoSpliceSettings({
                ...autoSpliceSettings,
                maxAmplitude: Number(e.target.value),
              })}
              componentsProps={{
                input: {
                  min: autoSpliceSettings.minAmplitude,
                  max: 0,
                }
              }}
              fullWidth
            />
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Button variant='contained'>
          Confirm Auto Splice
        </Button>
      </Box>
    </Stack>
  )
}

export default AutoSplice
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, Button, Typography, Stack, Grid } from '@mui/material'
import { FC, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import Progress from '@/components/SpliceVideo/Progress'
import SplicePoints from '@/components/SpliceVideo/SplicePoints'
import VideoControls from '@/components/SpliceVideo/VideoControls'
import AutoSplice from '@/components/SpliceVideo/AutoSplice'
import SaveProject from '@/components/SpliceVideo/SaveProject'
import LoadProject from '@/components/SpliceVideo/LoadProject'
import AudioVisualizers from '@/components/SpliceVideo/AudioVisualizers'

const SpliceVideo: FC = () => {
  const { updateSelectedVideo, selectedVideo } = useSpliceVideo()

  const handleSelectVideo = () => {
    ipcRenderer.send('select-splice-video-file')
    ipcRenderer.once('selected-splice-video-file', (_, path) => {
      if (!path) return

      updateSelectedVideo(path)
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('selected-splice-video-file')
    }
  }, [])

  return (
    <>
      <Box>
        <Stack flexWrap='wrap' direction='row' justifyContent='space-between' width='100%' mb={2} gap={2} alignItems='center'>
          <Typography variant="h4">
            Splice Video
          </Typography>
          <Stack direction='row' gap={1}>
            <Box>
              <SaveProject />
            </Box>
            <Box>
              <LoadProject />
            </Box>
            <Box>
              <Button onClick={handleSelectVideo} variant='contained'>
                Select Video
              </Button>
            </Box>
          </Stack>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}
            style={{
              height: 'calc(100vh - 64px - 128px - 8px)',
              overflowY: 'auto',
            }}
          >
            {
              selectedVideo &&
              <Stack spacing={2}>
                <VideoControls />
                <AudioVisualizers />
                <AutoSplice />
              </Stack>
            }
          </Grid>
          <Grid item xs={12} md={6}>
            <SplicePoints />
          </Grid>
        </Grid>
      </Box>
      <Progress />
    </>
  )
}

export default SpliceVideo
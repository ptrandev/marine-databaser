import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, Button, Typography, Stack, Grid } from '@mui/material'
import { type FC, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import Progress from '@/components/SpliceVideo/Progress'
import SpliceRegions from '@/components/SpliceVideo/SpliceRegions'
import VideoControls from '@/components/SpliceVideo/VideoControls'
import AutoSplice from '@/components/SpliceVideo/AutoSplice'
import SaveProject from '@/components/SpliceVideo/SaveProject'
import LoadProject from '@/components/SpliceVideo/LoadProject'
import AudioVisualizers from '@/components/SpliceVideo/AudioVisualizers'
import ConvertVideoModal from '@/components/SpliceVideo/ConvertVideoModal'
import { enqueueSnackbar } from 'notistack'

const SpliceVideo: FC = () => {
  const { updateSelectedVideo, selectedVideo } = useSpliceVideo()

  const handleSelectVideo = (): void => {
    ipcRenderer.send('select-splice-video-file')
  }

  useEffect(() => {
    ipcRenderer.on('selected-splice-video-file', (_, path: string) => {
      if (!path) return

      updateSelectedVideo(path)
    })

    ipcRenderer.on('selected-splice-video-file-error', (_, error: string) => {
      enqueueSnackbar(error, { variant: 'error' })
    })

    return () => {
      ipcRenderer.removeAllListeners('selected-splice-video-file')
      ipcRenderer.removeAllListeners('selected-splice-video-file-error')
    }
  }, [])

  return (
    <>
      <Box>
        <Stack flexWrap='wrap' direction='row' justifyContent='space-between' width='100%' mb={2} gap={2} alignItems='center'>
          <Typography variant="h4">
            Splice Video
          </Typography>
          <Stack direction='row'>
            <Box>
              <SaveProject />
            </Box>
            <Box>
              <LoadProject />
            </Box>
            <Box ml={1}>
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
              overflowY: 'auto'
            }}
          >
            {
              selectedVideo &&
              <Stack spacing={2}>
                <VideoControls />
                <AutoSplice />
              </Stack>
            }
          </Grid>
          <Grid item xs={12} md={6}>
            <SpliceRegions />
            <AudioVisualizers />
          </Grid>
        </Grid>
      </Box>
      <Progress />
      <ConvertVideoModal />
    </>
  )
}

export default SpliceVideo

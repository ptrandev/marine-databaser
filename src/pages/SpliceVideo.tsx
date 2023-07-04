import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, Button, Typography, Stack, Grid } from '@mui/material'
import { FC, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import Progress from '@/components/SpliceVideo/Progress'
import SplicePoints from '@/components/SpliceVideo/SplicePoints'

const SpliceVideo: FC = () => {
  const { selectedVideo, updateSelectedVideo, updateSplicePoints } = useSpliceVideo()

  const handleSelectVideo = () => {
    ipcRenderer.send('select-splice-video-file')
  }

  useEffect(() => {
    ipcRenderer.on('selected-splice-video-file', (_, path) => {
      updateSelectedVideo(path)
    })

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
          <Box>
            <Button onClick={handleSelectVideo} variant='contained'>
              Select Video
            </Button>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {
              selectedVideo && (
                <video id='splice-video' controls key={selectedVideo} style={{ width: '100%' }}>
                  <source src={`media-loader://${selectedVideo}`} />
                </video>
              )
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
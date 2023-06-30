import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Box, Button, Typography } from '@mui/material'
import { FC, useEffect } from 'react'
import { ipcRenderer } from 'electron'

const SpliceVideo: FC = () => {
  const { selectedVideo, updateSelectedVideo } = useSpliceVideo()

  const handleSelectVideo = () => {
    ipcRenderer.send('select-splice-video-file')

    ipcRenderer.on('selected-splice-video-file', (_, path) => {
      updateSelectedVideo(path)
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('selected-splice-video-file')
    }
  }, [])

  return (
    <Box>
      <Typography variant="h4">
        Splice Video
      </Typography>
      <Button onClick={handleSelectVideo}>
        Select Video
      </Button>
      <Typography>
        {selectedVideo}
      </Typography>
    </Box>
  )
}

export default SpliceVideo
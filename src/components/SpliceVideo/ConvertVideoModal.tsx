import { type FC, useEffect, useState } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import Modal from '../Modal'
import { Typography, Stack, Box, Button, CircularProgress, LinearProgress } from '@mui/material'
import { ipcRenderer } from 'electron'

const ConvertVideoModal: FC = () => {
  const { videoRef, selectedVideo, updateVideoUrl } = useSpliceVideo()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    if (!videoRef) {
      return
    }

    videoRef.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      videoRef.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [videoRef])

  const handleLoadedMetadata = (): void => {
    if (!videoRef) {
      return
    }

    if (videoRef.videoHeight === 0 && videoRef.videoWidth === 0) {
      setIsModalOpen(true)
    }
  }

  const onClose = (): void => {
    setIsModalOpen(false)
  }

  const handleConvertVideo = (): void => {
    ipcRenderer.send('convert-video', { videoPath: selectedVideo })
    setIsConverting(true)
  }

  useEffect(() => {
    ipcRenderer.on('converted-video', (_, videoPath: string) => {
      setIsModalOpen(false)
      setIsConverting(false)
      updateVideoUrl(videoPath)
    })

    ipcRenderer.on('convert-video-error', (_, errorMessage: string) => {
      setIsModalOpen(false)
      setIsConverting(false)
      console.error('Error converting video', errorMessage)
    })

    ipcRenderer.on('convert-video-progress', (_, progress: number) => {
      setProgress(Math.min(progress, 100))
    })

    return () => {
      ipcRenderer.removeAllListeners('converted-video')
      ipcRenderer.removeAllListeners('convert-video-progress')
      ipcRenderer.removeAllListeners('convert-video-error')
    }
  }, [])

  return (
    <Modal open={isModalOpen} onClose={onClose}>
      <Typography variant='h5' mb={2}>
        Convert Video
      </Typography>
      <Typography mb={2}>
        The video is not compatible with the program. As a result, it cannot be displayed. Would you like to convert it to a compatible format? This will not destroy the original video file.
      </Typography>
      <Stack direction='row' justifyContent='flex-end' gap={2}>
        <Box>
          <Button onClick={onClose}>
            Cancel
          </Button>
        </Box>
        <Box>
          <Button variant='contained' color='primary' onClick={handleConvertVideo}>
            Convert Video
          </Button>
        </Box>
      </Stack>
      {
        isConverting && (
          <Stack direction='row' alignItems='center' spacing={2} mt={2}>
            <CircularProgress size={20} />
            <LinearProgress variant='determinate' value={progress} sx={{ flexGrow: 1 }} />
            <Typography variant='body2' textAlign='center'>
              {progress.toFixed(2)}%
            </Typography>
          </Stack>
        )
      }
    </Modal>
  )
}

export default ConvertVideoModal

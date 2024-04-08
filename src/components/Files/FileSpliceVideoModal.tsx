import { type FC } from 'react'
import Modal, { type ModalProps } from '@/components/Modal'
import { Box, Button, Typography } from '@mui/material'
import { type FileWithMetadata } from 'shared/types'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { useNavigate } from 'react-router-dom'

interface FileSpliceVideoModalProps extends ModalProps {
  file: FileWithMetadata
}

const FileSpliceVideoModal: FC<Omit<FileSpliceVideoModalProps, 'children'>> = ({ open, onClose, file }) => {
  const navigate = useNavigate()

  const { updateSelectedVideo } = useSpliceVideo()

  const handleSpliceVideo = (): void => {
    onClose()

    updateSelectedVideo(file.path)
    navigate('/splice-video')
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box>
        <Typography variant='h4' gutterBottom>
          Splice Video
        </Typography>
        <Typography variant='body1' gutterBottom>
          There is currently a video project being spliced. Would you like to overwrite the current project and start a new one?
        </Typography>
        <Box display='flex' justifyContent='flex-end'>
          <Button onClick={onClose}>
            No
          </Button>
          <Button onClick={handleSpliceVideo} variant='contained'>
            Yes
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default FileSpliceVideoModal
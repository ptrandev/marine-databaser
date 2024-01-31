import { FC, useState } from 'react'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Add, Delete, Undo, Redo } from '@mui/icons-material'
import { Modal, ModalProps } from '../Modal'

interface DeleteModalProps extends Omit<ModalProps, 'children'> { }

const DeleteModal: FC<DeleteModalProps> = ({ open, onClose }) => {
  const { deleteAllSpliceRegions } = useSpliceVideo()

  return (
    <Modal open={open} onClose={onClose}>
      <Box>
        <Typography variant='h5' mb={2}>
          Delete All Splice Regions?
        </Typography>
        <Typography variant='body1' mb={2}>
          Are you sure you want to delete all splice regions? This action cannot be undone.
        </Typography>
        <Stack direction='row' justifyContent='flex-end' spacing={2}>
          <Box>
            <Button onClick={onClose}>
              Cancel Deletion
            </Button>
          </Box>
          <Box>
            <Button color='error' variant='contained' onClick={() => {
              deleteAllSpliceRegions()
              onClose()
            }}>
              Delete All Splice Regions
            </Button>
          </Box>
        </Stack>
      </Box>
    </Modal>
  )
}

const SpliceRegions: FC = () => {
  const { selectedVideo, spliceRegions, initSpliceRegion, videoRef, undo, redo, canUndo, canRedo } = useSpliceVideo()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleInitSpliceRegion = () => {
    if (!videoRef) {
      return
    }

    initSpliceRegion(videoRef.currentTime)
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
            onClick={handleInitSpliceRegion}
            disabled={!selectedVideo}
            startIcon={<Add />}
            style={{
              marginRight: 8
            }}
          >
            Add Splice Region
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
            disabled={!selectedVideo || spliceRegions?.length === 0}
            endIcon={<Delete />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete All Splice Regions
          </Button>
        </Box>
      </Stack>
    </>
  )
}

export default SpliceRegions
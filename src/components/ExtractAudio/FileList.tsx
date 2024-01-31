import { FC, useState } from 'react'
import { Virtuoso } from "react-virtuoso"
import { List, ListItem, ListItemText, Typography, IconButton, Stack, Button, Box } from '@mui/material'
import { Delete } from '@mui/icons-material'
import useExtractAudio from '@/hooks/useExtractAudio'
import Modal from '../Modal'

const FileList: FC = () => {
  const { selectedFiles, deleteSelectedFiles, isExtractingAudio } = useExtractAudio()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = () => {
    deleteSelectedFiles(selectedFiles)
    setShowDeleteModal(false)
  }

  return (
    <>
      <List>
        <ListItem
          sx={{
            mb: 2,
          }}
          secondaryAction={
            <IconButton
              color='error'
              onClick={() => setShowDeleteModal(true)}
              disabled={isExtractingAudio || selectedFiles.length === 0}
            >
              <Delete />
            </IconButton>
          }
        />
        <Virtuoso
          style={{ height: 'calc(100vh - 64px - 128px - 32px)' }}
          data={selectedFiles}
          itemContent={(_, file) => (
            <ListItem
              key={file}
              secondaryAction={
                <IconButton color='error' onClick={() => deleteSelectedFiles([file])} disabled={isExtractingAudio}>
                  <Delete />
                </IconButton>
              }
            >
              <ListItemText
                primary={<Typography noWrap>{file}</Typography>}
              />
            </ListItem>
          )}
        />
      </List>
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <Stack spacing={2}>
          <Typography variant='h5'>
            Clear Selected Files
          </Typography>
          <Typography mb={2}>
            Are you sure you want to clear the selected files? This action cannot be undone.
          </Typography>
          <Stack direction='row' justifyContent='flex-end' spacing={2}>
            <Box>
              <Button onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </Box>
            <Box>
              <Button onClick={handleDelete} variant='contained' color='error'>
                Clear Selected Files
              </Button>
            </Box>
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}

export default FileList
import { type FC, useState, useEffect } from 'react'
import { Box, Button, Typography, Stack } from '@mui/material'
import { Delete } from '@mui/icons-material'
import Modal from '../Modal'
import { ipcRenderer } from 'electron'
import { enqueueSnackbar } from 'notistack'
import useFiles from '@/hooks/useFiles'
import useDirectories from '@/hooks/useDirectories'

const ResetDatabase: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  return (
    <>
      <Box>
        <Typography variant='h6'>
          Reset Database
        </Typography>
        <Typography>
          This will reset the database. This will delete all data in the database. This will not delete any media files. This is a destructive operation. It is recommended that you export your database before performing this operation. This operation cannot be undone.
        </Typography>
      </Box>

      <Box>
        <Button variant='contained' color='error' startIcon={<Delete />} onClick={() => { setIsModalOpen(true) }}>
          Reset Database
        </Button>
      </Box>

      {isModalOpen && <ResetDatabaseModal open={isModalOpen} onClose={() => { setIsModalOpen(false) }} />}
    </>
  )
}

interface ResetDatabaseModalProps {
  open: boolean
  onClose: () => void
}

const ResetDatabaseModal: FC<ResetDatabaseModalProps> = ({ open, onClose }) => {
  const [isDisabled, setIsDisabled] = useState(true)

  const { loadFiles } = useFiles()
  const { loadDirectories } = useDirectories()

  const handleResetDatabase = (): void => {
    setIsDisabled(true)
    ipcRenderer.send('database-reset')
  }

  const handleDatabaseResetSuccess = (): void => {
    enqueueSnackbar('Database reset successfully.', { variant: 'success' })

    void loadFiles()
    void loadDirectories()

    onClose()
  }

  const handleDatabaseResetError = (): void => {
    enqueueSnackbar('An error occurred while resetting the database.', { variant: 'error' })
    onClose()
  }

  useEffect(() => {
    // enable the reset button after 3 seconds
    const timeout = setTimeout(() => {
      setIsDisabled(false)
    }, 3000)

    ipcRenderer.on('database-reset-success', handleDatabaseResetSuccess)
    ipcRenderer.on('database-reset-error', handleDatabaseResetError)

    return () => {
      clearTimeout(timeout)
      ipcRenderer.removeListener('database-reset-success', handleDatabaseResetSuccess)
      ipcRenderer.removeListener('database-reset-error', handleDatabaseResetError)
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose}>
      <Typography variant='h5' mb={2}>
        Reset Database
      </Typography>
      <Typography mb={2}>
        Are you sure you want to reset the database? This action cannot be undone.
      </Typography>
      <Typography mb={2}>
        The reset button will be enabled after 3 seconds to prevent accidental reset.
      </Typography>
      <Stack direction='row' justifyContent='flex-end' gap={2}>
        <Box>
          <Button onClick={onClose}>
            Cancel
          </Button>
        </Box>
        <Box>
          <Button variant='contained' color='error' disabled={isDisabled} onClick={handleResetDatabase}>
            Reset Database
          </Button>
        </Box>
      </Stack>
    </Modal>
  )
}

export default ResetDatabase

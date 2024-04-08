import { type FC, useState, useEffect, useMemo } from 'react'
import { Typography, Button, Stack, Box } from '@mui/material'
import { Modal, type ModalProps } from '../Modal'
import useDirectories from '@/hooks/useDirectories'

interface DirectoryDeleteModalProps extends Omit<ModalProps, 'children'> {
  directoryId: number
}

const DirectoryDeleteModal: FC<DirectoryDeleteModalProps> = ({
  open,
  onClose,
  directoryId
}) => {
  const { isDeletingDirectory, handleDeleteDirectory, directories } = useDirectories()

  const [isDisabled, setIsDisabled] = useState(true)

  const directoryName = useMemo(() => {
    const directory = directories?.find((directory) => directory.id === directoryId)
    return directory?.name
  }, [directories, directoryId])

  const handleDelete = async (): Promise<void> => {
    await handleDeleteDirectory(directoryId)
    onClose()
  }

  useEffect(() => {
    // enable the delete button after 3 seconds
    const timeout = setTimeout(() => {
      setIsDisabled(false)
    }, 3000)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose}>
      <Typography variant='h5' mb={2}
      >
        Delete Directory
      </Typography>
      <Typography mb={2}>
        Are you sure you want to delete <strong>{directoryName}</strong>? This will remove all files in the directory from the database, including all tags, notes, and other metadata. This action cannot be undone.
      </Typography>
      <Typography mb={2}>
        The delete button will be enabled after 3 seconds to prevent accidental deletion.
      </Typography>
      <Stack direction='row' justifyContent='flex-end' gap={2}>
        <Box>
          <Button onClick={onClose}>
            Cancel Deletion
          </Button>
        </Box>
        <Box>
          <Button onClick={() => { void handleDelete() }} disabled={isDeletingDirectory || isDisabled} variant='contained' color='error'>
            Delete Directory
          </Button>
        </Box>
      </Stack>
    </Modal>
  )
}

export default DirectoryDeleteModal

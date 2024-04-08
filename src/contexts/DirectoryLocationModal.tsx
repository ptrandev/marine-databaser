import { type FC, useEffect, useState } from 'react'
import Modal, { type ModalProps } from '../components/Modal'
import { Typography, Grid, Box, Button, CircularProgress } from '@mui/material'
import { ipcRenderer } from 'electron'
import { enqueueSnackbar } from 'notistack'
import useDirectories from '@/hooks/useDirectories'

interface DirectoryLocationModalProps extends Omit<ModalProps, 'children'> {
  directoryId: number
}

const DirectoryLocationModal: FC<DirectoryLocationModalProps> = ({
  open,
  onClose,
  directoryId
}) => {
  const { loadDirectories, handleSetDirectoryLocation } = useDirectories()

  const [isSettingDirectoryLocation, setIsSettingDirectoryLocation] = useState<boolean>(false)

  const _handleSetDirectoryLocation = (): void => {
    setIsSettingDirectoryLocation(true)
    ipcRenderer.send('set-directory-location', { directoryId })
  }

  const handleSetDirectoryLocationSuccess = (): void => {
    enqueueSnackbar('New directory location set successfully.', { variant: 'success' })
    setIsSettingDirectoryLocation(false)
    handleSetDirectoryLocation(null)
    void loadDirectories()
  }

  const handleSetDirectoryLocationError = (_: unknown, errMessage: string): void => {
    enqueueSnackbar(errMessage, { variant: 'error' })
    setIsSettingDirectoryLocation(false)
    handleSetDirectoryLocation(null)
  }

  useEffect(() => {
    ipcRenderer.on('set-directory-location-success', handleSetDirectoryLocationSuccess)
    ipcRenderer.on('set-directory-location-error', handleSetDirectoryLocationError)

    return () => {
      ipcRenderer.removeListener('set-directory-location-success', handleSetDirectoryLocationSuccess)
      ipcRenderer.removeListener('set-directory-location-error', handleSetDirectoryLocationError)
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose} disableClose={isSettingDirectoryLocation}>
      <Typography variant="h5" mb={2}>
        Set Directory Location
      </Typography>
      <Typography mb={2}>
        If the directory has been moved, you can set the new location. This will update the directory&apos;s location in the database. This will also update the files tracked by the database. If any files have been removed from the directory, they will be removed from the database as well.
      </Typography>
      <Typography mb={2}>
        This operation cannot be undone and cannot be stopped once started. It will take some time to complete. Are you sure you want to continue?
      </Typography>
      <Grid container justifyContent='flex-end' alignItems='center' mt={2}>
        <Grid item>
          <Box display='flex' gap={2}>
            {
              isSettingDirectoryLocation && (
                <CircularProgress size={24} color='primary' />
              )
            }
            <Button onClick={onClose} disabled={isSettingDirectoryLocation}>
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={_handleSetDirectoryLocation}
              disabled={isSettingDirectoryLocation}
            >
              Set New Directory Location
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Modal>
  )
}

export default DirectoryLocationModal

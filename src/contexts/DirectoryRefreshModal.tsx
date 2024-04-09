import { type FC, useEffect, useMemo, useState } from 'react'
import { Modal, type ModalProps } from '../components/Modal'
import { Typography, LinearProgress, Box, Grid, CircularProgress, Divider, Stack, Button } from '@mui/material'
import { ipcRenderer } from 'electron'
import useDirectories from '@/hooks/useDirectories'
import { type RefreshedDirectories } from 'shared/types'

interface DirectoryRefreshModalProps extends Omit<ModalProps, 'children'> {
  directoryIds: number[]
}

const DirectoryRefreshModal: FC<DirectoryRefreshModalProps> = ({ open, onClose, directoryIds }) => {
  const { directories, directoriesFileCount, updateIsRefreshingDirectories } = useDirectories()

  const [refreshedDirectories, setRefreshedDirectories] = useState<RefreshedDirectories[]>([])
  const [skippedDirectories, setSkippedDirectories] = useState<number[]>([])
  const [refreshInitialized, setRefreshInitialized] = useState<boolean>(false)

  const [refreshDisabled, setRefreshDisabled] = useState<boolean>(true)

  const allDirectoriesRefreshed = useMemo(() => {
    return refreshedDirectories.length + skippedDirectories.length === directoryIds.length
  }, [refreshedDirectories, skippedDirectories, directoryIds])

  const totalFiles = useMemo(() => {
    return Object.entries(directoriesFileCount).reduce((acc, [directoryId, fileCount]) => {
      return directoryIds.includes(Number(directoryId)) ? acc + fileCount : acc
    }, 0)
  }, [directoriesFileCount, directoryIds])

  const handleRefreshedDirectory = (_: unknown, refreshedDirectory: RefreshedDirectories): void => {
    setRefreshedDirectories(prev => [...prev, refreshedDirectory])
  }

  const handleRefreshDirectoryError = (_: unknown, { errMessage, directoryId }: { errMessage: string, directoryId: number }): void => {
    setSkippedDirectories(prev => [...prev, directoryId])
  }

  const onCloseModal = (): void => {
    setRefreshedDirectories([])
    setSkippedDirectories([])
    onClose()
  }

  const onCloseConfirmModal = (): void => {
    onCloseModal()
    updateIsRefreshingDirectories(false)
  }

  useEffect(() => {
    ipcRenderer.on('refreshed-directory', handleRefreshedDirectory)
    ipcRenderer.on('refresh-directory-error', handleRefreshDirectoryError)

    // Disable refresh button for 3 seconds to prevent accidental refreshes
    const timeout = setTimeout(() => {
      setRefreshDisabled(false)
    }, 1)

    return () => {
      ipcRenderer.removeListener('refreshed-directory', handleRefreshedDirectory)
      ipcRenderer.removeListener('refresh-directory-error', handleRefreshDirectoryError)
      clearTimeout(timeout)
    }
  }, [])

  if (!refreshInitialized) {
    return (
      <Modal open={open} onClose={onCloseConfirmModal}>
        <Typography variant='h5' mb={2}>
          Confirm Refresh Directories
        </Typography>
        <Typography mb={2}>
          Would you like to refresh <span style={{ fontWeight: 'bold' }}>{directoryIds.length} director{directoryIds.length > 1 ? 'ies' : 'y'}</span> containing <span style={{ fontWeight: 'bold' }}>{totalFiles} file{
            totalFiles === 1 ? '' : 's'}</span>?
        </Typography>
        <Typography mb={2}>
          This will update the files tracked by the database. If any files have been removed from the directory, they will be removed from the database as well.
        </Typography>
        <Typography mb={2}>
          This operation cannot be undone and cannot be stopped once started. It will take some time to complete. Are you sure you want to continue?
        </Typography>
        <Typography mb={2}>
          To prevent accidental refreshes, the refresh button will be disabled for 3 seconds.
        </Typography>
        <Grid container justifyContent='flex-end' mt={2}>
          <Grid item>
            <Box display='flex' gap={2}>
              <Button onClick={onCloseConfirmModal}>
                Cancel
              </Button>
              <Button
                variant='contained'
                onClick={() => {
                  setRefreshInitialized(true)
                  ipcRenderer.send('refresh-directories', { directoryIds })
                }}
                disabled={allDirectoriesRefreshed || refreshDisabled}
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onCloseModal} disableClose={!allDirectoriesRefreshed}>
      <Typography mb={2} variant='h5'>
        Refreshed Directories
      </Typography>
      {
        refreshedDirectories?.map((refreshedDirectory, i) => (
          <Box key={i} mb={2}>
            <Typography variant='h6'>
              {directories.find(directory => directory.id === refreshedDirectory.directoryId)?.name}
            </Typography>
            <Typography variant='body2' color='text.secondary' mb={2}>
              {directories.find(directory => directory.id === refreshedDirectory.directoryId)?.path}
            </Typography>
            <Typography>
              Number of Existing Files: {refreshedDirectory.numExistingFiles}
            </Typography>
            <Typography>
              Number of Renamed Files: {refreshedDirectory.numRenamedFiles}
            </Typography>
            <Typography>
              Number of Deleted Files: {refreshedDirectory.numDeletedFiles}
            </Typography>
            <Typography>
              Number of New Files: {refreshedDirectory.numNewFiles}
            </Typography>
          </Box>
        ))
      }
      {
        refreshedDirectories?.length > 0 && skippedDirectories?.length > 0 && <Divider />
      }
      {
        skippedDirectories?.length > 0 && (
          <>
            <Box my={2}>
              <Typography variant='h5'>
                Skipped Directories
              </Typography>
              <Typography mb={2}>
                The following directories were skipped because they were not found. These directories may have been deleted or exist on an external drive that is not currently connected.
              </Typography>
              <Stack gap={2}>
                {
                  skippedDirectories.map((directoryId) => (
                    <Stack key={directoryId}>
                      <Typography variant='h6'>
                        {directories.find(directory => directory.id === directoryId)?.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {directories.find(directory => directory.id === directoryId)?.path}
                      </Typography>
                    </Stack>
                  ))
                }
              </Stack>
            </Box>
          </>
        )
      }
      <Grid container spacing={2} alignItems='center'>
        {
          !allDirectoriesRefreshed && (
            <Grid item>
              <CircularProgress size={20} />
            </Grid>
          )
        }
        <Grid item sx={{ flexGrow: 1 }} display='flex' flexDirection='row' alignItems='center'>
          <LinearProgress
            variant='determinate'
            value={
              (refreshedDirectories.length + skippedDirectories.length) / directoryIds.length * 100
            }
            sx={{ flexGrow: 1 }}
          />
        </Grid>
        <Grid item>
          <Typography color='textPrimary'>
            {`${refreshedDirectories.length + skippedDirectories.length} / ${directoryIds.length} completed`}
          </Typography>
        </Grid>
      </Grid>
    </Modal>
  )
}

export default DirectoryRefreshModal

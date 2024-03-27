import { type FC, useEffect, useMemo, useState } from 'react'
import { Modal, type ModalProps } from '../Modal'
import { Typography, LinearProgress, Box, Grid, CircularProgress, Divider, Stack } from '@mui/material'
import { ipcRenderer } from 'electron'
import useDirectories from '@/hooks/useDirectories'
import { type RefreshedDirectories } from 'shared/types'

interface DirectoryRefreshModalProps extends Omit<ModalProps, 'children'> {
  directoryIds: number[]
}

const DirectoryRefreshModal: FC<DirectoryRefreshModalProps> = ({ open, onClose, directoryIds }) => {
  const { directories } = useDirectories()

  const [refreshedDirectories, setRefreshedDirectories] = useState<RefreshedDirectories[]>([])
  const [skippedDirectories, setSkippedDirectories] = useState<number[]>([])

  const allDirectoriesRefreshed = useMemo(() => {
    return refreshedDirectories.length + skippedDirectories.length === directoryIds.length
  }, [refreshedDirectories, skippedDirectories, directoryIds])

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

  useEffect(() => {
    ipcRenderer.on('refreshed-directory', handleRefreshedDirectory)
    ipcRenderer.on('refresh-directory-error', handleRefreshDirectoryError)

    return () => {
      ipcRenderer.removeListener('refreshed-directory', handleRefreshedDirectory)
      ipcRenderer.removeListener('refresh-directory-error', handleRefreshDirectoryError)
    }
  }, [])

  return (
    <Modal open={open} onClose={onCloseModal} disableClose={!allDirectoriesRefreshed}>
      {
        !allDirectoriesRefreshed && (
          <Typography mb={2}>
            Refreshing...
          </Typography>
        )
      }
      {
        refreshedDirectories?.map((refreshedDirectory, i) => (
          <Box key={i} mb={2}>
            <Typography variant='h6'>
              {directories.find(directory => directory.id === refreshedDirectory.directoryId)?.name}
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
              <Typography variant='h6'>
                Skipped Directories
              </Typography>
              <Typography mb={2}>
                The following directories were skipped because they were not found. These directories may have been deleted or exist on an external drive that is not currently connected.
              </Typography>
              <Stack gap={2}>
                {
                  skippedDirectories.map((directoryId) => (
                    <Stack key={directoryId}>
                      <Typography>
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

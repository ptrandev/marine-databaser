import { type FC, useEffect, useMemo, useState } from 'react'
import { Modal, type ModalProps } from '../Modal'
import { Typography, LinearProgress, Button, Box, Grid, CircularProgress } from '@mui/material'
import { ipcRenderer } from 'electron'
import useDirectories from '@/hooks/useDirectories'
import { Refresh } from '@mui/icons-material'

interface RefreshedDirectories {
  directoryId: number
  numExistingFiles: number
  numRenamedFiles: number
  numDeletedFiles: number
  numNewFiles: number
}

const RefreshButton: FC = () => {
  const { loadDirectories } = useDirectories()

  const [isRefreshingDirectories, setIsRefreshingDirectories] = useState<boolean>(false)

  const handleRefresh = (): void => {
    setIsRefreshingDirectories(true)
    ipcRenderer.send('refresh-directories')
    ipcRenderer.once('refreshed-directories', () => {
      void loadDirectories()
    })
  }

  return (
    <>
      <Button
        color='primary'
        startIcon={<Refresh />}
        size='small'
        onClick={handleRefresh}
        disabled={isRefreshingDirectories}
      >
        Refresh
      </Button>
      {
        isRefreshingDirectories &&
        <RefreshModal open={isRefreshingDirectories} onClose={() => { setIsRefreshingDirectories(false) }} />
      }
    </>
  )
}

const RefreshModal: FC<Omit<ModalProps, 'children'>> = ({ open, onClose }) => {
  const { directories } = useDirectories()

  const [refreshedDirectories, setRefreshedDirectories] = useState<RefreshedDirectories[]>([])

  const allDirectoriesRefreshed = useMemo(() => {
    return refreshedDirectories.length === directories.length
  }, [refreshedDirectories, directories])

  useEffect(() => {
    ipcRenderer.on('refreshed-directory', (_, refreshedDirectory) => {
      setRefreshedDirectories(prev => [...prev, refreshedDirectory])
    })

    return () => {
      ipcRenderer.removeAllListeners('refreshed-directory')
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose} disableClose={!allDirectoriesRefreshed}>
      {
        !refreshedDirectories?.length && (
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
              refreshedDirectories?.length > 0 ? (refreshedDirectories.length / directories.length) * 100 : 0
            }
            sx={{ flexGrow: 1 }}
          />
        </Grid>
        <Grid item>
          <Typography color='textPrimary'>
            {`${refreshedDirectories.length} / ${directories.length} completed`}
          </Typography>
        </Grid>
      </Grid>
    </Modal>
  )
}

export default RefreshButton

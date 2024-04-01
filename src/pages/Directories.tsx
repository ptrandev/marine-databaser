import { Add } from '@mui/icons-material'
import { Typography, Button, Box, LinearProgress, Stack } from '@mui/material'

import DirectoryList from '@/components/Directories/DirectoryList'
import useDirectories from '@/hooks/useDirectories'
import { ipcRenderer } from 'electron'
import { type FC, useEffect } from 'react'
import DirectoryRefreshButton from '@/components/Directories/DirectoryRefreshButton'
import { enqueueSnackbar } from 'notistack'

const Directories: FC = () => {
  const { isInitializingDirectory, handleIsInitializingDirectory, loadDirectories } = useDirectories()

  const handleAddDirectory = (): void => {
    ipcRenderer.send('add-directory')
  }

  const handleAddedDirectory = (): void => {
    handleIsInitializingDirectory(true)
  }

  const handleInitializedDirectory = (): void => {
    loadDirectories().then(() => {
      handleIsInitializingDirectory(false)
    }).catch(() => {
      handleIsInitializingDirectory(false)
    })
  }

  const handleAddDirectoryError = (_, errMessage: string): void => {
    enqueueSnackbar(errMessage, { variant: 'error' })
    handleIsInitializingDirectory(false)
  }

  useEffect(() => {
    ipcRenderer.on('initialized-directory', handleInitializedDirectory)
    ipcRenderer.on('added-directory', handleAddedDirectory)
    ipcRenderer.on('add-directory-error', handleAddDirectoryError)

    return () => {
      ipcRenderer.removeListener('added-directory', handleAddedDirectory)
      ipcRenderer.removeListener('initialized-directory', handleInitializedDirectory)
      ipcRenderer.removeListener('add-directory-error', handleAddDirectoryError)
    }
  }, [])

  return (
    <Box>
      <Stack flexWrap='wrap' direction='row' justifyContent='space-between' width='100%' mb={2} gap={2}>
        <Typography variant='h4' mr={2}>
          Directories
        </Typography>
        <Stack direction='row' alignItems='center' gap={2}>
          <Box>
            <DirectoryRefreshButton />
          </Box>
          <Box>
            <Button variant='contained' startIcon={<Add />}
              onClick={handleAddDirectory}
            >
              New Directory
            </Button>
          </Box>
        </Stack>
      </Stack>
      {
        isInitializingDirectory && (
          <Box width='100%'>
            <Typography mb={1}>
              Initializing new directory...
            </Typography>
            <LinearProgress />
          </Box>
        )
      }
      <DirectoryList />
    </Box>
  )
}

export default Directories

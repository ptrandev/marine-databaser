import { Add } from '@mui/icons-material'
import { Typography, Button, Box, LinearProgress, Stack, CircularProgress } from '@mui/material'

import DirectoryList from '@/components/Directories/DirectoryList'
import useDirectories from '@/hooks/useDirectories'
import { ipcRenderer } from 'electron'
import { type FC, useEffect } from 'react'
import RefreshButton from '@/components/Directories/RefreshButton'

const Directories: FC = () => {
  const { isLoadingDirectories, isInitializingDirectory, handleIsInitializingDirectory, loadDirectories } = useDirectories()

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

  useEffect(() => {
    ipcRenderer.on('initialized-directory', handleInitializedDirectory)
    ipcRenderer.on('added-directory', handleAddedDirectory)

    return () => {
      ipcRenderer.removeListener('added-directory', handleAddedDirectory)
      ipcRenderer.removeListener('initialized-directory', handleInitializedDirectory)
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
            <RefreshButton />
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
      {
        isLoadingDirectories
          ? (
            <Box display='flex' flexDirection='column' mt={4} alignItems='center' justifyContent='center' width='100%' gap={2}>
              <CircularProgress />
              <Typography>
                Loading directories...
              </Typography>
            </Box>
            )
          : (
            <DirectoryList />
            )
      }
    </Box>
  )
}

export default Directories

import { Add, Refresh } from "@mui/icons-material"
import { Typography, Button, Box, LinearProgress, Stack, CircularProgress } from "@mui/material"

import DirectoryList from "@/components/Directories/DirectoryList"
import useDirectories from "@/hooks/useDirectories"
import { ipcRenderer } from "electron"
import { useEffect } from "react"

const Directories = () => {
  const { isLoadingDirectories, isInitializingDirectory, handleIsInitializingDirectory, loadDirectories } = useDirectories()

  const handleAddDirectory = () => {
    ipcRenderer.send('add-directory')

    ipcRenderer.once('added-directory', () => {
      handleIsInitializingDirectory(true)
    })
  }

  const handleRefresh = () => {
    handleIsInitializingDirectory(true)
    ipcRenderer.send('refresh-directories')

    ipcRenderer.once('refreshed-directories', () => {
      loadDirectories()
      handleIsInitializingDirectory(false)
    })
  }

  useEffect(() => {
    ipcRenderer.on('initialized-directory', () => {
      loadDirectories()
      handleIsInitializingDirectory(false)
    })

    return () => {
      ipcRenderer.removeAllListeners('added-directory')
      ipcRenderer.removeAllListeners('initialized-directory')
      ipcRenderer.removeAllListeners('refreshed-directories')
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
            <Button
              color='primary'
              startIcon={<Refresh />}
              size='small'
              onClick={handleRefresh}
            >
              Refresh
            </Button>
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
        isLoadingDirectories ? (
          <Box display='flex' flexDirection='column' mt={4} alignItems='center' justifyContent='center' width='100%' gap={2}>
            <CircularProgress />
            <Typography>
              Loading directories...
            </Typography>
          </Box>
        ) : (
          <DirectoryList />
        )
      }
    </Box>
  )
}

export default Directories
import { useState, useEffect } from "react"
import { DirectoryList } from "@/components/Directories"
import { Add } from "@mui/icons-material"
import { Typography, Button, Box, LinearProgress, Stack } from "@mui/material"

import { Directory } from "../../electron/database/schemas"
import { ipcRenderer } from 'electron'

const Directories = () => {
  const [directories, setDirectories] = useState<Directory[]>()
  const [directoriesFileCount, setDirectoriesFileCount] = useState<Record<number, number>>({})

  const [initializingDirectory, setInitializingDirectory] = useState<boolean>(false)

  const loadDirectories = () => {
    ipcRenderer.send('list-directories')
    ipcRenderer.on('listed-directories', (_, directories) => {
      setDirectories(directories)
    })

    ipcRenderer.send('list-directories-file-count')
    ipcRenderer.on('listed-directories-file-count', (_, data) => {
      setDirectoriesFileCount(data)
    })
  }

  const handleSelectDirectory = () => {
    ipcRenderer.send('select-directory')

    ipcRenderer.on('selected-directory', () => {
      setInitializingDirectory(true)
    })

    ipcRenderer.on('initialized-directory', () => {
      loadDirectories()
      setInitializingDirectory(false)
    })
  }

  useEffect(() => {
    loadDirectories()
  }, [])

  return (
    <Box>
      <Stack flexWrap='wrap' direction='row' justifyContent='space-between' width='100%' mb={2}>
        <Typography variant='h4' mr={2}>
          Directories
        </Typography>
        <Button variant='contained' startIcon={<Add />}
          onClick={handleSelectDirectory}
        >
          Add New Directory
        </Button>
      </Stack>
      {
        initializingDirectory && (
          <Box width='100%'>
            <Typography mb={1}>
              Initializing new directory...
            </Typography>
            <LinearProgress />
          </Box>
        )
      }
      {
        directories &&
        <DirectoryList directories={directories} directoriesFileCount={directoriesFileCount} loadDirectories={loadDirectories} />
      }
    </Box>
  )
}

export default Directories
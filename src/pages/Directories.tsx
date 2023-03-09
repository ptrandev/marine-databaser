import { useState, useEffect } from "react"
import { DirectoryList } from "@/components/Directories"
import { Add } from "@mui/icons-material"
import { Typography, Button, Box } from "@mui/material"

import { Directory } from "../../electron/database/schemas"
import { ipcRenderer } from 'electron'

const Directories = () => {
  const [directories, setDirectories] = useState<Directory[]>()

  const loadDirectories = () => {
    ipcRenderer.send('list-directories')
    ipcRenderer.on('listed-directories', (_, directories) => {
      console.log(directories)
      setDirectories(directories)
    })
  }

  useEffect(() => {
    loadDirectories()
  }, [])

  return (
    <Box>
      <Box display='flex' flexWrap='wrap' flexDirection='row' justifyContent='space-between' width='100%' mb={2}>
        <Typography variant='h4' mr={2}>
          Directories
        </Typography>
        <Button variant='contained' startIcon={<Add/>}
          onClick={() => {
            ipcRenderer.send('select-directory')
            ipcRenderer.on('selected-directory', () => {
              loadDirectories()
            })
          }}
        >
          Add New Directory
        </Button>
      </Box>
      {
        directories && 
        <DirectoryList directories={directories} loadDirectories={loadDirectories} />
      }
    </Box>
  )
}

export default Directories
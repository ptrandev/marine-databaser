
import { Box, Button, CircularProgress, Typography } from "@mui/material"
import { useState, useEffect } from "react"
const { ipcRenderer } = window.require('electron')

import { FileList } from '@/components/Home'

import { Directory, File } from "../../electron/database/schemas"
import FileSearch from "@/components/Home/FileSearch"
import FileFilters from "@/components/Home/FileFilters"

import Fuse from 'fuse.js'

import { useEffectDebounced } from '@/hooks/useEffectDebounced'

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

const Home = () => {
  const [files, setFiles] = useState<File[]>()
  const [searchFiles, setSearchFiles] = useState<File[]>([])

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  const [selectedDirectories, setSelectedDirectories] = useState<Directory[]>([])

  const loadFiles = () => {
    setIsLoading(true)

    const directories = selectedDirectories?.map(directory => directory.dataValues.id) ?? []

    ipcRenderer.send('list-files', { directories })
    ipcRenderer.on('listed-files', (_, files) => {
      setFiles(files)
      setIsLoading(false)
    })
  }

  useEffect(() => {
    loadFiles()
  }, [])

  useEffectDebounced(() => {
    if (!files) return

    if (!searchTerm) {
      setSearchFiles(files)
      return
    }

    setIsLoading(true)

    const options = {
      ignoreLocation: true,
      keys: ['dataValues.name', 'dataValues.path']
    }

    const fuse = new Fuse(files, options)

    const results = fuse
      .search(searchTerm)
      .map(result => result.item)

    setSearchFiles(results)
    setIsLoading(false)
  }, [files, searchTerm], 500)

  useEffect(() => {
    loadFiles()
  }, [selectedDirectories])

  return (
    <Box height='100%'>
      <FileSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <FileFilters setSelectedDirectories={setSelectedDirectories} />
      {
        !isLoading && searchFiles && (
          <>
            <Typography mt={2}>
              <span style={{ fontWeight: 'bold' }}>{searchFiles.length}</span> files found
            </Typography>
            <FileList files={searchFiles} />
          </>
        )
      }
      {
        isLoading && (
          <Box display='flex' flexDirection='column' mt={4} alignItems='center' justifyContent='center' width='100%' gap={2}>
            <CircularProgress />
            <Typography>
              Loading files...
            </Typography>
          </Box>
        )
      }
    </Box>
  )
}

export default Home

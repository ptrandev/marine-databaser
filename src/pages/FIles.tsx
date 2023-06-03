import { Box, CircularProgress, Typography } from "@mui/material"
import { useState, useEffect } from "react"
const { ipcRenderer } = window.require('electron')

import { FileList } from '@/components/Files'

import FileSearch from "@/components/Files/FileSearch"
import FileFilters from "@/components/Files/FileFilters"

import Fuse from 'fuse.js'

import { useEffectDebounced } from '@/hooks/useEffectDebounced'

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

import { FileWithTags } from '../../shared/types'
import useFiles from "@/hooks/useFiles"

const Files = () => {
  const { searchTerm, selectedDirectories, selectedTags, selectedFileTypes } = useFiles()

  const [files, setFiles] = useState<FileWithTags[]>()
  const [searchFiles, setSearchFiles] = useState<FileWithTags[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadFiles = () => {
    setIsLoading(true)

    const directories: number[] = selectedDirectories?.map(directory => directory.id) ?? []
    const tags: number[] = selectedTags?.map(tag => tag.id) ?? []
    const fileTypes: string[] = selectedFileTypes ?? []

    ipcRenderer.send('list-files', { directories, tags, fileTypes })
    ipcRenderer.on('listed-files', (_, files) => {
      setFiles(files)
      setIsLoading(false)
    })
  }

  useEffectDebounced(() => {
    if (!files) return

    if (!searchTerm) {
      setSearchFiles(files)
      return
    }

    setIsLoading(true)

    const options = {
      ignoreLocation: true,
      keys: ['name', 'path']
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
  }, [selectedDirectories, selectedTags, selectedFileTypes])

  return (
    <Box>
      <Box>
        <FileSearch />
        <FileFilters />
      </Box>
      {
        !isLoading && searchFiles && (
          <>
            <Typography mt={2}>
              <span style={{ fontWeight: 'bold' }}>{searchFiles.length}</span> files found
            </Typography>
            <FileList files={searchFiles} loadFiles={loadFiles} />
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

export default Files

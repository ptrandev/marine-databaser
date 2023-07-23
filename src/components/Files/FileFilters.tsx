import { Box, Autocomplete, TextField, Select, MenuItem } from '@mui/material'
import { Directory, Tag } from 'electron/database/schemas'
import { FC, useEffect, useState } from 'react'

import { ipcRenderer } from 'electron'
import useFiles from '@/hooks/useFiles'
import { FileTypes } from '../../../shared/types'


const FileFilters : FC = () => {
  const { selectedDirectories, selectedTags, selectedFileTypes, updateSelectedDirectories, updateSelectedTags, updateSelectedFileTypes } = useFiles()

  const [directories, setDirectories] = useState<Directory[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  const loadDirectories = () => {
    ipcRenderer.send('list-directories')
    ipcRenderer.once('listed-directories', (_, directories) => {
      setDirectories(directories)
    })
  }

  const loadTags = () => {
    ipcRenderer.send('list-tags')
    ipcRenderer.once('listed-tags', (_, tags) => {
      setTags(tags)
    })
  }

  useEffect(() => {
    loadDirectories()
    loadTags()

    return () => {
      ipcRenderer.removeAllListeners('listed-directories')
      ipcRenderer.removeAllListeners('listed-tags')
    }
  }, [])

  return (
    <Box mt={2} display='flex' gap={2}>
      <Autocomplete
        multiple
        filterSelectedOptions
        defaultValue={selectedDirectories}
        options={directories ?? []}
        onChange={(_, value) => updateSelectedDirectories(value)}
        getOptionLabel={(option) => option.name}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Directories"
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        fullWidth
      />
      <Autocomplete
        multiple
        filterSelectedOptions
        defaultValue={selectedTags}
        options={tags ?? []}
        onChange={(_, value) => updateSelectedTags(value)}
        getOptionLabel={(option) => option.name}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Tags"
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        fullWidth
      />
      <Autocomplete
        multiple
        filterSelectedOptions
        defaultValue={selectedFileTypes}
        options={FileTypes}
        onChange={(_, value) => updateSelectedFileTypes(value)}
        getOptionLabel={(option) => option}
        renderInput={(params) => (
          <TextField
            {...params}
            label="File types"
          />
        )}
        isOptionEqualToValue={(option, value) => option === value}
        fullWidth
      />
    </Box>
  )
}

export default FileFilters
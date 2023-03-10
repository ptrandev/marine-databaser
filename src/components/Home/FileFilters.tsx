import { Box, Autocomplete, TextField } from '@mui/material'
import { Directory, Tag } from 'electron/database/schemas'
import { FC, useEffect, useState } from 'react'

import { ipcRenderer } from 'electron'

interface FileFiltersProps {
  setSelectedDirectories: (directories: Directory[]) => void
}

const FileFilters : FC<FileFiltersProps> = ({ setSelectedDirectories }) => {
  const [directories, setDirectories] = useState<Directory[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  const loadDirectories = () => {
    ipcRenderer.send('list-directories')
    ipcRenderer.on('listed-directories', (_, directories) => {
      setDirectories(directories)
    })
  }

  const loadTags = () => {
    ipcRenderer.send('list-tags')
    ipcRenderer.on('listed-tags', (_, tags) => {
      setTags(tags)
    })
  }

  useEffect(() => {
    loadDirectories()
    loadTags()
  }, [])

  return (
    <Box mt={2}>
      <Autocomplete
        multiple
        filterSelectedOptions
        options={directories ?? []}
        onChange={(_, value) => setSelectedDirectories(value)}
        getOptionLabel={(option) => option.name}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Directories"
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
    </Box>
  )
}

export default FileFilters
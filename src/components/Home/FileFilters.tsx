import { Box, Autocomplete, TextField } from '@mui/material'
import { Directory } from 'electron/database/schemas'
import { FC, useEffect, useState } from 'react'

import { ipcRenderer } from 'electron'

interface FileFiltersProps {
  selectedDirectories: Directory[]
  setSelectedDirectories: (directories: Directory[]) => void
}

const FileFilters : FC<FileFiltersProps> = ({ selectedDirectories, setSelectedDirectories }) => {

  const [directories, setDirectories] = useState<Directory[]>([])

  const loadDirectories = () => {
    ipcRenderer.send('list-directories')
    ipcRenderer.on('listed-directories', (_, directories) => {
      setDirectories(directories)
    })
  }

  useEffect(() => {
    loadDirectories()
  }, [])

  return (
    <Box mt={2}>
      <Autocomplete
        multiple
        filterSelectedOptions
        options={directories ?? []}
        onChange={(_, value) => setSelectedDirectories(value)}
        getOptionLabel={(option) => option.dataValues.name}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Directories"
          />
        )}
        isOptionEqualToValue={(option, value) => option.dataValues.id === value.dataValues.id}
      />
    </Box>
  )
}

export default FileFilters
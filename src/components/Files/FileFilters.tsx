import { Box, Autocomplete, TextField } from '@mui/material'
import { type FC } from 'react'

import useFiles from '@/hooks/useFiles'
import { FileTypes } from '../../../shared/types'
import useTags from '@/hooks/useTags'
import useDirectories from '@/hooks/useDirectories'
import useFileParent from '@/hooks/useFileParent'

const FileFilters: FC = () => {
  const { selectedDirectories, selectedTags, selectedFileTypes, updateSelectedDirectories, updateSelectedTags, updateSelectedFileTypes, updateSelectedFileParents } = useFiles()
  const { tags } = useTags()
  const { directories } = useDirectories()
  const { fileParentFiles } = useFileParent()

  return (
    <Box mt={2} display='flex' gap={2}>
      <Autocomplete
        multiple
        filterSelectedOptions
        defaultValue={selectedDirectories}
        options={directories}
        onChange={(_, value) => { updateSelectedDirectories(value) }}
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
        options={tags}
        onChange={(_, value) => { updateSelectedTags(value) }}
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
        onChange={(_, value) => { updateSelectedFileTypes(value) }}
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
      <Autocomplete
        multiple
        filterSelectedOptions
        options={fileParentFiles}
        getOptionLabel={(option) => option.name}
        renderInput={(params) => (
          <TextField
            {...params}
            label='File parents'
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        fullWidth
        onChange={(_, value) => { updateSelectedFileParents(value) }}
      />
    </Box>
  )
}

export default FileFilters

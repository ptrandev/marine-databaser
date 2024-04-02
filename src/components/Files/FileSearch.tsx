import { Search, Refresh } from '@mui/icons-material'
import { InputAdornment, Button, Autocomplete, TextField, Box, Stack, Grid } from '@mui/material'
import { type FC } from 'react'
import useFiles from '@/hooks/useFiles'
import { FileTypes } from '../../../shared/types'
import useTags from '@/hooks/useTags'
import useDirectories from '@/hooks/useDirectories'
import useFileParent from '@/hooks/useFileParent'

const FileSearch: FC = () => {
  const { searchTerm, updateSearchTerm } = useFiles()
  const { selectedDirectories, selectedTags, selectedFileTypes, updateSelectedDirectories, updateSelectedTags, updateSelectedFileTypes, updateSelectedFileParents, selectedFileParents } = useFiles()
  const { tags } = useTags()
  const { directories } = useDirectories()
  const { fileParentFiles } = useFileParent()

  const handleClearFilters = (): void => {
    updateSelectedDirectories([])
    updateSelectedTags([])
    updateSelectedFileTypes([])
    updateSelectedFileParents([])
  }

  return (
    <Stack gap={2}>
      <Stack direction='row' gap={2} alignItems='center'>
        <TextField
          placeholder='Search file name, file path, or notes'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Search />
              </InputAdornment>
            )
          }}
          fullWidth
          value={searchTerm}
          onChange={e => { updateSearchTerm(e.target.value) }}
        />
        <Box>
          <Button
            sx={{
              whiteSpace: 'nowrap'
            }}
            startIcon={<Refresh />}
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={3}>
          <Autocomplete
            multiple
            filterSelectedOptions
            defaultValue={selectedDirectories}
            options={directories}
            value={selectedDirectories}
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
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Autocomplete
            multiple
            filterSelectedOptions
            defaultValue={selectedTags}
            options={tags}
            value={selectedTags}
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
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Autocomplete
            multiple
            filterSelectedOptions
            defaultValue={selectedFileTypes}
            options={FileTypes}
            value={selectedFileTypes}
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
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Autocomplete
            multiple
            filterSelectedOptions
            options={fileParentFiles}
            value={selectedFileParents}
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
        </Grid>
      </Grid>
    </Stack>
  )
}

export default FileSearch

import { Search, Refresh, Close } from '@mui/icons-material'
import { InputAdornment, Button, Autocomplete, TextField, Box, Stack, Grid, ListItem, ListItemText, createFilterOptions, Tooltip, IconButton } from '@mui/material'
import { type FC } from 'react'
import useFiles from '@/hooks/useFiles'
import { FileTypes } from '../../../shared/types'
import useTags from '@/hooks/useTags'
import useDirectories from '@/hooks/useDirectories'
import useFileParent from '@/hooks/useFileParent'
import { type FileParentFile } from '@/contexts/FileParentContext'

const FileSearch: FC = () => {
  const { searchTerm, updateSearchTerm } = useFiles()
  const { selectedDirectories, selectedTags, selectedFileTypes, updateSelectedDirectories, updateSelectedTags, updateSelectedFileTypes, updateSelectedFileParents, selectedFileParents } = useFiles()
  const { tags } = useTags()
  const { directories } = useDirectories()
  const { fileParentFiles } = useFileParent()

  const filterOptions = createFilterOptions({
    stringify: (option: FileParentFile) => option.path
  })

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
            ),
            endAdornment: (
              searchTerm !== '' && (
                <InputAdornment position='end'>
                  <Tooltip title='Clear search'>
                    <IconButton
                      aria-label='clear search'
                      onClick={() => { updateSearchTerm('') }}
                    >
                      <Close />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
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
            renderOption={(props, option) => (
              <ListItem {...props}>
                <ListItemText primary={option.name} secondary={option.path} />
              </ListItem>
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
            filterOptions={filterOptions}
            options={fileParentFiles}
            value={selectedFileParents}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => (
              <ListItem {...props}>
                <ListItemText primary={option.name} secondary={option.path} />
              </ListItem>
            )}
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

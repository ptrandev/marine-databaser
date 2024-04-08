import { Delete, Folder, Refresh, DriveFileMove, Search, Close, Warning } from '@mui/icons-material'
import { IconButton, List, ListItemText, ListItem, Typography, Box, LinearProgress, Tooltip, CircularProgress, TextField, InputAdornment } from '@mui/material'
import { ipcRenderer } from 'electron'
import { type FC, useState, useEffect, useMemo } from 'react'
import { enqueueSnackbar } from 'notistack'

import useDirectories from '@/hooks/useDirectories'
import DirectoryDeleteModal from './DirectoryDeleteModal'
import { type Directory } from 'electron/database/schemas'
import { useEffectDebounced } from '@/hooks/useEffectDebounced'

const DirectoryList: FC = () => {
  const { directories, isDeletingDirectory, isRefreshingDirectories, handleRefreshDirectories, isLoadingDirectories } = useDirectories()

  const [directoryIdToDelete, setDirectoryIdToDelete] = useState<number>()

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Directory[]>(directories)

  const handleRefresh = (directoryId: number): void => {
    handleRefreshDirectories([directoryId])
  }

  const handleOpenDirectoryError = (_: unknown, errMessage: string): void => {
    enqueueSnackbar(errMessage, { variant: 'error' })
  }

  useEffectDebounced(() => {
    if (searchTerm === '') {
      setSearchResults(directories)
    } else {
      setSearchResults(directories?.filter((directory) => directory.path.toLowerCase().includes(searchTerm.toLowerCase())))
    }
  }, [searchTerm, directories], 250)

  useEffect(() => {
    ipcRenderer.on('open-directory-error', handleOpenDirectoryError)

    return () => {
      ipcRenderer.removeListener('open-directory-error', handleOpenDirectoryError)
    }
  }, [])

  if (isLoadingDirectories) {
    return (
      <Box display='flex' flexDirection='column' mt={4} alignItems='center' justifyContent='center' width='100%' gap={2}>
        <CircularProgress />
        <Typography>
          Loading directories...
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {
        isDeletingDirectory && (
          <Box width='100%'>
            <Typography mb={1}>
              Deleting directory...
            </Typography>
            <LinearProgress color='error' />
          </Box>
        )
      }
      <TextField
        placeholder='Search directory name or path'
        variant='outlined'
        fullWidth
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value) }}
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
                    onClick={() => { setSearchTerm('') }}
                  >
                    <Close />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          )
        }}
      />
      <List>
        {
          searchResults?.map((directory) => (
            <DirectoryListItem
              key={directory.id}
              directory={directory}
              updateDirectoryIdToDelete={setDirectoryIdToDelete}
              isDeletingDirectory={isDeletingDirectory}
              handleRefresh={handleRefresh}
              isRefreshingDirectory={isRefreshingDirectories}
            />
          ))
        }
      </List>
      {
        directoryIdToDelete !== undefined && (
          <DirectoryDeleteModal open={directoryIdToDelete !== undefined} onClose={() => { setDirectoryIdToDelete(undefined) }} directoryId={directoryIdToDelete} />
        )
      }
    </>
  )
}

interface DirectoryListItemProps {
  directory: Directory
  updateDirectoryIdToDelete: (directoryId: number) => void
  isDeletingDirectory: boolean
  handleRefresh: (directoryId: number) => void
  isRefreshingDirectory: boolean
}

const DirectoryListItem: FC<DirectoryListItemProps> = ({ directory, updateDirectoryIdToDelete, isDeletingDirectory, handleRefresh, isRefreshingDirectory }) => {
  const { directoriesFileCount, handleSetDirectoryLocation, directoriesAccess } = useDirectories()

  const handleOpenDirectory = (path: string): void => {
    ipcRenderer.send('open-directory', { path })
    ipcRenderer.send('list-directories-access', { directoryIds: [directory.id] })
  }

  const directoryAccess: boolean = useMemo(() => directoriesAccess[directory.id], [directoriesAccess, directory.id])

  return (
    <ListItem
      key={directory.id}
    >
      <Tooltip title={
        directoryAccess
          ? 'Open directory'
          : 'This directory may not be accessible. Click to re-check directory access status.'
      } sx={{ mr: 1, ml: -2 }}>
        <IconButton
          aria-label='open directory'
          onClick={(e) => {
            e.stopPropagation()
            handleOpenDirectory(directory.path)
          }}
        >
          {directoryAccess ? <Folder /> : <Warning />}
        </IconButton>
      </Tooltip>
      <ListItemText
        primary={
          <>
            {directory.name}
            <Typography variant='caption' display='inline'>
              {directoriesFileCount[directory.id]
                ? ` (${new Intl.NumberFormat().format(directoriesFileCount[directory.id])
                } file${directoriesFileCount[directory.id] === 1 ? '' : 's'})`
                : ''}
            </Typography>
          </>
        }
        secondary={
          <Typography variant='body2' color='text.secondary' noWrap>
            {directory.path}
          </Typography>
        }
      />
      <Tooltip title='Refresh directory'>
        <IconButton
          aria-label='refresh'
          onClick={(e) => {
            e.stopPropagation()
            handleRefresh(directory.id)
          }}
          color='primary'
          disabled={isRefreshingDirectory}
        >
          <Refresh />
        </IconButton>
      </Tooltip>
      <Tooltip title='Set directory location'>
        <IconButton
          aria-label='set directory location'
          onClick={(e) => {
            e.stopPropagation()
            handleSetDirectoryLocation(directory.id)
          }}
        >
          <DriveFileMove />
        </IconButton>
      </Tooltip>
      <Tooltip title='Delete directory'>
        <IconButton
          aria-label='delete'
          color='error'
          onClick={(e) => {
            e.stopPropagation()
            updateDirectoryIdToDelete(directory.id)
          }}
          disabled={isDeletingDirectory}
        >
          <Delete />
        </IconButton>
      </Tooltip>
    </ListItem>
  )
}

export default DirectoryList

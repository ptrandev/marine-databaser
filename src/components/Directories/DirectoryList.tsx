import { Delete, Folder, Refresh } from '@mui/icons-material'
import { IconButton, List, ListItemText, ListItem, Typography, Box, LinearProgress, Tooltip } from '@mui/material'
import { ipcRenderer } from 'electron'
import { type FC, useState, useEffect } from 'react'

import useDirectories from '@/hooks/useDirectories'
import DirectoryDeleteModal from './DirectoryDeleteModal'
import { enqueueSnackbar } from 'notistack'

const DirectoryList: FC = () => {
  const { directories, directoriesFileCount, isDeletingDirectory } = useDirectories()

  const handleOpenDirectory = (path: string): void => {
    ipcRenderer.send('open-directory', { path })
  }

  const [directoryIdToDelete, setDirectoryIdToDelete] = useState<number>()

  const handleRefreshSingleDirectoryError = (_: unknown, errMessage: string): void => {
    enqueueSnackbar(errMessage, { variant: 'error' })
  }

  const handleRefreshedSingleDirectory = (): void => {
    enqueueSnackbar('Directory refreshed', { variant: 'success' })
  }

  useEffect(() => {
    ipcRenderer.on('refresh-single-directory-error', handleRefreshSingleDirectoryError)
    ipcRenderer.on('refreshed-single-directory', handleRefreshedSingleDirectory)

    return () => {
      ipcRenderer.removeListener('refresh-single-directory-error', handleRefreshSingleDirectoryError)
      ipcRenderer.removeListener('refreshed-single-directory', handleRefreshedSingleDirectory)
    }
  }, [])

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
      <List>
        {
          directories?.map((directory) => (
            <ListItem
              key={directory.id}
            >
              <Tooltip title='Open directory' sx={{ mr: 1, ml: -2 }}>
                <IconButton
                  aria-label='open directory'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenDirectory(directory.path)
                  }}
                >
                  <Folder />
                </IconButton>
              </Tooltip>
              <ListItemText
                primary={
                  <>
                    {directory.name}
                    <Typography variant='caption' display='inline'>
                      {directoriesFileCount[directory.id]
                        ? ` (${new Intl.NumberFormat().format(directoriesFileCount[directory.id])
                        } files)`
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
                    ipcRenderer.send('refresh-single-directory', { directoryId: directory.id })
                  }}
                  color='primary'
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete directory'>
                <IconButton
                  aria-label='delete'
                  color='error'
                  onClick={(e) => {
                    e.stopPropagation()
                    setDirectoryIdToDelete(directory.id)
                  }}
                  disabled={isDeletingDirectory}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </ListItem>
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

export default DirectoryList

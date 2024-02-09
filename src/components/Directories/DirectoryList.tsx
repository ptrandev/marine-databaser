import { Delete } from '@mui/icons-material'
import { IconButton, List, ListItemText, ListItemButton, Typography, Box, LinearProgress } from '@mui/material'
import { ipcRenderer } from 'electron'
import { type FC, useState } from 'react'

import useDirectories from '@/hooks/useDirectories'
import DirectoryDeleteModal from './DirectoryDeleteModal'

const DirectoryList: FC = () => {
  const { directories, directoriesFileCount, isDeletingDirectory } = useDirectories()

  const handleOpenDirectory = (path: string) => {
    ipcRenderer.send('open-directory', { path })
  }

  const [directoryIdToDelete, setDirectoryIdToDelete] = useState<number>()

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
          directories?.map((directory: any) => (
            <ListItemButton
              key={directory.id}
              onClick={() => { handleOpenDirectory(directory.path) }}
            >
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
            </ListItemButton>
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

import { Delete } from "@mui/icons-material"
import { IconButton, List, ListItemText, ListItemButton, Typography, Box, LinearProgress } from "@mui/material"
import { ipcRenderer } from "electron"
import { FC, useEffect, useState } from "react"

import useDirectories from "@/hooks/useDirectories"

const DirectoryList: FC = () => {
  const { directories, directoriesFileCount, loadDirectories } = useDirectories()

  const [isDeletingDirectory, setIsDeletingDirectory] = useState<boolean>(false)

  const handleOpenDirectory = (path: string) => {
    ipcRenderer.send('open-directory', { path })
  }

  const handleDeleteDirectory = (directory_id: number) => {
    setIsDeletingDirectory(true)

    ipcRenderer.send('delete-directory', { directory_id })
    ipcRenderer.once('deleted-directory', () => {
      loadDirectories()
      setIsDeletingDirectory(false)
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('deleted-directory')
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
          directories?.map((directory: any) => (
            <ListItemButton
              key={directory.id}
              onClick={() => handleOpenDirectory(directory.path)}
            >
              <ListItemText
                primary={
                  <>
                    {directory.name}
                    <Typography variant='caption' display='inline'>
                      {directoriesFileCount[directory.id] ? ` (${new Intl.NumberFormat().format(directoriesFileCount[directory.id])
                        } files)` : ''}
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
                  handleDeleteDirectory(directory.id)
                }}
                disabled={isDeletingDirectory}
              >
                <Delete />
              </IconButton>
            </ListItemButton>
          ))
        }
      </List>
    </>
  )
}

export default DirectoryList
import { Delete } from "@mui/icons-material"
import { IconButton, List, ListItemText, ListItemButton, Typography } from "@mui/material"
import { ipcRenderer } from "electron"
import { FC, useEffect } from "react"

import useDirectories from "@/hooks/useDirectories"

const DirectoryList: FC = () => {
  const { directories, isLoadingDirectories, directoriesFileCount, loadDirectories } = useDirectories()

  const handleOpenDirectory = (path: string) => {
    ipcRenderer.send('open-directory', { path })
  }

  const handleDeleteDirectory = (directory_id: number) => {
    ipcRenderer.send('delete-directory', { directory_id })
    ipcRenderer.on('deleted-directory', () => {
      loadDirectories()
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('deleted-directory')
    }
  }, [])

    return (
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
                    {directoriesFileCount[directory.id] ? ` (${directoriesFileCount[directory.id]} files)` : ''}
                  </Typography>
                  </>
                }
                secondary={directory.path}
              />
              <IconButton
                aria-label='delete'
                size='large'
                color='error'
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteDirectory(directory.id)
                }}
              >
                <Delete />
              </IconButton>
            </ListItemButton>
          ))
        }
      </List>
    )
  }

  export default DirectoryList
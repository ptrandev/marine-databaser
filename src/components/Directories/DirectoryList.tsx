import { Delete } from "@mui/icons-material"
import { IconButton, List, ListItemText, ListItemButton, Typography, Stack } from "@mui/material"
import { ipcRenderer } from "electron"
import { FC, useEffect } from "react"

import { Directory } from "../../../electron/database/schemas"

interface DirectoryListProps {
  directories: Directory[]
  directoriesFileCount: Record<number, number>
  loadDirectories: () => void
}

const DirectoryList: FC<DirectoryListProps> = ({ directories, directoriesFileCount, loadDirectories }) => {
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
    console.log(directoriesFileCount)
  }, [directoriesFileCount])

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
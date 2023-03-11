import { Delete } from "@mui/icons-material"
import { IconButton, List, ListItemText, ListItemButton } from "@mui/material"
import { ipcRenderer } from "electron"
import { FC } from "react"

import { Directory } from "../../../electron/database/schemas"

interface DirectoryListProps {
  directories: Directory[]
  loadDirectories: () => void
}

const DirectoryList: FC<DirectoryListProps> = ({ directories, loadDirectories }) => {
  const handleOpenDirectory = (path: string) => {
    ipcRenderer.send('open-directory', { path })
  }

  const handleDeleteDirectory = (directory_id: number) => {
    ipcRenderer.send('delete-directory', { directory_id })
    ipcRenderer.on('deleted-directory', () => {
      loadDirectories()
    })
  }

    return (
      <List>
        {
          directories?.map((directory: any) => (
            <ListItemButton
              key={directory.id}
              onClick={() => handleOpenDirectory(directory.path)}
            >
              <ListItemText
                primary={directory.name}
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
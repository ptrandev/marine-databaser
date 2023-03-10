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
  return (
    <List>
      {
        directories?.map((directory: any) => (
          <ListItemButton
            key={directory.id}
            onClick={() => {
              ipcRenderer.send('open-directory', directory.path)
            }}
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
                ipcRenderer.send('delete-directory', directory.id)
                ipcRenderer.on('deleted-directory', () => {
                  loadDirectories()
                })
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
import { FC } from "react"
import { Typography, Button, List, ListItemButton, ListItemText } from "@mui/material"
const { ipcRenderer } = window.require('electron')

import { File } from "../../../electron/database/schemas"

interface FileListProps {
  files: File[]
}

const FileList: FC<FileListProps> = ({ files }) => {
  return (
    <List>
      {
        files?.map((file: any) => (
          <ListItemButton
            key={file.dataValues.id}
            onClick={() => {
              ipcRenderer.send('open-file', file.dataValues.path)
            }}
            sx={{
              pointerEvents: 'pointer',
              gap: 1,
            }}
          >
            <ListItemText
              primary={file.dataValues.name}
              secondary={file.dataValues.path}
            />
          </ListItemButton>
        ))
      }
    </List>
  )
}

export default FileList
import { FC } from "react"
import { Typography, Button, List, ListItemButton, ListItemText } from "@mui/material"
const { ipcRenderer } = window.require('electron')

import { File } from "../../../electron/database/schemas"
import { Virtuoso } from "react-virtuoso"

interface FileListProps {
  files: File[]
}

const FileList: FC<FileListProps> = ({ files }) => {
  return (
    <List>
      <Virtuoso
        style={{ height: 400 }}
        data={files}
        itemContent={(_, file) => (
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
        )}
      />
    </List>
  )
}

export default FileList
import { FC } from "react"
import { List, ListItemButton, ListItemText, IconButton } from "@mui/material"
import { ipcRenderer } from "electron"

import { File } from "../../../electron/database/schemas"
import { Virtuoso } from "react-virtuoso"
import { Tag } from "@mui/icons-material"

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
            <IconButton>
              <Tag/>
            </IconButton>
          </ListItemButton>
        )}
      />
    </List>
  )
}

export default FileList
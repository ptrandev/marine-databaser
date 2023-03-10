import { FC, useState, useEffect } from "react"
import { List, ListItemButton, ListItemText, IconButton, Box } from "@mui/material"
import { ipcRenderer } from "electron"

import { File } from "../../../electron/database/schemas"
import { Virtuoso } from "react-virtuoso"
import { Sell } from "@mui/icons-material"
import FileTagModal from "./FileTagModal"

interface FileListProps {
  files: File[]
}

const FileList: FC<FileListProps> = ({ files }) => {
  const [fileTagFile, setFileTagFile] = useState<File>()

  const handleFileTagModalClose = () => {
    setFileTagFile(undefined)
  }

  useEffect(() => {
    console.log(files[0])
  }, [])
  
  return (
    <>
      <List>
        <Virtuoso
          style={{ height: 400 }}
          data={files}
          itemContent={(_, file) => (
            <ListItemButton
              key={file.id}
              onClick={() => {
                ipcRenderer.send('open-file', file.path)
              }}
              sx={{
                pointerEvents: 'pointer',
                gap: 1,
              }}
            >
              <Box>
                <ListItemText
                  primary={file.name}
                  secondary={file.path}
                />
              </Box>
              <IconButton
                aria-label='tags'
                size='large'
                color='primary'
                onClick={(e) => {
                  e.stopPropagation()
                  setFileTagFile(file)
                }}
              >
                <Sell />
              </IconButton>
            </ListItemButton>
          )}
        />
      </List>
      {
        fileTagFile && (
          <FileTagModal open={!!fileTagFile} handleClose={handleFileTagModalClose} file={fileTagFile} />
        )
      }
    </>
  )
}

export default FileList
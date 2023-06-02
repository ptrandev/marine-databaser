import { FC, useState, useEffect } from "react"
import { List, ListItemButton, ListItemText, IconButton, Box, Chip, Typography, Stack } from "@mui/material"
import { ipcRenderer } from "electron"

import { File } from "../../../electron/database/schemas"
import { Virtuoso } from "react-virtuoso"
import { Sell } from "@mui/icons-material"
import FileTagModal from "./FileTagModal"

import { FileWithTags } from "@/types/FileWithTags"

interface FileListProps {
  files: FileWithTags[]
  loadFiles: () => void
}

const FileList: FC<FileListProps> = ({ files, loadFiles }) => {
  const [fileTagFile, setFileTagFile] = useState<FileWithTags>()

  const handleFileTagModalClose = () => {
    setFileTagFile(undefined)
    loadFiles()
  }

  const handleSetFileTagFile = (file: FileWithTags) => {
    setFileTagFile(file)
  }
  
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
              <Box width='100%'>
                <ListItemText
                  primary={file.name}
                  secondary={file.path}
                />
                {
                  file?.Tags?.length > 0 && (
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Typography variant='caption'>
                        Tags:
                      </Typography>
                      {
                        file?.Tags.map(tag => (
                          <Chip key={tag.id} label={tag.name} />
                        ))
                      }
                    </Stack>
                  )
                }
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
          <FileTagModal
            open={!!fileTagFile}
            handleClose={handleFileTagModalClose}
            file={fileTagFile}
            setFile={handleSetFileTagFile}
          />
        )
      }
    </>
  )
}

export default FileList
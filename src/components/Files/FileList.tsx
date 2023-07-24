import { FC, useState } from "react"
import { List, ListItem, ListItemText, IconButton, Box, Chip, Typography, Stack, Checkbox } from "@mui/material"
import { ipcRenderer } from "electron"

import { Virtuoso } from "react-virtuoso"
import { FileOpen, Sell, DriveFileRenameOutline } from "@mui/icons-material"
import FileTagsModal from "./FileTagsModal"
import FileRenameModal from "./FileRenameModal"

import { FileWithTags } from "../../../shared/types"
import useFiles from "@/hooks/useFiles"

const FileList: FC = () => {
  const { files, loadFiles, selectedFiles, updateSelectedFiles } = useFiles()

  const [fileTagFile, setFileTagFile] = useState<FileWithTags>()
  const [fileRenameFile, setFileRenameFile] = useState<FileWithTags>()

  const handleFileTagModalClose = () => {
    setFileTagFile(undefined)
    loadFiles()
  }

  const handleFileRenameModalClose = () => {
    setFileRenameFile(undefined)
    loadFiles()
  }

  const handleSetFileTagFile = (file: FileWithTags) => {
    setFileTagFile(file)
  }

  const handleSetFileRenameFile = (file: FileWithTags) => {
    setFileRenameFile(file)
  }

  return (
    <>
      <List>
        <Virtuoso
          style={{ height: 'calc(100vh - 64px - 128px - 72px - 64px)' }}
          data={files}
          itemContent={(_, file) => {
            const checked = selectedFiles?.includes(file.id)

            return (
              <ListItem
                key={file.id}
                sx={{
                  gap: 1,
                }}
              >
                <Checkbox
                  checked={checked}
                  onChange={(e) => {
                    e.stopPropagation()

                    updateSelectedFiles(
                      checked ?
                        selectedFiles.filter(id => id !== file.id) :
                        [...selectedFiles, file.id]
                    )
                  }}
                />
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
                  aria-label='rename'
                  size='large'
                  onClick={(e) => {
                    e.stopPropagation()
                    setFileRenameFile(file)
                  }}
                >
                  <DriveFileRenameOutline />
                </IconButton>
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
                <IconButton
                  aria-label='open'
                  size='large'
                  color='secondary'
                  onClick={(e) => {
                    e.stopPropagation()
                    ipcRenderer.send('open-file', file.path)
                  }}
                >
                  <FileOpen />
                </IconButton>
              </ListItem>
            )
          }}
        />
      </List>
      {
        fileTagFile && (
          <FileTagsModal
            open={!!fileTagFile}
            handleClose={handleFileTagModalClose}
            file={fileTagFile}
            setFile={handleSetFileTagFile}
          />
        )
      }
      {
        fileRenameFile && (
          <FileRenameModal
            open={!!fileRenameFile}
            handleClose={handleFileRenameModalClose}
            file={fileRenameFile}
            setFile={handleSetFileRenameFile}
          />
        )
      }
    </>
  )
}

export default FileList
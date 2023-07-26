import { FC, useState, useMemo } from "react"
import { List, ListItem, ListItemText, IconButton, Box, Chip, Typography, Stack, Checkbox } from "@mui/material"
import { ipcRenderer } from "electron"

import { Virtuoso } from "react-virtuoso"
import { FileOpen, Sell, DriveFileRenameOutline, Image, VideoFile, AudioFile, Description, Archive, SettingsApplications, HelpCenter } from "@mui/icons-material"
import FileTagsModal from "./FileTagsModal"
import FileRenameModal from "./FileRenameModal"

import { FileWithTags, MimeTypes } from "../../../shared/types"
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

            const fileIcon = () => {
              if (MimeTypes.image.some(type => file.mimeType?.includes(type))) {
                return <Image />
              } else if (MimeTypes.video.some(type => file.mimeType?.includes(type))) {
                return <VideoFile />
              } else if (MimeTypes.audio.some(type => file.mimeType?.includes(type))) {
                return <AudioFile />
              } else if (MimeTypes.document.some(type => file.mimeType?.includes(type))) {
                return <Description />
              } else if (MimeTypes.archive.some(type => file.mimeType?.includes(type))) {
                return <Archive />
              } else if (MimeTypes.executable.some(type => file.mimeType?.includes(type))) {
                return <SettingsApplications />
              } else {
                return <HelpCenter />
              }
            }

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
                  <Stack direction='row' gap={2} alignItems='center'>
                    {fileIcon()}
                    <ListItemText
                      primary={file.name}
                      secondary={file.path}
                    />
                  </Stack>
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
import { FC, useState, useMemo } from "react"
import { List, ListItem, ListItemText, IconButton, Box, Chip, Typography, Stack, Checkbox } from "@mui/material"
import { ipcRenderer } from "electron"

import { Virtuoso } from "react-virtuoso"
import { FileOpen, Sell, DriveFileRenameOutline, Image, VideoFile, AudioFile, Description, Archive, SettingsApplications, HelpCenter, NoteAlt, Plagiarism } from "@mui/icons-material"
import FileTagsModal from "./FileTagsModal"
import FileRenameModal from "./FileRenameModal"
import FileNotesModal from "./FileNotesModal"

import { FileWithMetadata, MimeTypes } from "../../../shared/types"
import useFiles from "@/hooks/useFiles"

const FileList: FC = () => {
  const { files, loadFiles, selectedFiles, updateSelectedFiles, searchTerm } = useFiles()

  const [fileTagFile, setFileTagFile] = useState<FileWithMetadata>()
  const [fileRenameFile, setFileRenameFile] = useState<FileWithMetadata>()
  const [fileNotesFile, setFileNotesFile] = useState<FileWithMetadata>()

  const handleFileTagModalClose = () => {
    setFileTagFile(undefined)
    loadFiles()
  }

  const handleFileRenameModalClose = () => {
    setFileRenameFile(undefined)
    loadFiles()
  }

  const handleSetFileTagFile = (file: FileWithMetadata) => {
    setFileTagFile(file)
  }

  const handleSetFileRenameFile = (file: FileWithMetadata) => {
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
                return <Image color='error' />
              } else if (MimeTypes.video.some(type => file.mimeType?.includes(type))) {
                return <VideoFile color='secondary' />
              } else if (MimeTypes.audio.some(type => file.mimeType?.includes(type))) {
                return <AudioFile color='success' />
              } else if (MimeTypes.document.some(type => file.mimeType?.includes(type))) {
                return <Description color='info' />
              } else if (MimeTypes.archive.some(type => file.mimeType?.includes(type))) {
                return <Archive color='warning' />
              } else if (MimeTypes.executable.some(type => file.mimeType?.includes(type))) {
                return <SettingsApplications color='primary' />
              } else {
                return <HelpCenter color='action' />
              }
            }

            const matchingNote = searchTerm ? file?.FileNotes?.find(note => note.note.includes(searchTerm))?.note : null

            return (
              <ListItem key={file.id}>
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
                  <Stack direction='row' gap={1} alignItems='center'>
                    {fileIcon()}
                    <ListItemText
                      primary={file.name}
                      secondary={file.path}
                    />
                  </Stack>
                  {
                    // TODO: make actually efficient
                    // if the file note matches the search query, display the first matching note
                    // make sure to highlight the search term
                    matchingNote && (
                      <Stack direction='row' spacing={1} mb={1} alignItems='center'>
                        <NoteAlt fontSize='small' />
                        <Typography variant='caption' noWrap>
                          {matchingNote?.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, index) =>
                            part.toLowerCase() === searchTerm.toLowerCase() ? <span key={index} style={{ backgroundColor: 'aqua' }}>{part}</span> : part
                          )}
                        </Typography>
                      </Stack>
                    )
                  }
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
                  onClick={(e) => {
                    e.stopPropagation()
                    setFileRenameFile(file)
                  }}
                >
                  <DriveFileRenameOutline />
                </IconButton>
                <IconButton
                  aria-label='notes'
                  color='success'
                  onClick={(e) => {
                    e.stopPropagation()
                    setFileNotesFile(file)
                  }}
                >
                  <NoteAlt />
                </IconButton>
                <IconButton
                  aria-label='tags'
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
      {
        fileNotesFile && (
          <FileNotesModal
            open={!!fileNotesFile}
            handleClose={() => setFileNotesFile(undefined)}
            file={fileNotesFile}
          />
        )
      }
    </>
  )
}

export default FileList
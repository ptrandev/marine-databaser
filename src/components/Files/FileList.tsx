import { type FC, useState, useEffect } from 'react'
import { List, ListItem, ListItemText, IconButton, Box, Chip, Typography, Stack, Checkbox, Badge, Tooltip, Menu, MenuItem, ListItemIcon } from '@mui/material'
import { ipcRenderer } from 'electron'

import { Virtuoso } from 'react-virtuoso'
import { Sell, DriveFileRenameOutline, Image, VideoFile, AudioFile, Description, Archive, SettingsApplications, HelpCenter, NoteAlt, MoreVert, FileOpen, Folder } from '@mui/icons-material'
import FileTagsModal from './FileTagsModal'
import FileRenameModal from './FileRenameModal'
import FileNotesModal from './FileNotesModal'

import { type FileWithMetadata, MimeTypes } from '../../../shared/types'
import useFiles from '@/hooks/useFiles'
import useFileParent from '@/hooks/useFileParent'
import { enqueueSnackbar } from 'notistack'

const FileList: FC = () => {
  const { files, loadFiles, selectedFiles, updateSelectedFiles, searchTerm } = useFiles()
  const { fileParentFiles } = useFileParent()

  const [fileTagFile, setFileTagFile] = useState<FileWithMetadata>()
  const [fileRenameFile, setFileRenameFile] = useState<FileWithMetadata>()
  const [fileNotesFile, setFileNotesFile] = useState<FileWithMetadata>()

  const [fileContextMenuAnchorEl, setFileContextMenuAnchorEl] = useState<null | HTMLElement>(null)

  const handleFileTagModalClose = (): void => {
    setFileTagFile(undefined)
    void loadFiles()
  }

  const handleFileRenameModalClose = (): void => {
    setFileRenameFile(undefined)
    void loadFiles()
  }

  const handleFileNotesModalClose = (): void => {
    setFileNotesFile(undefined)
    void loadFiles()
  }

  const handleSetFileTagFile = (file: FileWithMetadata): void => {
    setFileTagFile(file)
  }

  const handleSetFileRenameFile = (file: FileWithMetadata): void => {
    setFileRenameFile(file)
  }

  const handleOpenFileError = (_: unknown, errMessage: string): void => {
    enqueueSnackbar(`Error opening file: ${errMessage}`, { variant: 'error' })
  }

  const handleOpenFileFolderError = (_: unknown, errMessage: string): void => {
    enqueueSnackbar(`Error opening file folder: ${errMessage}`, { variant: 'error' })
  }

  useEffect(() => {
    ipcRenderer.on('open-file-error', handleOpenFileError)
    ipcRenderer.on('open-file-folder-error', handleOpenFileFolderError)

    return () => {
      ipcRenderer.removeListener('open-file-error', handleOpenFileError)
      ipcRenderer.removeListener('open-file-folder-error', handleOpenFileFolderError)
    }
  }, [])

  return (
    <>
      <List>
        <Virtuoso
          style={{ height: 'calc(100vh - 64px - 128px - 72px - 64px)' }}
          data={files}
          itemContent={(_, file) => {
            const checked = selectedFiles?.includes(file.id)

            const fileIcon = (): JSX.Element => {
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

            const fileChildren = fileParentFiles?.find(parent => parent.id === file.id)?.fileChildrenCount

            return (
              <ListItem key={file.id}>
                <Checkbox
                  checked={checked}
                  onChange={(e) => {
                    e.stopPropagation()

                    updateSelectedFiles(
                      checked
                        ? selectedFiles.filter(id => id !== file.id)
                        : [...selectedFiles, file.id]
                    )
                  }}
                />
                <Box width='100%'>
                  <Stack direction='row' gap={2} alignItems='center'>
                    <Tooltip title={`${file.mimeType} ${fileChildren ? `with ${fileChildren} child file${fileChildren > 1 ? 's' : ''} created` : ''}`}>
                      <Badge badgeContent={fileChildren} color='primary'>
                        {fileIcon()}
                      </Badge>
                    </Tooltip>
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
                <Tooltip title='Edit notes'>
                  <IconButton
                    aria-label='notes'
                    color='success'
                    onClick={(e) => {
                      e.stopPropagation()
                      setFileNotesFile(file)
                    }}
                  >
                    <Badge badgeContent={file?.FileNotes?.length} color='primary'>
                      <NoteAlt />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title='Edit tags'>
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
                </Tooltip>
                <Tooltip title='More options'>
                  <IconButton
                    aria-label='more options'
                    onClick={(e) => {
                      e.stopPropagation()
                      setFileContextMenuAnchorEl(e.currentTarget)
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
                <Menu
                  id='file-context-menu'
                  anchorEl={fileContextMenuAnchorEl}
                  open={Boolean(fileContextMenuAnchorEl)}
                  onClose={() => {
                    setFileContextMenuAnchorEl(null)
                  }}
                >
                  <MenuItem onClick={() => {
                    setFileRenameFile(file)
                    setFileContextMenuAnchorEl(null)
                  }}>
                    <ListItemIcon>
                      <DriveFileRenameOutline />
                    </ListItemIcon>
                    Rename file
                  </MenuItem>
                  <MenuItem onClick={() => {
                    ipcRenderer.send('open-file-folder', file.path)
                    setFileContextMenuAnchorEl(null)
                  }}>
                    <ListItemIcon>
                      <Folder />
                    </ListItemIcon>
                    Open file folder
                  </MenuItem>
                  <MenuItem onClick={() => {
                    ipcRenderer.send('open-file', file.path)
                    setFileContextMenuAnchorEl(null)
                  }}>
                    <ListItemIcon>
                      <FileOpen />
                    </ListItemIcon>
                    Open file
                  </MenuItem>
                </Menu>
              </ListItem>
            )
          }}
        />
      </List >
      {
        fileTagFile && (
          <FileTagsModal
            open={!!fileTagFile}
            onClose={handleFileTagModalClose}
            file={fileTagFile}
            setFile={handleSetFileTagFile}
          />
        )
      }
      {
        fileRenameFile && (
          <FileRenameModal
            open={!!fileRenameFile}
            onClose={handleFileRenameModalClose}
            file={fileRenameFile}
            setFile={handleSetFileRenameFile}
          />
        )
      }
      {
        fileNotesFile && (
          <FileNotesModal
            open={!!fileNotesFile}
            onClose={handleFileNotesModalClose}
            file={fileNotesFile}
          />
        )
      }
    </>
  )
}

export default FileList

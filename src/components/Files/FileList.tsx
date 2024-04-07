import { type FC, useState, useEffect, useMemo } from 'react'
import { List, ListItem, ListItemText, IconButton, Box, Chip, Typography, Stack, Checkbox, Badge, Tooltip, Menu, MenuItem, ListItemIcon } from '@mui/material'
import { ipcRenderer } from 'electron'

import { Virtuoso } from 'react-virtuoso'
import { Sell, DriveFileRenameOutline, Image, VideoFile, AudioFile, Description, Archive, SettingsApplications, HelpCenter, NoteAlt, MoreVert, FileOpen, Folder } from '@mui/icons-material'
import FileTagsModal from './FileTagsModal'
import FileRenameModal from './FileRenameModal'
import FileNotesModal from './FileNotesModal'
import FileSpliceVideoModal from './FileSpliceVideoModal'

import { type FileWithMetadata, MimeTypes } from '../../../shared/types'
import useFiles from '@/hooks/useFiles'
import useFileParent from '@/hooks/useFileParent'
import { enqueueSnackbar } from 'notistack'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { useNavigate } from 'react-router-dom'

const FileList: FC = () => {
  const nagivate = useNavigate()
  const { files, loadFiles } = useFiles()
  const { selectedVideo, updateSelectedVideo } = useSpliceVideo()

  const [fileTagFile, setFileTagFile] = useState<FileWithMetadata>()
  const [fileRenameFile, setFileRenameFile] = useState<FileWithMetadata>()
  const [fileNotesFile, setFileNotesFile] = useState<FileWithMetadata>()
  const [fileSpliceVideoFile, setFileSpliceVideoFile] = useState<FileWithMetadata>()

  const [fileContextMenuAnchorEl, setFileContextMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [fileMenuFile, setFileMenuFile] = useState<FileWithMetadata | null>()

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

  const handleSpliceVideo = (file: FileWithMetadata): void => {
    if (!selectedVideo) {
      updateSelectedVideo(file.path)

      // navigate to the video splice page
      nagivate('/splice-video')
    } else {
      setFileSpliceVideoFile(file)
    }
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
      <List sx={{ height: '100%' }}>
        <Virtuoso
          style={{ height: '100%' }}
          data={files}
          itemContent={(_, file) =>
            <FileListItem
              file={file}
              setFileNotesFile={setFileNotesFile}
              setFileTagFile={setFileTagFile}
              handleSpliceVideo={handleSpliceVideo}
              setFileContextMenuAnchorEl={setFileContextMenuAnchorEl}
              setFileMenuFile={setFileMenuFile}
            />
          }
        />
      </List>
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
      {
        fileSpliceVideoFile && (
          <FileSpliceVideoModal
            open={!!fileSpliceVideoFile}
            onClose={() => {
              setFileSpliceVideoFile(undefined)
            }}
            file={fileSpliceVideoFile}
          />
        )
      }
      {
        fileMenuFile && (
          <Menu
            id='file-context-menu'
            anchorEl={fileContextMenuAnchorEl}
            open={Boolean(fileContextMenuAnchorEl)}
            onClose={() => {
              setFileContextMenuAnchorEl(null)
              setFileMenuFile(null)
            }}
          >
            <MenuItem onClick={() => {
              setFileRenameFile(fileMenuFile)
              setFileContextMenuAnchorEl(null)
              setFileMenuFile(null)
            }}>
              <ListItemIcon>
                <DriveFileRenameOutline />
              </ListItemIcon>
              Rename file
            </MenuItem>
            <MenuItem onClick={() => {
              ipcRenderer.send('open-file-folder', fileMenuFile.path)
              setFileContextMenuAnchorEl(null)
              setFileMenuFile(null)
            }}>
              <ListItemIcon>
                <Folder />
              </ListItemIcon>
              Open file folder
            </MenuItem>
            <MenuItem onClick={() => {
              ipcRenderer.send('open-file', fileMenuFile.path)
              setFileContextMenuAnchorEl(null)
              setFileMenuFile(null)
            }}>
              <ListItemIcon>
                <FileOpen />
              </ListItemIcon>
              Open file
            </MenuItem>
          </Menu>
        )
      }
    </>
  )
}

interface FileListItemProps {
  file: FileWithMetadata
  setFileNotesFile: (file: FileWithMetadata) => void
  setFileTagFile: (file: FileWithMetadata) => void
  handleSpliceVideo: (file: FileWithMetadata) => void
  setFileContextMenuAnchorEl: (el: HTMLElement) => void
  setFileMenuFile: (file: FileWithMetadata) => void
}

const FileListItem: FC<FileListItemProps> = ({
  file,
  setFileNotesFile,
  setFileTagFile,
  handleSpliceVideo,
  setFileContextMenuAnchorEl,
  setFileMenuFile
}) => {
  const { selectedFiles, updateSelectedFiles, searchTerm } = useFiles()
  const { fileParentFiles } = useFileParent()

  const checked = useMemo(() => selectedFiles?.includes(file.id), [selectedFiles])

  const fileIcon = useMemo(() => {
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
  }, [file.mimeType])

  // there is a matching note if there a note contains the search term, convert note and search term to lowercase
  const matchingNote = useMemo(() => searchTerm ? file?.FileNotes?.find(note => note.note.toLowerCase().includes(searchTerm.toLowerCase()))?.note : false, [file.FileNotes, searchTerm])

  const fileChildren = useMemo(() => fileParentFiles?.find(parent => parent.id === file.id)?.fileChildrenCount, [fileParentFiles])

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
              {fileIcon}
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
      <Tooltip title='Open in splice video'>
        <IconButton
          aria-label='open in splice video'
          color='secondary'
          disabled={!MimeTypes.video.some(type => file.mimeType?.includes(type))}
          onClick={() => { handleSpliceVideo(file) }}
        >
          <VideoFile />
        </IconButton>
      </Tooltip>
      <Tooltip title='More options'>
        <IconButton
          aria-label='more options'
          onClick={(e) => {
            e.stopPropagation()
            setFileContextMenuAnchorEl(e.currentTarget)
            setFileMenuFile(file)
          }}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
    </ListItem>
  )
}

export default FileList

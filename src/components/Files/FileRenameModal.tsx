import { type FC, useEffect, useState } from 'react'
import { type FileWithMetadata } from '../../../shared/types'
import { Box, Stack, TextField, Button, Typography } from '@mui/material'
import { ipcRenderer } from 'electron'
import { Modal, type ModalProps } from '@/components/Modal'

interface FileRenameModalProps extends Omit<ModalProps, 'children'> {
  file: FileWithMetadata
  setFile: (file: FileWithMetadata) => void
}

const FileRenameModal: FC<FileRenameModalProps> = ({ open, onClose, file, setFile }) => {
  const [name, setName] = useState<string>(file.name)

  const onFileRename = (): void => {
    if (!name) return

    ipcRenderer.send('rename-file', { file, name })
  }

  const handleRenamedFile = (_: unknown, renamedFile: FileWithMetadata): void => {
    setFile(renamedFile)
    onClose()
  }

  useEffect(() => {
    ipcRenderer.on('renamed-file', handleRenamedFile)

    return () => {
      ipcRenderer.removeListener('renamed-file', handleRenamedFile)
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose}>
      <Stack spacing={2}>
        <Typography>
          {file.name}
        </Typography>
        <Box display='flex' component='form' onSubmit={(e) => {
          e.preventDefault()
          onFileRename()
        }} gap={2}>
          <TextField
            size='small'
            placeholder='Rename file...'
            value={name}
            onChange={(e) => { setName(e.target.value) }}
            fullWidth
            sx={{
              whiteSpace: 'nowrap'
            }}
          />
          <Box display='flex' alignItems='center'>
            <Button type='submit' sx={{
              whiteSpace: 'nowrap'
            }}
            variant='contained'
            >
              Rename File
            </Button>
          </Box>
        </Box>
      </Stack>
    </Modal>
  )
}

export default FileRenameModal

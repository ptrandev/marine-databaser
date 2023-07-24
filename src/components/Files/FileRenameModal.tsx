import { FC, useEffect } from 'react'
import { FileWithTags } from '../../../shared/types'
import { Box, Stack, TextField, Button, Typography } from '@mui/material'
import { useState } from 'react'
import { ipcRenderer } from 'electron'
import Modal from '@/components/Modal'

interface FileRenameModalProps {
  open: boolean
  handleClose: () => void
  file: FileWithTags
  setFile: (file: FileWithTags) => void
}

const FileRenameModal: FC<FileRenameModalProps> = ({ open, handleClose, file, setFile }) => {
  const [name, setName] = useState<string>(file.name)

  const onFileRename = () => {
    if (!name) return

    ipcRenderer.send('rename-file', { file, name })
    ipcRenderer.once('renamed-file', (_, renamedFile) => {
      setFile(renamedFile)
      handleClose()
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('renamed-file')
    }
  }, [])

  return (
    <Modal open={open} onClose={handleClose}>
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
            onChange={(e) => setName(e.target.value)}
            fullWidth
            sx={{
              whiteSpace: 'nowrap',
            }}
          />
          <Box display='flex' alignItems='center'>
            <Button type='submit' sx={{
              whiteSpace: 'nowrap',
            }}>
              Rename File
            </Button>
          </Box>
        </Box>
      </Stack>
    </Modal>
  )
}

export default FileRenameModal
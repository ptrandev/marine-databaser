import { FC, useEffect } from 'react'
import { FileWithTags } from '../../../shared/types'
import { Modal, Box, IconButton, Stack, TextField, Button, Typography, Card } from '@mui/material'
import { Close } from '@mui/icons-material'
import { useState } from 'react'
import { ipcRenderer } from 'electron'

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
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('renamed-file')
    }
  }, [])

  return (
    <Modal open={open} onClose={handleClose}>
      <Box display='flex' width='100%' height='100%' justifyContent='center' alignItems='center' p={4}>
        <Card sx={{
          position: 'relative',
          maxWidth: 500,
          width: '100%',
          p: 4,
        }}>
          <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <Close />
          </IconButton>
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
        </Card>
      </Box>
    </Modal>
  )
}

export default FileRenameModal
import { Close } from "@mui/icons-material"
import { Card, Modal, Typography, Box, Input, Button, IconButton, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { ipcRenderer } from "electron"
import { FC, useState } from "react"

import { File } from "../../../electron/database/schemas"

interface FileTagModalProps {
  open: boolean
  handleClose: () => void
  file: File
}

const FileTagModal: FC<FileTagModalProps> = ({ open, handleClose, file }) => {
  const [tag, setTag] = useState<string>('')

  const addTag = () => {
    if (!tag) return

    ipcRenderer.send('tag-file', { file, tag })
    setTag('')

    ipcRenderer.on('tagged-file', () => {
      handleClose()
    })
  }

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
          <Stack gap={2}>
            <Typography>
              {file.name}
            </Typography>
            <Box display='flex' component='form' onSubmit={(e) => {
              e.preventDefault()
              addTag()
            }} gap={2}>
              <TextField
                size='small'
                placeholder='Add a tag...'
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                fullWidth
                sx={{
                  whiteSpace: 'nowrap',
                }}
              />
              <Box display='flex' alignItems='center'>
                <Button type='submit' sx={{
                  whiteSpace: 'nowrap',
                }}>
                  Add Tag
                </Button>
              </Box>
            </Box>
          </Stack>
        </Card>
      </Box>
    </Modal>
  )
}

export default FileTagModal
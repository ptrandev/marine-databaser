import { Card, Modal, Typography, Box, Input, Button } from "@mui/material"
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
          maxWidth: 500,
          width: '100%',
          p: 4,
        }}>
          <Typography>
            {file.name}
          </Typography>
          <form onSubmit={addTag}>
            <Input
              placeholder='Add a tag...'
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
            <Button type='submit'>
              Add Tag
            </Button>
          </form>
        </Card>
      </Box>
    </Modal>
  )
}

export default FileTagModal
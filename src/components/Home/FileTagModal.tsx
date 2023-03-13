import { FileWithTags } from "@/types/FileWithTags"
import { Close } from "@mui/icons-material"
import { Card, Modal, Typography, Box, Chip, Button, IconButton, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { ipcRenderer } from "electron"
import { FC, useState } from "react"

interface FileTagModalProps {
  open: boolean
  handleClose: () => void
  file: FileWithTags
  setFile: (file: FileWithTags) => void
}

const FileTagModal: FC<FileTagModalProps> = ({ open, handleClose, file, setFile }) => {
  const [tag, setTag] = useState<string>('')

  const onAddTag = () => {
    if (!tag) return

    ipcRenderer.send('tag-file', { file, tag })
    setTag('')

    ipcRenderer.on('tagged-file', (_, fileTag) => {
      const newFile = { ...file } as FileWithTags
      newFile.Tags = [...newFile.Tags, { id: fileTag.tag_id, name: tag }] as any
      setFile(newFile)
    })
  }

  const handleDeleteTag = (tag_id: number) => {
    if (!tag_id) return
    const file_id : number = file.id

    ipcRenderer.send('untag-file', { file_id, tag_id })

    ipcRenderer.on('untagged-file', () => {
      const newFile = { ...file } as FileWithTags
      newFile.Tags = newFile.Tags.filter(tag => tag.id !== tag_id)
      setFile(newFile)
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
          <Stack spacing={2}>
            <Typography>
              {file.name}
            </Typography>
            <Box display='flex' component='form' onSubmit={(e) => {
              e.preventDefault()
              onAddTag()
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
            {
              file?.Tags?.length > 0 && (
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Typography variant='caption'>
                    Tags:
                  </Typography>
                  {
                    file?.Tags.map(tag => (
                      <Chip key={tag.id} label={tag.name} onDelete={() => handleDeleteTag(tag.id)} />
                    ))
                  }
                </Stack>
              )
            }
          </Stack>
        </Card>
      </Box>
    </Modal>
  )
}

export default FileTagModal
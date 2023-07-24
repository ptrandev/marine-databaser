import { FileWithTags } from "../../../shared/types"
import { Typography, Box, Chip, Button, Autocomplete, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { ipcRenderer } from "electron"
import { FC, useEffect, useState } from "react"
import useTags from "@/hooks/useTags"
import Modal from "@/components/Modal"

interface FileTagModalProps {
  open: boolean
  handleClose: () => void
  file: FileWithTags
  setFile: (file: FileWithTags) => void
}

const FileTagModal: FC<FileTagModalProps> = ({ open, handleClose, file, setFile }) => {
  const { tags, tagFile, untagFile } = useTags()

  const [tag, setTag] = useState<string>('')

  const onAddTag = async () => {
    if (!tag) return

    await tagFile(file.id, tag).then(fileTag => {
      const newFile = { ...file } as FileWithTags
      // @ts-ignore
      newFile.Tags = [...newFile.Tags, { id: fileTag.tag_id, name: tag }] as any
      setFile(newFile)
      setTag('')
    })
  }

  const handleDeleteTag = (tag_id: number) => {
    if (!tag_id) return
    const file_id: number = file.id

    untagFile(file_id, tag_id).then(() => {
      const newFile = { ...file } as FileWithTags
      newFile.Tags = newFile.Tags.filter(tag => tag.id !== tag_id) as any
      setFile(newFile)
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('tagged-file')
      ipcRenderer.removeAllListeners('untagged-file')
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
          onAddTag()
        }} gap={2}>
          <Autocomplete
            freeSolo
            size='small'
            fullWidth
            sx={{
              whiteSpace: 'nowrap',
            }}
            options={tags.map(tag => tag.name)}
            value={tag}
            onChange={(_, value) => setTag(value ?? '')}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder='Add a tag...'
                onChange={(e) => setTag(e.target.value)}
              />
            )}
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
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
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
    </Modal>
  )
}

export default FileTagModal
import { type FileWithMetadata } from '../../../shared/types'
import { Typography, Box, Chip, Button, Autocomplete, TextField } from '@mui/material'
import { Stack } from '@mui/system'
import { ipcRenderer } from 'electron'
import { type FC, useEffect, useMemo, useState } from 'react'
import useTags from '@/hooks/useTags'
import { Modal, type ModalProps } from '@/components/Modal'

interface FileTagModalProps extends Omit<ModalProps, 'children'> {
  file: FileWithMetadata
  setFile: (file: FileWithMetadata) => void
}

const FileTagsModal: FC<FileTagModalProps> = ({ open, onClose, file, setFile }) => {
  const { tags, tagFile, untagFile } = useTags()

  const [tag, setTag] = useState<string>('')

  const onAddTag = async (): Promise<void> => {
    if (!tag) return

    await tagFile(file.id, tag).then(fileTag => {
      // @ts-expect-error - this is a hack to get around the fact that the type of file.Tags is readonly
      const newFile: FileWithMetadata = { ...file }
      if (fileTag) {
        // @ts-expect-error - this is a hack to get around the fact that the type of file.Tags is readonly
        newFile.Tags = [...newFile.Tags, { id: fileTag.tag_id, name: tag }] as any
      }

      setFile(newFile)
    })

    setTag('')
  }

  const handleDeleteTag = async (tagId: number): Promise<void> => {
    const fileId: number = file.id

    await untagFile(fileId, tagId).then(() => {
      // @ts-expect-error - this is a hack to get around the fact that the type of file.Tags is readonly
      const newFile: FileWithMetadata = { ...file }
      newFile.Tags = newFile.Tags.filter(tag => tag.id !== tagId) as any
      setFile(newFile)
    })
  }

  const _tags = useMemo(() => {
    // only show tags that are not already on the file
    return tags.filter(tag => !file.Tags.map(t => t.id).includes(tag.id))
  }, [tags, file])

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('tagged-file')
      ipcRenderer.removeAllListeners('untagged-file')
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
          void onAddTag()
        }} gap={2}>
          <Autocomplete
            freeSolo
            size='small'
            fullWidth
            sx={{
              whiteSpace: 'nowrap'
            }}
            options={_tags.map(tag => tag.name)}
            value={tag}
            onChange={(_, value) => { setTag(value ?? '') }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder='Add a tag...'
                onChange={(e) => { setTag(e.target.value) }}
              />
            )}
          />
          <Box display='flex' alignItems='center'>
            <Button type='submit' sx={{
              whiteSpace: 'nowrap'
            }}
              variant='contained'
            >
              Add Tag
            </Button>
          </Box>
        </Box>
        {
          file?.Tags?.length > 0 && (
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
              <Typography variant='caption'>
                Tags:
              </Typography>
              {
                file?.Tags.map(tag => (
                  <Chip key={tag.id} label={tag.name} onDelete={() => { void handleDeleteTag(tag.id) }} />
                ))
              }
            </Stack>
          )
        }
      </Stack>
    </Modal>
  )
}

export default FileTagsModal

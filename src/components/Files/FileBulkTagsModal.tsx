import { type FC, useState, useMemo, useEffect } from 'react'
import Modal from '@/components/Modal'
import { Autocomplete, Box, TextField, Button, Stack, Typography, Chip } from '@mui/material'
import useTags from '@/hooks/useTags'
import useFiles from '@/hooks/useFiles'
import { type Tag } from '../../../electron/database/schemas'
import { type FileWithMetadata } from 'shared/types'

interface FileBulkTagsModalProps {
  open: boolean
  handleClose: () => void
}

const FileBulkTagsModal: FC<FileBulkTagsModalProps> = ({ open, handleClose }) => {
  const { tags, untagFiles, tagFiles } = useTags()
  const { files, selectedFiles } = useFiles()

  const [tag, setTag] = useState<string>('')
  // these are the files that are selected
  const [_files, setFiles] = useState<FileWithMetadata[]>([])

  // these are the tags that are on the selected files; ensure no duplicates
  const _tags = useMemo(() => {
    return _files.reduce<Tag[]>((acc, file) => {
      file.Tags.forEach(tag => {
        if (!acc.map(t => t.id).includes(tag.id)) {
          acc.push(tag)
        }
      })
      return acc
    }, [])
  }, [_files])

  const onAddTag = async (): Promise<void> => {
    if (!tag) return

    await tagFiles(selectedFiles, tag).then((fileTags) => {
      // for each file, add the tag to the file if it doesn't already exist
      const newFiles = _files.map(file => {
        // @ts-expect-error - this is a hack to get around the fact that the type of file is not correct for some reason
        if (fileTags.find(fileTag => fileTag?.file_id === file.id)) {
          // @ts-expect-error - this is a hack to get around the fact that the type of file is not correct for some reason
          file.Tags = [...file.Tags, { id: fileTags.find(fileTag => fileTag.file_id === file.id).tag_id, name: tag }] as any
        }

        return file
      })

      setFiles(newFiles)
    })

    setTag('')
  }

  const handleDeleteTag = async (tagId: number): Promise<void> => {
    await untagFiles(selectedFiles, tagId).then(() => {
      // remove the tag from the files
      const newFiles = _files.map(file => {
        file.Tags = file.Tags.filter(tag => tag.id !== tagId)
        return file
      })

      setFiles(newFiles)
    })
  }

  useEffect(() => {
    setFiles(files.filter(file => selectedFiles.includes(file.id as number)))
  }, [files, selectedFiles])

  return (
    <Modal open={open} onClose={handleClose}>
      <Stack spacing={2}>
        <Typography>
          {selectedFiles.length} files selected
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
            options={tags.map(tag => tag.name)}
            value={tag}
            onChange={(_, value) => { setTag(value as string ?? '') }}
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
          _tags?.length > 0 && (
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
              <Typography variant='caption'>
                Tags:
              </Typography>
              {
                _tags.map(tag => (
                  <Chip key={tag.id} label={tag.name} onDelete={() => { void handleDeleteTag(tag.id as number) }} />
                ))
              }
            </Stack>
          )
        }
      </Stack>
    </Modal>
  )
}

export default FileBulkTagsModal

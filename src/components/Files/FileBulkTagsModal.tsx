import { FC, useState, useMemo, useEffect } from "react"
import Modal from "@/components/Modal"
import { Autocomplete, Box, TextField, Button, Stack, Typography, Chip } from "@mui/material"
import useTags from "@/hooks/useTags"
import useFiles from "@/hooks/useFiles"
import { FileTag, Tag } from '../../../electron/database/schemas'
import { FileWithTags } from "shared/types"

interface FileBulkTagsModal {
  open: boolean
  handleClose: () => void
}

const FileBulkTagsModal: FC<FileBulkTagsModal> = ({ open, handleClose }) => {
  const { tags, untagFiles, tagFiles } = useTags()
  const { files, selectedFiles } = useFiles()

  const [tag, setTag] = useState<string>('')
  // these are the files that are selected
  const [_files, setFiles] = useState<FileWithTags[]>([])

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

  const onAddTag = async () => {
    if (!tag) return

    await tagFiles(selectedFiles, tag).then((fileTags) => {
      // for each file, add the tag to the file if it doesn't already exist
      const newFiles = _files.map(file => {
        // @ts-ignore
        if (fileTags.find(fileTag => fileTag?.file_id === file.id)) {
          // @ts-ignore
          file.Tags = [...file.Tags, { id: fileTags.find(fileTag => fileTag.file_id === file.id).tag_id, name: tag }] as any
        }

        return file
      })

      setFiles(newFiles)
    })

    setTag('')
  }

  const handleDeleteTag = async (tag_id: number) => {
    await untagFiles(selectedFiles, tag_id).then(() => {
      // remove the tag from the files
      const newFiles = _files.map(file => {
        file.Tags = file.Tags.filter(tag => tag.id !== tag_id)
        return file
      })

      setFiles(newFiles)
    })
  }

  useEffect(() => {
    setFiles(files.filter(file => selectedFiles.includes(file.id)))
  }, [files, selectedFiles])

  return (
    <Modal open={open} onClose={handleClose}>
      <Stack spacing={2}>
        <Typography>
          {selectedFiles.length} files selected
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
          _tags?.length > 0 && (
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
              <Typography variant='caption'>
                Tags:
              </Typography>
              {
                _tags.map(tag => (
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

export default FileBulkTagsModal
import { Checkbox, Box, IconButton, Stack } from '@mui/material'
import { FC, useState } from 'react'

import useFiles from '@/hooks/useFiles'
import { AudioFile, Sell } from '@mui/icons-material'
import useExtractAudio from '@/hooks/useExtractAudio'
import { useNavigate } from 'react-router-dom'
import FileBulkTagsModal from './FileBulkTagsModal'

const FileActions: FC = () => {
  const navigate = useNavigate()
  const { selectedFiles, updateSelectedFiles, files, loadFiles } = useFiles()
  const { updateSelectedFiles: updateSelectedExtractAudioFiles } = useExtractAudio()

  const [fileBulkTagsModalOpen, setFileBulkTagsModalOpen] = useState(false)

  const handleFileBulkTagsModalClose = () => {
    setFileBulkTagsModalOpen(false)
    loadFiles()
  }

  const handleBulkExtractAudio = () => {
    // associate selectedFiles with the filePath
    const filePaths: string[] = files?.filter(file => selectedFiles?.includes(file.id))?.map(file => file.path)

    updateSelectedExtractAudioFiles(filePaths)
    updateSelectedFiles([])

    // go to extract audio page
    navigate('/extract-audio')
  }

  return (
    <>
      <Box ml={2} mr={2.25} display='flex' justifyContent='space-between'>
        <Checkbox
          checked={selectedFiles?.length === files?.length && selectedFiles?.length > 0}
          indeterminate={selectedFiles?.length > 0 && selectedFiles?.length < files?.length}
          onChange={(e) => {
            e.stopPropagation()

            updateSelectedFiles(
              selectedFiles?.length === files?.length ?
                [] :
                files?.map(file => file.id)
            )
          }}
        />
        <Stack direction='row'>
          <IconButton disabled={selectedFiles?.length === 0} onClick={() => setFileBulkTagsModalOpen(true)}>
            <Sell />
          </IconButton>
          <IconButton onClick={handleBulkExtractAudio} disabled={selectedFiles?.length === 0}>
            <AudioFile />
          </IconButton>
        </Stack>
      </Box>
      <FileBulkTagsModal open={fileBulkTagsModalOpen} handleClose={handleFileBulkTagsModalClose} />
    </>
  )
}

export default FileActions
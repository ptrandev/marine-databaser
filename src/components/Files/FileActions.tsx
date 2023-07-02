import { Checkbox, Box, IconButton } from '@mui/material'
import { FC } from 'react'

import useFiles from '@/hooks/useFiles'
import { AudioFile } from '@mui/icons-material'
import useExtractAudio from '@/hooks/useExtractAudio'
import { useNavigate } from 'react-router-dom'

const FileActions: FC = () => {
  const navigate = useNavigate()
  const { selectedFiles, updateSelectedFiles, files } = useFiles()
  const { updateSelectedFiles : updateSelectedExtractAudioFiles } = useExtractAudio()

  const handleBulkExtractAudio = () => {
    // associate selectedFiles with the filePath
    const filePaths : string[] = files?.filter(file => selectedFiles?.includes(file.id))?.map(file => file.path)

    updateSelectedExtractAudioFiles(filePaths)
    updateSelectedFiles([])

    // go to extract audio page
    navigate('/audio')
  }

  return (
    <Box ml={2} mr={4.25} display='flex' justifyContent='space-between'>
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
      <Box>
        <IconButton onClick={handleBulkExtractAudio}>
          <AudioFile />
        </IconButton>
      </Box>
    </Box>
  )
}

export default FileActions
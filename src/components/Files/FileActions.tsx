import { Checkbox, Box, IconButton } from '@mui/material'
import { FC, useEffect } from 'react'

import useFiles from '@/hooks/useFiles'
import { AudioFile } from '@mui/icons-material'
import { ipcRenderer } from 'electron'

const FileActions: FC = () => {
  const { selectedFiles, updateSelectedFiles, files } = useFiles()

  const handleBulkExtractAudio = () => {
    ipcRenderer.send('bulk-extract-audio', { files: selectedFiles })

    ipcRenderer.on('bulk-extract-audio-complete', (event, arg) => {
      alert(arg)
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('bulk-extract-audio-complete')
    }
  }, [])

  return (
    <Box ml={2} mr={2.5} display='flex' justifyContent='space-between'>
      <Checkbox
        checked={selectedFiles?.length === files?.length}
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
        <IconButton onClick={() => handleBulkExtractAudio()}>
          <AudioFile />
        </IconButton>
      </Box>
    </Box>
  )
}

export default FileActions
import { FC, useEffect } from 'react'
import { Box, Button, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material'
import { ipcRenderer } from 'electron'
import useExtractAudio from '@/hooks/useExtractAudio'
import { Delete } from '@mui/icons-material'

const ExtractAudio: FC = () => {
  const { selectedFiles, updateSelectedFiles, handleExtractAudio, isExtractingAudio } = useExtractAudio()

  const handleSelectFiles = () => {
    ipcRenderer.send('select-extract-audio-files')

    ipcRenderer.on('selected-extract-audio-files', (_, files: string[]) => {
      // don't allow duplicates
      const newFiles = files.filter((file) => !selectedFiles.includes(file))
      updateSelectedFiles([...selectedFiles, ...newFiles])
    })
  }

  const handleDeleteFile = (file: string) => {
    updateSelectedFiles(selectedFiles.filter((f) => f !== file))
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('selected-extract-audio-files')
    }
  }, [])

  return (
    <Box>
      <Typography variant='h4'>
        Extract Audio
      </Typography>
      <Button variant='contained' onClick={handleSelectFiles} disabled={isExtractingAudio}>
        Select Files
      </Button>
      <Button disabled={isExtractingAudio || selectedFiles.length === 0} onClick={handleExtractAudio}>
        Extract Audio
      </Button>
      <List>
        {
          selectedFiles.map((file) => (
            <ListItem
              key={file}
              secondaryAction={
                <IconButton color='error' onClick={() => handleDeleteFile(file)}>
                  <Delete />
                </IconButton>
              }
            >
              <ListItemText>{file}</ListItemText>
            </ListItem>
          ))
        }
      </List>
    </Box>
  )
}

export default ExtractAudio
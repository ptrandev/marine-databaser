import { FC, useEffect } from 'react'
import { Box, Button, IconButton, List, ListItem, ListItemText, Typography, Stack, AppBar, LinearProgress, Toolbar } from '@mui/material'
import { ipcRenderer } from 'electron'
import useExtractAudio from '@/hooks/useExtractAudio'
import { Add, Delete } from '@mui/icons-material'

const ExtractAudio: FC = () => {
  const { selectedFiles, updateSelectedFiles, handleExtractAudio, isExtractingAudio, numCompletedFiles } = useExtractAudio()

  const handleSelectFiles = () => {
    ipcRenderer.send('select-extract-audio-files')
  }

  const handleDeleteFile = (file: string) => {
    updateSelectedFiles(selectedFiles.filter((f) => f !== file))
  }

  useEffect(() => {
    ipcRenderer.on('selected-extract-audio-files', (_, files: string[]) => {
      // don't allow duplicates
      const newFiles = files.filter((file) => !selectedFiles.includes(file))
      updateSelectedFiles([...selectedFiles, ...newFiles])
    })

    return () => {
      ipcRenderer.removeAllListeners('selected-extract-audio-files')
    }
  }, [])

  return (
    <>
      <Box mb={9}>
        <Stack flexWrap='wrap' direction='row' justifyContent='space-between' width='100%' mb={2} gap={2}>
          <Typography variant='h4'>
            Extract Audio
          </Typography>
          <Stack flexDirection='row' alignItems='center' gap={1}>
            <Box>
              <Button
                variant='contained'
                onClick={handleSelectFiles}
                disabled={isExtractingAudio}
                startIcon={
                  <Add />
                }
              >
                Add Files
              </Button>
            </Box>
          </Stack>
        </Stack>
        <List>
          {
            selectedFiles.map((file) => (
              <ListItem
                key={file}
                secondaryAction={
                  <IconButton color='error' onClick={() => handleDeleteFile(file)} disabled={isExtractingAudio}>
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={<Typography noWrap>{file}</Typography>}
                />
              </ListItem>
            ))
          }
        </List>
      </Box>
      <AppBar position='fixed' sx={{ top: 'auto', bottom: 0, bgcolor: 'background.paper' }}>
        <Toolbar>
          <LinearProgress
            variant='determinate'
            value={selectedFiles.length === 0 ? 0 : (numCompletedFiles / selectedFiles.length) * 100}
            sx={{ flexGrow: 1 }}
          />
          <Typography color='textPrimary' mx={2}>
            {numCompletedFiles} / {selectedFiles.length} completed
          </Typography>
          <Button variant='contained' disabled={isExtractingAudio || selectedFiles.length === 0} onClick={handleExtractAudio}>
            Extract Audio
          </Button>
        </Toolbar>
      </AppBar>
    </>
  )
}

export default ExtractAudio
import { FC, useEffect } from 'react'
import { Box, Button, Typography, Stack } from '@mui/material'
import { ipcRenderer } from 'electron'
import useExtractAudio from '@/hooks/useExtractAudio'
import { Add } from '@mui/icons-material'
import FileList from '@/components/ExtractAudio/FileList'
import Progress from '@/components/ExtractAudio/Progress'


const ExtractAudio: FC = () => {
  const { updateSelectedFiles, isExtractingAudio } = useExtractAudio()

  const handleSelectFiles = () => {
    ipcRenderer.send('select-extract-audio-files')
  }

  useEffect(() => {
    ipcRenderer.on('selected-extract-audio-files', (_, files: string[]) => {
      updateSelectedFiles(files)
    })

    return () => {
      ipcRenderer.removeAllListeners('selected-extract-audio-files')
    }
  }, [])

  return (
    <>
      <Box>
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
        <FileList />
      </Box>
      <Progress />
    </>
  )
}

export default ExtractAudio
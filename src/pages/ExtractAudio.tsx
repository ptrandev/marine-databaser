import { type FC, useEffect } from 'react'
import { Box, Button, Typography, Stack } from '@mui/material'
import { ipcRenderer } from 'electron'
import useExtractAudio from '@/hooks/useExtractAudio'
import { Add } from '@mui/icons-material'
import FileList from '@/components/ExtractAudio/FileList'
import Progress from '@/components/ExtractAudio/Progress'

const ExtractAudio: FC = () => {
  const { updateSelectedFiles, isExtractingAudio } = useExtractAudio()

  const handleSelectFiles = (): void => {
    ipcRenderer.send('select-extract-audio-files')
  }

  const handleExtractAudioFiles = (_: unknown, files: string[]): void => {
    updateSelectedFiles(files)
  }

  useEffect(() => {
    ipcRenderer.on('selected-extract-audio-files', handleExtractAudioFiles)

    return () => {
      ipcRenderer.removeListener('selected-extract-audio-files', handleExtractAudioFiles)
    }
  }, [])

  return (
    <>
      <Box>
        <Stack flexWrap='wrap' direction='row' justifyContent='space-between' width='100%' mb={2} gap={2} alignItems='center'>
          <Typography variant='h4'>
            Extract Audio
          </Typography>
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
        <FileList />
      </Box>
      <Progress />
    </>
  )
}

export default ExtractAudio

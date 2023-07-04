import { FC } from 'react'
import { AppBar, Toolbar, LinearProgress, Typography, Button } from '@mui/material'
import useExtractAudio from '@/hooks/useExtractAudio'

const Progress: FC = () => {
  const { selectedFiles, handleExtractAudio, isExtractingAudio, numCompletedFiles } = useExtractAudio()

  return (
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
  )
}

export default Progress
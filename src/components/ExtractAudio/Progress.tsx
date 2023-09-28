import { FC, useState } from 'react'
import { AppBar, Toolbar, LinearProgress, Typography, Button, Grid } from '@mui/material'
import useExtractAudio from '@/hooks/useExtractAudio'
import OptionsModal from './OptionsModal'

const Progress: FC = () => {
  const { selectedFiles, isExtractingAudio, numCompletedFiles } = useExtractAudio()

  const [optionsModalOpen, setOptionsModalOpen] = useState(false)

  return (
    <>
      <AppBar position='fixed' sx={{ top: 'auto', bottom: 0, bgcolor: 'background.paper' }}>
        <Toolbar>
          <Grid container spacing={2} alignItems='center'>
            <Grid item sx={{ flexGrow: 1 }}>
              <LinearProgress
                variant='determinate'
                value={selectedFiles.length === 0 ? 0 : (numCompletedFiles / selectedFiles.length) * 100}
                sx={{ flexGrow: 1 }}
              />
            </Grid>
            <Grid item>
              <Typography color='textPrimary'>
                {
                  selectedFiles.length > 0 && (
                    `${numCompletedFiles} / ${selectedFiles.length} completed`
                  )
                }
              </Typography>
            </Grid>
            <Grid item>
              <Button variant='contained' disabled={isExtractingAudio || selectedFiles.length === 0} onClick={() => setOptionsModalOpen(true)}>
                Extract Audio
              </Button>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <OptionsModal open={optionsModalOpen} onClose={() => setOptionsModalOpen(false)} />
    </>
  )
}

export default Progress
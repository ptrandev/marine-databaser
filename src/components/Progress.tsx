import { FC } from 'react'
import { AppBar, Toolbar, LinearProgress, Grid, Typography, Button } from '@mui/material'

interface ProgressProps {
  numCompleted: number
  totalToComplete: number
  isProcessing: boolean
  onProcess: () => void
  processText?: string
}

const Progress : FC<ProgressProps> = ({
  numCompleted,
  totalToComplete,
  isProcessing,
  onProcess,
  processText = 'Process'
}) => {
  return (
    <AppBar position='fixed' sx={{ top: 'auto', bottom: 0, bgcolor: 'background.paper' }}>
    <Toolbar>
      <Grid container spacing={2} alignItems='center'>
        <Grid item sx={{ flexGrow: 1 }} display='flex' flexDirection='row' alignItems='center'>
          <LinearProgress
            variant={
              numCompleted > 0 ? 'determinate' : isProcessing ? 'indeterminate' : 'determinate'
            }
            value={totalToComplete === 0 ? 0 : (numCompleted / totalToComplete) * 100}
            sx={{ flexGrow: 1 }}
          />
        </Grid>
        <Grid item>
          <Typography color='textPrimary'>
            {
              totalToComplete > 0 && (
                `${numCompleted} / ${totalToComplete} completed`
              )
            }
          </Typography>
        </Grid>
        <Grid item>
          <Button variant='contained' disabled={isProcessing || totalToComplete === 0} onClick={onProcess}>
            {processText}
          </Button>
        </Grid>
      </Grid>
    </Toolbar>
  </AppBar>
  )
}

export default Progress
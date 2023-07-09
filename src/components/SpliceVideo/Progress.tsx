import { FC } from 'react'
import { AppBar, Toolbar, LinearProgress, Typography, Button } from '@mui/material'
import useSpliceVideo from '@/hooks/useSpliceVideo'

const Progress: FC = () => {
  const { splicePoints, numSplicePointsCompleted, isSplicingVideo, handleSpliceVideo } = useSpliceVideo()

  return (
    <AppBar position='fixed' sx={{ top: 'auto', bottom: 0, bgcolor: 'background.paper' }}>
      <Toolbar>
        <LinearProgress
          variant='determinate'
          value={splicePoints.length === 0 ? 0 : (numSplicePointsCompleted / splicePoints.length) * 100}
          sx={{ flexGrow: 1 }}
        />
        <Typography color='textPrimary' mx={2}>
          {
            splicePoints.length > 0 && (
              `${numSplicePointsCompleted} / ${splicePoints.length} completed`
            )
          }
        </Typography>
        <Button variant='contained'
          disabled={isSplicingVideo || splicePoints.length === 0}
          onClick={handleSpliceVideo}
        >
          Splice Video
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default Progress
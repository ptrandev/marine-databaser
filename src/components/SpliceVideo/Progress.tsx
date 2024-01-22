import { FC, useState } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import OptionsModal from './OptionsModal'
import ProgressComponent from '../Progress'
import { Snackbar, Alert } from '@mui/material'

const Progress: FC = () => {
  const { splicePoints, numSplicePointsCompleted, isSplicingVideo, isUnsavedSplicePoints } = useSpliceVideo()

  const [optionsModalOpen, setOptionsModalOpen] = useState(false)

  const [showSnackbar, setShowSnackbar] = useState(false)

  const handleProcess = () => {
    if (isUnsavedSplicePoints) {
      setShowSnackbar(true)
      return
    }

    setOptionsModalOpen(true)
  }

  return (
    <>
      <ProgressComponent numCompleted={numSplicePointsCompleted} totalToComplete={splicePoints.length} isProcessing={isSplicingVideo} onProcess={handleProcess} processText='Splice Video' />
      <OptionsModal open={optionsModalOpen} onClose={() => setOptionsModalOpen(false)} />
      <Snackbar open={showSnackbar} onClose={() => setShowSnackbar(false)}>
        <Alert onClose={() => setShowSnackbar(false)} severity='warning' sx={{ width: '100%' }}>
          Ensure that all splice points have been confirmed. Click the checkmark icon next to each splice point to confirm or the clock icon to revert the splice point to its original values.
        </Alert>
      </Snackbar>
    </>
  )
}

export default Progress
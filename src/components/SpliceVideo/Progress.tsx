import { FC, useState } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import OptionsModal from './OptionsModal'
import ProgressComponent from '../Progress'
import { Snackbar, Alert } from '@mui/material'

const Progress: FC = () => {
  const { spliceRegions, numSplicePointsCompleted, isSplicingVideo, isUnsavedSplicePoints } = useSpliceVideo()

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
      <ProgressComponent numCompleted={numSplicePointsCompleted} totalToComplete={spliceRegions.length} isProcessing={isSplicingVideo} onProcess={handleProcess} processText='Splice Video' />
      <OptionsModal open={optionsModalOpen} onClose={() => setOptionsModalOpen(false)} />
      <Snackbar open={showSnackbar} onClose={() => setShowSnackbar(false)}>
        <Alert onClose={() => setShowSnackbar(false)} severity='warning' sx={{ width: '100%' }}>
          Ensure that all splice regions have been confirmed. Click the checkmark icon next to each splice region to confirm or the clock icon to revert the splice region to its original values.
        </Alert>
      </Snackbar>
    </>
  )
}

export default Progress
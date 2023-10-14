import { FC, useState } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import OptionsModal from './OptionsModal'
import ProgressComponent from '../Progress'

const Progress: FC = () => {
  const { splicePoints, numSplicePointsCompleted, isSplicingVideo, handleSpliceVideo } = useSpliceVideo()

  const [optionsModalOpen, setOptionsModalOpen] = useState(false)

  return (
    <>
      <ProgressComponent numCompleted={numSplicePointsCompleted} totalToComplete={splicePoints.length} isProcessing={isSplicingVideo} onProcess={() => setOptionsModalOpen(true)} processText='Splice Video' />
      <OptionsModal open={optionsModalOpen} onClose={() => setOptionsModalOpen(false)} />
    </>
  )
}

export default Progress
import { FC, useState } from 'react'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import OptionsModal from './OptionsModal'
import ProgressComponent from '../Progress'

const Progress: FC = () => {
  const { spliceRegions, numSpliceRegionsCompleted, isSplicingVideo } = useSpliceVideo()

  const [optionsModalOpen, setOptionsModalOpen] = useState(false)

  const handleProcess = () => {
    setOptionsModalOpen(true)
  }

  return (
    <>
      <ProgressComponent numCompleted={numSpliceRegionsCompleted} totalToComplete={spliceRegions.length} isProcessing={isSplicingVideo} onProcess={handleProcess} processText='Splice Video' />
      <OptionsModal open={optionsModalOpen} onClose={() => setOptionsModalOpen(false)} />
    </>
  )
}

export default Progress
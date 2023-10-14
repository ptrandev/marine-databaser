import { FC, useState } from 'react'
import useExtractAudio from '@/hooks/useExtractAudio'
import OptionsModal from './OptionsModal'
import ProgressComponent from '../Progress'

const Progress: FC = () => {
  const { selectedFiles, isExtractingAudio, numCompletedFiles } = useExtractAudio()

  const [optionsModalOpen, setOptionsModalOpen] = useState(false)

  return (
    <>
      <ProgressComponent numCompleted={numCompletedFiles} totalToComplete={selectedFiles.length} isProcessing={isExtractingAudio} onProcess={() => setOptionsModalOpen(true)} processText='Extract Audio' />
      <OptionsModal open={optionsModalOpen} onClose={() => setOptionsModalOpen(false)} />
    </>
  )
}

export default Progress
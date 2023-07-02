import { FC, createContext, useState, useMemo, useEffect } from 'react'
import { ipcRenderer } from 'electron'

export interface ExtractAudioContextValue {
  selectedFiles: string[]
  numCompletedFiles: number
  updateSelectedFiles: (files: string[]) => void
  isExtractingAudio: boolean
  handleExtractAudio: () => void
}

const ExtractAudioContext = createContext<ExtractAudioContextValue>(undefined as any)

interface ExtractAudioProviderProps {
  children: React.ReactNode
}

export const ExtractAudioProvider: FC<ExtractAudioProviderProps> = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isExtractingAudio, setIsExtractingAudio] = useState<boolean>(false)
  const [numCompletedFiles, setNumCompletedFiles] = useState<number>(0)

  const handleExtractAudio = () => {
    setIsExtractingAudio(true)

    ipcRenderer.send('bulk-extract-audio', { files: selectedFiles })
  }

  ipcRenderer.on('bulk-extract-audio', () => {
    setIsExtractingAudio(false)
    setSelectedFiles([])
    setNumCompletedFiles(0)
  })

  ipcRenderer.on('extracted-audio', () => {
    setNumCompletedFiles((prev) => prev + 1)
  })

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('bulk-extract-audio')
      ipcRenderer.removeAllListeners('extracted-audio')
    }
  }, [])

  const contextValue = useMemo(() => {
    return {
      selectedFiles,
      updateSelectedFiles: (files: string[]) => setSelectedFiles(files),
      isExtractingAudio,
      handleExtractAudio,
      numCompletedFiles
    }
  }, [selectedFiles, isExtractingAudio, numCompletedFiles])

  return (
    <ExtractAudioContext.Provider value={contextValue}>
      {children}
    </ExtractAudioContext.Provider>
  )
}

export default ExtractAudioContext
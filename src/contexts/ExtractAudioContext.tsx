import { FC, createContext, useState, useMemo, useEffect } from 'react'
import { ipcRenderer } from 'electron'

export interface ExtractAudioContextValue {
  selectedFiles: string[]
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

  const handleExtractAudio = () => {
    setIsExtractingAudio(true)

    ipcRenderer.send('bulk-extract-audio', { files: selectedFiles })

    ipcRenderer.on('bulk-extract-audio', () => {
      setIsExtractingAudio(false)
      setSelectedFiles([])
    })
  }

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('bulk-extract-audio')
    }
  }, [])

  const contextValue = useMemo(() => {
    return {
      selectedFiles,
      updateSelectedFiles: (files: string[]) => setSelectedFiles(files),
      isExtractingAudio,
      handleExtractAudio
    }
  }, [selectedFiles, isExtractingAudio])

  return (
    <ExtractAudioContext.Provider value={contextValue}>
      {children}
    </ExtractAudioContext.Provider>
  )
}

export default ExtractAudioContext
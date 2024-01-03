import { FC, createContext, useState, useMemo, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import { AudioFileFormat } from 'shared/types/Audio'
import { Alert, Snackbar } from '@mui/material'

export interface ExtractAudioContextValue {
  selectedFiles: string[]
  numCompletedFiles: number
  updateSelectedFiles: (files: string[]) => void
  deleteSelectedFiles: (files: string[]) => void
  isExtractingAudio: boolean
  handleExtractAudio: ({
    fileFormat,
    outputDirectory,
  }: {
    fileFormat?: AudioFileFormat
    outputDirectory?: string
  }) => void
}

const ExtractAudioContext = createContext<ExtractAudioContextValue>(undefined as any)

interface ExtractAudioProviderProps {
  children: React.ReactNode
}

export const ExtractAudioProvider: FC<ExtractAudioProviderProps> = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isExtractingAudio, setIsExtractingAudio] = useState<boolean>(false)
  const [numCompletedFiles, setNumCompletedFiles] = useState<number>(0)

  const [errorMessage, setErrorMessage] = useState<string|null>(null)

  const updateSelectedFiles = (files: string[]) => {
    // don't allow duplicates
    const newFiles = files.filter((file) => !selectedFiles.includes(file))
    setSelectedFiles([...selectedFiles, ...newFiles])
  }

  const deleteSelectedFiles = (files: string[]) => {
    setSelectedFiles(selectedFiles.filter((file) => !files.includes(file)))
  }

  const handleExtractAudio = ({
    fileFormat,
    outputDirectory,
  }: {
    fileFormat?: AudioFileFormat
    outputDirectory?: string
  }) => {
    setIsExtractingAudio(true)

    ipcRenderer.send('bulk-extract-audio', { files: selectedFiles, fileFormat, outputDirectory })

    ipcRenderer.once('bulk-extract-audio', () => {
      setIsExtractingAudio(false)
      setSelectedFiles([])
      setNumCompletedFiles(0)
    })
  }

  useEffect(() => {
    ipcRenderer.on('extracted-audio', () => {
      setNumCompletedFiles((prev) => prev + 1)
    })

    ipcRenderer.on('extracted-audio-failed', (_, err) => {
      setErrorMessage(err)
    })

    return () => {
      ipcRenderer.removeAllListeners('extracted-audio')
      ipcRenderer.removeAllListeners('extracted-audio-failed')
    }
  }, [])

  const contextValue = useMemo<ExtractAudioContextValue>(() => {
    return {
      selectedFiles,
      updateSelectedFiles,
      deleteSelectedFiles,
      isExtractingAudio,
      handleExtractAudio,
      numCompletedFiles
    }
  }, [selectedFiles, updateSelectedFiles, deleteSelectedFiles, isExtractingAudio, handleExtractAudio, numCompletedFiles])

  return (
    <ExtractAudioContext.Provider value={contextValue}>
      {children}
      <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={() => setErrorMessage(null)}>
        <Alert severity='error' onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </ExtractAudioContext.Provider>
  )
}

export default ExtractAudioContext
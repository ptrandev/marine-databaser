import { type FC, createContext, useState, useMemo, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import { type AudioFileFormat } from 'shared/types'
import { enqueueSnackbar } from 'notistack'

export interface ExtractAudioContextValue {
  selectedFiles: string[]
  numCompletedFiles: number
  updateSelectedFiles: (files: string[]) => void
  deleteSelectedFiles: (files: string[]) => void
  isExtractingAudio: boolean
  handleExtractAudio: ({
    fileFormat,
    outputDirectory
  }: {
    fileFormat?: AudioFileFormat
    outputDirectory?: string
  }) => void
}

const ExtractAudioContext = createContext<ExtractAudioContextValue | null>(null)

interface ExtractAudioProviderProps {
  children?: React.ReactNode
}

export const ExtractAudioProvider: FC<ExtractAudioProviderProps> = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isExtractingAudio, setIsExtractingAudio] = useState<boolean>(false)
  const [numCompletedFiles, setNumCompletedFiles] = useState<number>(0)

  const updateSelectedFiles = (files: string[]): void => {
    // don't allow duplicates
    const newFiles = files.filter((file) => !selectedFiles.includes(file))
    setSelectedFiles([...selectedFiles, ...newFiles])
  }

  const deleteSelectedFiles = (files: string[]): void => {
    setSelectedFiles(selectedFiles.filter((file) => !files.includes(file)))
  }

  const handleExtractAudio = ({
    fileFormat,
    outputDirectory
  }: {
    fileFormat?: AudioFileFormat
    outputDirectory?: string
  }): void => {
    setIsExtractingAudio(true)

    ipcRenderer.send('bulk-extract-audio', { files: selectedFiles, fileFormat, outputDirectory })
  }

  const handleBulkExtractedAudio = (): void => {
    setIsExtractingAudio(false)
    setNumCompletedFiles(0)
  }

  const handleExtractedAudio = (): void => {
    setNumCompletedFiles((prev) => prev + 1)
  }

  const handleExtractedAudioError = (_: unknown, errMessage: string): void => {
    enqueueSnackbar(`Error extracting audio: ${errMessage}`, { variant: 'error' })
  }

  useEffect(() => {
    ipcRenderer.on('extracted-audio', handleExtractedAudio)
    ipcRenderer.on('extracted-audio-error', handleExtractedAudioError)
    ipcRenderer.on('bulk-extract-audio', handleBulkExtractedAudio)

    return () => {
      ipcRenderer.removeListener('extracted-audio', handleExtractedAudio)
      ipcRenderer.removeListener('extracted-audio-error', handleExtractedAudioError)
      ipcRenderer.removeListener('bulk-extract-audio', handleBulkExtractedAudio)
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
    </ExtractAudioContext.Provider>
  )
}

export default ExtractAudioContext

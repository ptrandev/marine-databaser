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

    ipcRenderer.once('bulk-extract-audio', () => {
      setIsExtractingAudio(false)
      setNumCompletedFiles(0)
    })
  }

  useEffect(() => {
    ipcRenderer.on('extracted-audio', () => {
      setNumCompletedFiles((prev) => prev + 1)
    })

    ipcRenderer.on('extracted-audio-error', (_, errMessage) => {
      enqueueSnackbar(`Error extracting audio: ${errMessage}`, { variant: 'error' })
    })

    return () => {
      ipcRenderer.removeAllListeners('extracted-audio')
      ipcRenderer.removeAllListeners('extracted-audio-error')
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

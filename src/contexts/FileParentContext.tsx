import { type FC, createContext, useState, useEffect } from 'react'
import { type File } from '../../electron/database/schemas'
import useFiles from '@/hooks/useFiles'
import { ipcRenderer } from 'electron'

interface FileParentFile extends File {
  fileChildrenCount: number
}

export interface FileParentContextValue {
  fileParentFiles: FileParentFile[]
}

const FileParentContext = createContext<FileParentContextValue | null>(null)

interface FileParentProviderProps {
  children?: React.ReactNode
}

export const FileParentProvider: FC<FileParentProviderProps> = ({ children }) => {
  const { files } = useFiles()

  const [fileParentFiles, setFileParentFiles] = useState<FileParentFile[]>([])

  const handleListFileParents = async (): Promise<void> => {
    ipcRenderer.send('list-file-parents')
  }

  const handleListedFileParents = (_: unknown, fileParents: FileParentFile[]): void => {
    setFileParentFiles(fileParents)
  }

  useEffect(() => {
    void handleListFileParents()
  }, [files])

  useEffect(() => {
    ipcRenderer.on('listed-file-parents', handleListedFileParents)

    return () => {
      ipcRenderer.removeListener('listed-file-parents', handleListedFileParents)
    }
  }, [])

  return (
    <FileParentContext.Provider value={{ fileParentFiles }}>
      {children}
    </FileParentContext.Provider>
  )
}

export default FileParentContext

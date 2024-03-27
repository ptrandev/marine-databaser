import { type FC, createContext, useState, useEffect } from 'react'
import { type File } from '../../electron/database/schemas'
import useFiles from '@/hooks/useFiles'
import { ipcRenderer } from 'electron'

interface FileParent extends File {
  fileChildrenCount: number
}

export interface FileParentContextValue {
  fileParents: FileParent[]
}

const FileParentContext = createContext<FileParentContextValue | null>(null)

interface FileParentProviderProps {
  children?: React.ReactNode
}

export const FileParentProvider: FC<FileParentProviderProps> = ({ children }) => {
  const { files } = useFiles()

  const [fileParents, setFileParents] = useState<FileParent[]>([])

  const handleListFileParents = async (): Promise<void> => {
    ipcRenderer.send('list-file-parents')
  }

  const handleListedFileParents = (_: unknown, fileParents: FileParent[]): void => {
    setFileParents(fileParents)
  }

  useEffect(() => {
    void handleListFileParents()
  }, [files])

  useEffect(() => {
    console.log('fileParents', fileParents)
  }, [fileParents])

  useEffect(() => {
    ipcRenderer.on('listed-file-parents', handleListedFileParents)

    return () => {
      ipcRenderer.removeListener('listed-file-parents', handleListedFileParents)
    }
  }, [])

  return (
    <FileParentContext.Provider value={{ fileParents }}>
      {children}
    </FileParentContext.Provider>
  )
}

export default FileParentContext

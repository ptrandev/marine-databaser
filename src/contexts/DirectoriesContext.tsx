import { FC, createContext, useState, useEffect, useMemo } from 'react'
import { ipcRenderer } from 'electron'
import { Directory } from '../../electron/database/schemas'

export interface DirectoriesContextValue {
  directories: Directory[]
  directoriesFileCount: Record<number, number>
  loadDirectories: () => void
  isLoadingDirectories: boolean
  isInitializingDirectory: boolean
  handleIsInitializingDirectory: (initializingDirectory: boolean) => void
}

const DirectoriesContext = createContext<DirectoriesContextValue>(undefined as any)

interface DirectoriesProviderProps {
  children: React.ReactNode
}

export const DirectoriesProvider: FC<DirectoriesProviderProps> = ({ children }) => {
  const [directories, setDirectories] = useState<Directory[]>([])

  const [directoriesFileCount, setDirectoriesFileCount] = useState<Record<number, number>>({})

  const [isLoadingDirectories, setIsLoadingDirectories] = useState<boolean>(true)
  const [isInitializingDirectory, setIsInitializingDirectory] = useState<boolean>(false)

  const loadDirectories = () => {
    setIsLoadingDirectories(true)

    ipcRenderer.send('list-directories')
    ipcRenderer.send('list-directories-file-count')
  }

  const handleIsInitializingDirectory = (isInitializingDirectory: boolean) => {
    setIsInitializingDirectory(isInitializingDirectory)
  }

  useEffect(() => {
    loadDirectories()

    ipcRenderer.on('listed-directories', (_, directories) => {
      setDirectories(directories)
      setIsLoadingDirectories(false)
    })
  
    ipcRenderer.on('listed-directories-file-count', (_, directoriesFileCount) => {
      setDirectoriesFileCount(directoriesFileCount)
    })

    return () => {
      ipcRenderer.removeAllListeners('listed-directories')
      ipcRenderer.removeAllListeners('listed-directories-file-count')
    }
  }, [])

  const contextValue = useMemo(() => {
    return {
      directories,
      isLoadingDirectories,
      directoriesFileCount,
      isInitializingDirectory,
      loadDirectories,
      handleIsInitializingDirectory
    }
  }, [directories, isLoadingDirectories, isInitializingDirectory, directoriesFileCount, loadDirectories, handleIsInitializingDirectory])

  return (
    <DirectoriesContext.Provider value={contextValue}>
      {children}
    </DirectoriesContext.Provider>
  )
}

export default DirectoriesContext
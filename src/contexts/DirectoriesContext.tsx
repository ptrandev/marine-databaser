import { FC, createContext, useState, useEffect, useMemo } from 'react'
import { ipcRenderer } from 'electron'
import { Directory } from '../../electron/database/schemas'

export interface DirectoriesContextValue {
  directories: Directory[]
  isLoadingDirectories: boolean
  directoriesFileCount: Record<number, number>
  loadDirectories: () => void
  isInitializingDirectory: boolean
  handleIsInitializingDirectory: (initializingDirectory: boolean) => void
}

const DirectoriesContext = createContext<DirectoriesContextValue>(undefined as any)

interface DirectoriesProviderProps {
  children: React.ReactNode
}

export const DirectoriesProvider: FC<DirectoriesProviderProps> = ({ children }) => {
  const [directories, setDirectories] = useState<Directory[]>([])
  const [isLoadingDirectories, setIsLoadingDirectories] = useState<boolean>(true)

  const [directoriesFileCount, setDirectoriesFileCount] = useState<Record<number, number>>({})
  const [isInitializingDirectory, setIsInitializingDirectory] = useState<boolean>(false)

  const loadDirectories = () => {
    setIsLoadingDirectories(true)

    ipcRenderer.send('list-directories')
    ipcRenderer.on('listed-directories', (_, directories) => {
      setDirectories(directories)
      setIsLoadingDirectories(false)
    })

    ipcRenderer.send('list-directories-file-count')
    ipcRenderer.on('listed-directories-file-count', (_, directoriesFileCount) => {
      setDirectoriesFileCount(directoriesFileCount)
    })
  }

  const handleIsInitializingDirectory = (isInitializingDirectory: boolean) => {
    setIsInitializingDirectory(isInitializingDirectory)
  }

  useEffect(() => {
    loadDirectories()
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
  }, [directories, isLoadingDirectories, directoriesFileCount])

  return (
    <DirectoriesContext.Provider value={contextValue}>
      {children}
    </DirectoriesContext.Provider>
  )
}

export default DirectoriesContext
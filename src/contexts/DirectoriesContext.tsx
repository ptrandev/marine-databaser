import { FC, createContext, useState, useEffect, useMemo } from 'react'
import { ipcRenderer } from 'electron'
import { Directory } from '../../electron/database/schemas'

export interface DirectoriesContextValue {
  directories: Directory[]
  directoriesFileCount: Record<number, number>
  loadDirectories: () => Promise<any>
  isLoadingDirectories: boolean
  isInitializingDirectory: boolean
  isDeletingDirectory: boolean
  handleIsInitializingDirectory: (initializingDirectory: boolean) => void
  handleDeleteDirectory: (directoryId: number) => void
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
  const [isDeletingDirectory, setIsDeletingDirectory] = useState<boolean>(false)

  const loadDirectories = async () => {
    setIsLoadingDirectories(true)

    ipcRenderer.send('list-directories')
    ipcRenderer.send('list-directories-file-count')

    // return and await two promises for listed-directories and listed-directories-file-count
    return Promise.all([
      new Promise((resolve) => {
        ipcRenderer.once('listed-directories', (_, directories) => {
          setDirectories(directories)
          setIsLoadingDirectories(false)
          resolve(true)
        })
      }),
      new Promise((resolve) => {
        ipcRenderer.once('listed-directories-file-count', (_, directoriesFileCount) => {
          setDirectoriesFileCount(directoriesFileCount)
          resolve(true)
        })
      })
    ])
  }

  const handleIsInitializingDirectory = (isInitializingDirectory: boolean) => {
    setIsInitializingDirectory(isInitializingDirectory)
  }

  const handleDeleteDirectory = (directoryId: number) => {
    setIsDeletingDirectory(true)

    ipcRenderer.send('delete-directory', { directoryId })

    ipcRenderer.once('deleted-directory', () => {
      loadDirectories()
      setIsDeletingDirectory(false)
    })
  }

  useEffect(() => {
    loadDirectories()
  }, [])

  const contextValue = useMemo<DirectoriesContextValue>(() => {
    return {
      directories,
      isLoadingDirectories,
      directoriesFileCount,
      isInitializingDirectory,
      loadDirectories,
      handleIsInitializingDirectory,
      isDeletingDirectory,
      handleDeleteDirectory
    }
  }, [directories, isLoadingDirectories, isInitializingDirectory, directoriesFileCount, loadDirectories, handleIsInitializingDirectory, isDeletingDirectory, handleDeleteDirectory])

  return (
    <DirectoriesContext.Provider value={contextValue}>
      {children}
    </DirectoriesContext.Provider>
  )
}

export default DirectoriesContext
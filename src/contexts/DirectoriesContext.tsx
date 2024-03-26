import { type FC, createContext, useState, useEffect, useMemo } from 'react'
import { ipcRenderer } from 'electron'
import { type Directory } from '../../electron/database/schemas'

export interface DirectoriesContextValue {
  directories: Directory[]
  directoriesFileCount: Record<number, number>
  loadDirectories: () => Promise<void>
  isLoadingDirectories: boolean
  isInitializingDirectory: boolean
  isDeletingDirectory: boolean
  handleIsInitializingDirectory: (initializingDirectory: boolean) => void
  handleDeleteDirectory: (directoryId: number) => void
}

const DirectoriesContext = createContext<DirectoriesContextValue | null>(null)

interface DirectoriesProviderProps {
  children?: React.ReactNode
}

export const DirectoriesProvider: FC<DirectoriesProviderProps> = ({ children }) => {
  const [directories, setDirectories] = useState<Directory[]>([])

  const [directoriesFileCount, setDirectoriesFileCount] = useState<Record<number, number>>({})

  const [isLoadingDirectories, setIsLoadingDirectories] = useState<boolean>(true)
  const [isInitializingDirectory, setIsInitializingDirectory] = useState<boolean>(false)
  const [isDeletingDirectory, setIsDeletingDirectory] = useState<boolean>(false)

  const loadDirectories = async (): Promise<void> => {
    setIsLoadingDirectories(true)

    ipcRenderer.send('list-directories')
    ipcRenderer.send('list-directories-file-count')

    // await two promises for listed-directories and listed-directories-file-count
    await Promise.all([
      new Promise<void>((resolve) => {
        ipcRenderer.once('listed-directories', (_, directories: Directory[]) => {
          setDirectories(directories)
          setIsLoadingDirectories(false)
          resolve()
        })
      }),
      new Promise<void>((resolve) => {
        ipcRenderer.once('listed-directories-file-count', (_, directoriesFileCount: Record<number, number>) => {
          setDirectoriesFileCount(directoriesFileCount)
          resolve()
        })
      })
    ])
  }

  const handleIsInitializingDirectory = (isInitializingDirectory: boolean): void => {
    setIsInitializingDirectory(isInitializingDirectory)
  }

  const handleDeleteDirectory = (directoryId: number): void => {
    setIsDeletingDirectory(true)

    ipcRenderer.send('delete-directory', { directoryId })
  }

  const handleDeletedDirectory = (): void => {
    void loadDirectories()
    setIsDeletingDirectory(false)
  }

  useEffect(() => {
    void loadDirectories()

    ipcRenderer.on('deleted-directory', handleDeletedDirectory)

    return () => {
      ipcRenderer.removeListener('deleted-directory', handleDeletedDirectory)
    }
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

import { type FC, createContext, useState, useEffect, useMemo } from 'react'
import { ipcRenderer } from 'electron'
import { type Directory } from '../../electron/database/schemas'
import DirectoryRefreshModal from '@/contexts/DirectoryRefreshModal'
import DirectoryLocationModal from '@/contexts/DirectoryLocationModal'

export interface DirectoriesContextValue {
  directories: Directory[]
  directoriesFileCount: Record<number, number>
  loadDirectories: () => Promise<void>
  isLoadingDirectories: boolean
  isInitializingDirectory: boolean
  isDeletingDirectory: boolean
  isRefreshingDirectories: boolean
  updateIsRefreshingDirectories: (isRefreshingDirectories: boolean) => void
  handleIsInitializingDirectory: (initializingDirectory: boolean) => void
  handleDeleteDirectory: (directoryId: number) => Promise<void>
  handleRefreshDirectories: (directoryIds: number[]) => void
  handleSetDirectoryLocation: (directoryId: number | null) => void
  isSettingDirectoryLocation: boolean
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

  const [isRefreshingDirectories, setIsRefreshingDirectories] = useState<boolean>(false)
  const [refreshDirectories, setRefreshDirectories] = useState<number[]>([])
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState<boolean>(false)

  const [settingDirectoryLocationDirectory, setSettingDirectoryLocationDirectory] = useState<number | null>(null)

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

  const handleDeleteDirectory = async (directoryId: number): Promise<void> => {
    setIsDeletingDirectory(true)

    await new Promise<void>((resolve) => {
      ipcRenderer.send('delete-directory', { directoryId })

      ipcRenderer.once('deleted-directory', () => {
        resolve()
      })
    })
  }

  const handleDeletedDirectory = (): void => {
    void loadDirectories()
    setIsDeletingDirectory(false)
  }

  const handleRefreshDirectories = (directoryIds: number[]): void => {
    setIsRefreshingDirectories(true)
    setIsRefreshModalOpen(true)

    setRefreshDirectories(directoryIds)
  }

  const handleRefreshedDirectories = (): void => {
    void loadDirectories()
    setIsRefreshingDirectories(false)
  }

  const handleSetDirectoryLocation = (directoryId: number | null): void => {
    setSettingDirectoryLocationDirectory(directoryId)
  }

  const updateIsRefreshingDirectories = (isRefreshingDirectories: boolean): void => {
    setIsRefreshingDirectories(isRefreshingDirectories)
  }

  useEffect(() => {
    void loadDirectories()

    ipcRenderer.on('deleted-directory', handleDeletedDirectory)
    ipcRenderer.on('refreshed-directories', handleRefreshedDirectories)

    return () => {
      ipcRenderer.removeListener('deleted-directory', handleDeletedDirectory)
      ipcRenderer.removeListener('refreshed-directories', handleRefreshedDirectories)
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
      handleDeleteDirectory,
      isRefreshingDirectories,
      handleRefreshDirectories,
      updateIsRefreshingDirectories,
      handleSetDirectoryLocation
    }
  }, [directories, isLoadingDirectories, isInitializingDirectory, directoriesFileCount, loadDirectories, handleIsInitializingDirectory, isDeletingDirectory, handleDeleteDirectory, isRefreshingDirectories, handleRefreshDirectories, updateIsRefreshingDirectories, handleSetDirectoryLocation])

  return (
    <DirectoriesContext.Provider value={contextValue}>
      {children}
      {
        isRefreshModalOpen && (
          <DirectoryRefreshModal
            open={isRefreshModalOpen}
            onClose={() => { setIsRefreshModalOpen(false) }}
            directoryIds={refreshDirectories}
          />
        )
      }
      {
        settingDirectoryLocationDirectory !== null && (
          <DirectoryLocationModal
            open={settingDirectoryLocationDirectory !== null}
            onClose={() => { handleSetDirectoryLocation(null) }}
            directoryId={settingDirectoryLocationDirectory}
          />
        )
      }
    </DirectoriesContext.Provider>
  )
}

export default DirectoriesContext

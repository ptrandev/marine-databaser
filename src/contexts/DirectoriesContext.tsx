import { type FC, createContext, useState, useEffect, useMemo } from 'react'
import { ipcRenderer } from 'electron'
import { type Directory } from '../../electron/database/schemas'
import DirectoryRefreshModal from '@/contexts/DirectoryRefreshModal'
import DirectoryLocationModal from '@/contexts/DirectoryLocationModal'

export interface DirectoriesContextValue {
  directories: Directory[]
  directoriesFileCount: Record<number, number>
  directoriesAccess: Record<number, boolean>
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
}

const DirectoriesContext = createContext<DirectoriesContextValue | null>(null)

interface DirectoriesProviderProps {
  children?: React.ReactNode
}

export const DirectoriesProvider: FC<DirectoriesProviderProps> = ({ children }) => {
  const [directories, setDirectories] = useState<Directory[]>([])

  const [directoriesFileCount, setDirectoriesFileCount] = useState<Record<number, number>>({})
  const [directoriesAccess, setDirectoriesAccess] = useState<Record<number, boolean>>({})

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

  const handleListDirectoriesAccess = (directoryIds: number[]): void => {
    ipcRenderer.send('list-directories-access', { directoryIds })
  }

  const handleListedDirectoriesAccess = (_: unknown, directoriesAccess: Record<number, boolean>): void => {
    setDirectoriesAccess(prev => ({ ...prev, ...directoriesAccess }))
  }

  useEffect(() => {
    // when there are new directories, call list-directories-access to get the access status of each directory
    if (directories.length > 0) {
      handleListDirectoriesAccess(directories.map((directory) => directory.id))
    }
  }, [directories])

  useEffect(() => {
    void loadDirectories()

    ipcRenderer.on('deleted-directory', handleDeletedDirectory)
    ipcRenderer.on('refreshed-directories', handleRefreshedDirectories)
    ipcRenderer.on('listed-directories-access', handleListedDirectoriesAccess)

    return () => {
      ipcRenderer.removeListener('deleted-directory', handleDeletedDirectory)
      ipcRenderer.removeListener('refreshed-directories', handleRefreshedDirectories)
      ipcRenderer.removeListener('listed-directories-access', handleListedDirectoriesAccess)
    }
  }, [])

  const contextValue = useMemo<DirectoriesContextValue>(() => {
    return {
      directories,
      isLoadingDirectories,
      directoriesFileCount,
      directoriesAccess,
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
  }, [directories, isLoadingDirectories, isInitializingDirectory, directoriesFileCount, loadDirectories, handleIsInitializingDirectory, isDeletingDirectory, handleDeleteDirectory, isRefreshingDirectories, handleRefreshDirectories, updateIsRefreshingDirectories, handleSetDirectoryLocation, directoriesAccess])

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

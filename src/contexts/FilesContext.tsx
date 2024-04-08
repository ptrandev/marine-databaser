import { type FC, createContext, useMemo, useState, useEffect } from 'react'
import { type Directory, type Tag } from '../../electron/database/schemas'
import { type FileTypes, type FileWithMetadata } from '../../shared/types'
import { ipcRenderer } from 'electron'
import { useEffectDebounced } from '@/hooks/useEffectDebounced'
import useDirectories from '@/hooks/useDirectories'
import { type FileParentFile } from './FileParentContext'

export interface FilesContextValue {
  files: FileWithMetadata[]
  selectedFiles: number[]
  updateSelectedFiles: (selectedFiles: number[]) => void
  loadFiles: () => Promise<void>
  isLoadingFiles: boolean
  searchTerm: string
  updateSearchTerm: (searchTerm: string) => void
  selectedDirectories: Directory[]
  updateSelectedDirectories: (directories: Directory[]) => void
  selectedTags: Tag[]
  updateSelectedTags: (tags: Tag[]) => void
  selectedFileTypes: FileTypes[]
  updateSelectedFileTypes: (fileTypes: FileTypes[]) => void
  selectedFileParents: FileParentFile[]
  updateSelectedFileParents: (fileParents: FileParentFile[]) => void
}

const FilesContext = createContext<FilesContextValue | null>(null)

interface FilesProviderProps {
  children?: React.ReactNode
}

export const FilesProvider: FC<FilesProviderProps> = ({ children }) => {
  const { directories } = useDirectories()

  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedDirectories, setSelectedDirectories] = useState<Directory[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [selectedFileTypes, setSelectedFileTypes] = useState<FileTypes[]>([])
  const [selectedFileParents, setSelectedFileParents] = useState<FileParentFile[]>([])

  const loadFiles = async (): Promise<void> => {
    setIsLoadingFiles(true)

    const directories: number[] = selectedDirectories?.map(directory => directory.id)
    const tags: number[] = selectedTags?.map(tag => tag.id)
    const fileParents: number[] = selectedFileParents?.map(fileParent => fileParent.id)

    ipcRenderer.send('list-files', { directories, tags, searchTerm, fileTypes: selectedFileTypes, fileParents })

    await new Promise<void>((resolve) => {
      ipcRenderer.once('listed-files', (_, files: FileWithMetadata[]) => {
        setFiles(files)
        setIsLoadingFiles(false)
        resolve()
      })
    })
  }

  const updateSelectedFiles = (selectedFiles: number[]): void => {
    setSelectedFiles(selectedFiles)
  }

  const updateSearchTerm = (searchTerm: string): void => {
    setSearchTerm(searchTerm)
  }

  const updateSelectedDirectories = (directories: Directory[]): void => {
    setSelectedDirectories(directories)
  }

  const updateSelectedTags = (tags: Tag[]): void => {
    setSelectedTags(tags)
  }

  const updateSelectedFileTypes = (fileTypes: FileTypes[]): void => {
    setSelectedFileTypes(fileTypes)
  }

  const updateSelectedFileParents = (fileParents: FileParentFile[]): void => {
    setSelectedFileParents(fileParents)
  }

  useEffectDebounced(() => {
    void loadFiles()
    setSelectedFiles([])
  }, [searchTerm], 500)

  useEffect(() => {
    void loadFiles()
  }, [directories, selectedDirectories, selectedTags, selectedFileTypes, selectedFileParents])

  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('listed-files')
    }
  }, [])

  const contextValue = useMemo<FilesContextValue>(() => {
    return {
      files,
      selectedFiles,
      updateSelectedFiles,
      loadFiles,
      isLoadingFiles,
      searchTerm,
      updateSearchTerm,
      selectedDirectories,
      updateSelectedDirectories,
      selectedTags,
      updateSelectedTags,
      selectedFileTypes,
      updateSelectedFileTypes,
      selectedFileParents,
      updateSelectedFileParents
    }
  }, [files, isLoadingFiles, searchTerm, selectedDirectories, selectedTags, selectedFileTypes, selectedFiles, updateSelectedFiles, updateSearchTerm, updateSelectedDirectories, updateSelectedTags, updateSelectedFileTypes, selectedFileParents, updateSelectedFileParents])

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  )
}

export default FilesContext

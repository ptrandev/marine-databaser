import { FC, createContext, useMemo, useState, useEffect } from 'react'
import { Directory, Tag } from '../../electron/database/schemas'
import { FileTypes, FileWithMetadata } from '../../shared/types'
import { ipcRenderer } from 'electron'
import { useEffectDebounced } from '@/hooks/useEffectDebounced'
import useDirectories from '@/hooks/useDirectories'

export interface FilesContextValue {
  files: FileWithMetadata[]
  selectedFiles: number[]
  updateSelectedFiles: (selectedFiles: number[]) => void
  loadFiles: () => void
  isLoadingFiles: boolean
  searchTerm: string
  updateSearchTerm: (searchTerm: string) => void
  selectedDirectories: Directory[]
  updateSelectedDirectories: (directories: Directory[]) => void
  selectedTags: Tag[]
  updateSelectedTags: (tags: Tag[]) => void
  selectedFileTypes: FileTypes[]
  updateSelectedFileTypes: (fileTypes: FileTypes[]) => void
}

const FilesContext = createContext<FilesContextValue>(undefined as any)

interface FilesProviderProps {
  children: React.ReactNode
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

  const loadFiles = () => {
    setIsLoadingFiles(true)

    const directories: number[] = selectedDirectories?.map(directory => directory.id)
    const tags: number[] = selectedTags?.map(tag => tag.id)

    ipcRenderer.send('list-files', { directories, tags, searchTerm, fileTypes: selectedFileTypes })

    ipcRenderer.once('listed-files', (_, files) => {
      setFiles(files)
      setIsLoadingFiles(false)
    })
  }

  const updateSelectedFiles = (selectedFiles: number[]) => {
    setSelectedFiles(selectedFiles)
  }

  const updateSearchTerm = (searchTerm: string) => {
    setSearchTerm(searchTerm)
  }

  const updateSelectedDirectories = (directories: Directory[]) => {
    setSelectedDirectories(directories)
  }

  const updateSelectedTags = (tags: Tag[]) => {
    setSelectedTags(tags)
  }

  const updateSelectedFileTypes = (fileTypes: FileTypes[]) => {
    setSelectedFileTypes(fileTypes)
  }

  useEffectDebounced(() => {
    loadFiles()
    setSelectedFiles([])
  }, [searchTerm], 500)

  useEffect(() => {
    loadFiles()
  }, [directories, selectedDirectories, selectedTags, selectedFileTypes])

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
    }
  }, [files, isLoadingFiles, searchTerm, selectedDirectories, selectedTags, selectedFileTypes, selectedFiles, updateSelectedFiles, updateSearchTerm, updateSelectedDirectories, updateSelectedTags, updateSelectedFileTypes])

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  )
}

export default FilesContext

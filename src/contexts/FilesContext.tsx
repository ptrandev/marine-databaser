import { FC, createContext, useMemo, useState, useEffect } from 'react'
import { Directory, Tag } from '../../electron/database/schemas'
import { FileTypes, FileWithTags } from '../../shared/types'
import { ipcRenderer } from 'electron'
import { useEffectDebounced } from '@/hooks/useEffectDebounced'

export interface FilesContextValue {
  files: FileWithTags[]
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
  const [files, setFiles] = useState<FileWithTags[]>([])
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
    ipcRenderer.on('listed-files', (_, files) => {
      setFiles(files)
      setIsLoadingFiles(false)
    })
  }

  useEffectDebounced(() => {
    loadFiles()
  }, [searchTerm], 500)

  useEffect(() => {
    loadFiles()
  }, [selectedDirectories, selectedTags, selectedFileTypes])


  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('listed-files')
    }
  }, [])

  const contextValue = useMemo(() => {
    return {
      files,
      loadFiles,
      isLoadingFiles,
      searchTerm,
      updateSearchTerm: (searchTerm: string) => setSearchTerm(searchTerm),
      selectedDirectories,
      updateSelectedDirectories: (directories: Directory[]) => setSelectedDirectories(directories),
      selectedTags,
      updateSelectedTags: (tags: Tag[]) => setSelectedTags(tags),
      selectedFileTypes,
      updateSelectedFileTypes: (fileTypes: FileTypes[]) => setSelectedFileTypes(fileTypes)
    }
  }, [files, isLoadingFiles, searchTerm, selectedDirectories, selectedTags, selectedFileTypes])

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  )
}

export default FilesContext

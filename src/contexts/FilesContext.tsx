import { FC, createContext, useMemo, useState, useEffect } from 'react'
import { Directory, Tag } from '../../electron/database/schemas'
import { FileTypes } from '../../shared/types'

export interface FilesContextValue {
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
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedDirectories, setSelectedDirectories] = useState<Directory[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [selectedFileTypes, setSelectedFileTypes] = useState<FileTypes[]>([])

  useEffect(() => {
    console.log('searchTerm', searchTerm)
  }, [searchTerm])

  const contextValue = useMemo(() => {
    return {
      searchTerm,
      updateSearchTerm: (searchTerm: string) => setSearchTerm(searchTerm),
      selectedDirectories,
      updateSelectedDirectories: (directories: Directory[]) => setSelectedDirectories(directories),
      selectedTags,
      updateSelectedTags: (tags: Tag[]) => setSelectedTags(tags),
      selectedFileTypes,
      updateSelectedFileTypes: (fileTypes: FileTypes[]) => setSelectedFileTypes(fileTypes)
    }
  }, [searchTerm, selectedDirectories, selectedTags, selectedFileTypes])

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  )
}

export default FilesContext

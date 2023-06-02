import { FC, createContext, useMemo, useState, useEffect } from 'react'
import { Directory, Tag } from '../../electron/database/schemas'

export interface FilesContextValue {
  searchTerm: string
  updateSearchTerm: (searchTerm: string) => void
  selectedDirectories: Directory[]
  updateSelectedDirectories: (directories: Directory[]) => void
  selectedTags: Tag[]
  updateSelectedTags: (tags: Tag[]) => void
  selectedFileType: string
  updateSelectedFileType: (fileType: string) => void
}

const FilesContext = createContext<FilesContextValue>(undefined as any)

interface FilesProviderProps {
  children: React.ReactNode
}

export const FilesProvider: FC<FilesProviderProps> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedDirectories, setSelectedDirectories] = useState<Directory[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [selectedFileType, setSelectedFileType] = useState<string>('all')

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
      selectedFileType,
      updateSelectedFileType: (fileType: string) => setSelectedFileType(fileType)
    }
  }, [searchTerm, selectedDirectories, selectedTags, selectedFileType])

  return (
    <FilesContext.Provider value={contextValue}>
      {children}
    </FilesContext.Provider>
  )
}

export default FilesContext

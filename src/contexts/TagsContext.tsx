import { createContext, FC, useMemo, useState } from 'react'
import { ipcRenderer } from 'electron'
import { Tag } from '../../electron/database/schemas'

export interface TagsContextValue {
  tags: Tag[]
  loadTags: () => void
}

const TagsContext = createContext<TagsContextValue>(undefined as any)

interface TagsProviderProps {
  children: React.ReactNode
}

export const TagsProvider : FC<TagsProviderProps> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>([])

  const loadTags = () => {
    ipcRenderer.send('list-tags')
    ipcRenderer.once('listed-tags', (_, tags) => {
      setTags(tags)
    })
  }

  const contextValue = useMemo(() => {
    return {
      tags,
      loadTags,
    }
  }, [])

  return (
    <TagsContext.Provider value={contextValue}>
      {children}
    </TagsContext.Provider>
  )
}

export default TagsContext
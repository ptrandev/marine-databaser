import { createContext, FC, useEffect, useMemo, useState } from 'react'
import { ipcRenderer } from 'electron'
import { Tag, FileTag } from '../../electron/database/schemas'
import useFiles from '@/hooks/useFiles'

export interface TagsContextValue {
  tags: Tag[]
  loadTags: () => void
  tagFile: (file_id: number, tag: string) => Promise<FileTag>
  untagFile: (file_id: number, tag_id: number) => Promise<void>
}

const TagsContext = createContext<TagsContextValue>(undefined as any)

interface TagsProviderProps {
  children: React.ReactNode
}

export const TagsProvider : FC<TagsProviderProps> = ({ children }) => {
  const { files } = useFiles()

  const [tags, setTags] = useState<Tag[]>([])

  const loadTags = () => {
    ipcRenderer.send('list-tags')
    ipcRenderer.once('listed-tags', (_, tags) => {
      setTags(tags)
    })
  }

  const tagFile = (file_id : number, tag: string) : Promise<FileTag> => {
    ipcRenderer.send('tag-file', { file_id, tag })
    
    return new Promise((resolve, _) => {
      ipcRenderer.once('tagged-file', (_, fileTag) => {
        loadTags()
        resolve(fileTag)
      })
    })
  }

  const untagFile = (file_id : number, tag_id: number) : Promise<void> => {
    ipcRenderer.send('untag-file', { file_id, tag_id })

    return new Promise((resolve, _) => {
      ipcRenderer.once('untagged-file', () => {
        loadTags()
        resolve()
      })
    })
  }

  useEffect(() => {
    loadTags()
  }, [files])

  const contextValue = useMemo(() => {
    return {
      tags,
      loadTags,
      tagFile,
      untagFile,
    }
  }, [tags, loadTags, tagFile, untagFile])

  return (
    <TagsContext.Provider value={contextValue}>
      {children}
    </TagsContext.Provider>
  )
}

export default TagsContext
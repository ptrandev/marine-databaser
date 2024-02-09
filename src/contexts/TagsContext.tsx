import { createContext, type FC, useEffect, useMemo, useState } from 'react'
import { ipcRenderer } from 'electron'
import { type Tag, type FileTag } from '../../electron/database/schemas'
import useFiles from '@/hooks/useFiles'

export interface TagsContextValue {
  tags: Tag[]
  loadTags: () => Promise<void>
  tagFile: (file_id: number, tag: string) => Promise<FileTag>
  untagFile: (file_id: number, tag_id: number) => Promise<void>
  tagFiles: (file_ids: number[], tag: string) => Promise<FileTag[]>
  untagFiles: (file_ids: number[], tag_id: number) => Promise<void>
}

const TagsContext = createContext<TagsContextValue>(undefined as any)

interface TagsProviderProps {
  children: React.ReactNode
}

export const TagsProvider: FC<TagsProviderProps> = ({ children }) => {
  const { files } = useFiles()

  const [tags, setTags] = useState<Tag[]>([])

  const loadTags = async (): Promise<void> => {
    ipcRenderer.send('list-tags')

    await new Promise((resolve, _) => {
      ipcRenderer.once('listed-tags', (_, tags) => {
        setTags(tags)
        resolve()
      })
    })
  }

  const tagFile = async (file_id: number, tag: string): Promise<FileTag> => {
    ipcRenderer.send('tag-file', { file_id, tag })

    return await new Promise((resolve, _) => {
      ipcRenderer.once('tagged-file', (_, fileTag) => {
        loadTags()
        resolve(fileTag)
      })
    })
  }

  const untagFile = async (file_id: number, tag_id: number): Promise<void> => {
    ipcRenderer.send('untag-file', { file_id, tag_id })

    await new Promise((resolve, _) => {
      ipcRenderer.once('untagged-file', () => {
        loadTags()
        resolve()
      })
    })
  }

  const tagFiles = async (file_ids: number[], tag: string): Promise<FileTag[]> => {
    ipcRenderer.send('tag-files', { file_ids, tag })

    return await new Promise((resolve, _) => {
      ipcRenderer.once('tagged-files', (_, fileTags) => {
        loadTags()
        resolve(fileTags)
      })
    })
  }

  const untagFiles = async (file_ids: number[], tag_id: number): Promise<void> => {
    ipcRenderer.send('untag-files', { file_ids, tag_id })

    await new Promise((resolve, _) => {
      ipcRenderer.once('untagged-files', () => {
        loadTags()
        resolve()
      })
    })
  }

  useEffect(() => {
    loadTags()
  }, [files])

  const contextValue = useMemo<TagsContextValue>(() => {
    return {
      tags,
      loadTags,
      tagFile,
      untagFile,
      tagFiles,
      untagFiles
    }
  }, [tags, loadTags, tagFile, untagFile, tagFiles, untagFiles])

  return (
    <TagsContext.Provider value={contextValue}>
      {children}
    </TagsContext.Provider>
  )
}

export default TagsContext

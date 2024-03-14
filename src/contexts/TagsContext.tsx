import { createContext, type FC, useEffect, useMemo, useState } from 'react'
import { ipcRenderer } from 'electron'
import { type Tag, type FileTag } from '../../electron/database/schemas'
import useFiles from '@/hooks/useFiles'

export interface TagsContextValue {
  tags: Tag[]
  loadTags: () => Promise<void>
  tagFile: (fileId: number, tag: string) => Promise<FileTag>
  untagFile: (fileId: number, tagId: number) => Promise<void>
  tagFiles: (fileIds: number[], tag: string) => Promise<FileTag[]>
  untagFiles: (fileIds: number[], tagId: number) => Promise<void>
}

const TagsContext = createContext<TagsContextValue | null>(null)

interface TagsProviderProps {
  children?: React.ReactNode
}

export const TagsProvider: FC<TagsProviderProps> = ({ children }) => {
  const { files } = useFiles()

  const [tags, setTags] = useState<Tag[]>([])

  const loadTags = async (): Promise<void> => {
    ipcRenderer.send('list-tags')

    await new Promise<void>((resolve, _reject) => {
      ipcRenderer.once('listed-tags', (_, tags: Tag[]) => {
        setTags(tags)
        resolve()
      })
    })
  }

  const tagFile = async (fileId: number, tag: string): Promise<FileTag> => {
    ipcRenderer.send('tag-file', { fileId, tag })

    return await new Promise((resolve, _reject) => {
      ipcRenderer.once('tagged-file', (_, fileTag: FileTag) => {
        void loadTags()
        resolve(fileTag)
      })
    })
  }

  const untagFile = async (fileId: number, tagId: number): Promise<void> => {
    ipcRenderer.send('untag-file', { fileId, tagId })

    await new Promise<void>((resolve, _reject) => {
      ipcRenderer.once('untagged-file', () => {
        void loadTags()
        resolve()
      })
    })
  }

  const tagFiles = async (fileIds: number[], tag: string): Promise<FileTag[]> => {
    ipcRenderer.send('tag-files', { fileIds, tag })

    return await new Promise((resolve, _reject) => {
      ipcRenderer.once('tagged-files', (_, fileTags: FileTag[]) => {
        void loadTags()
        resolve(fileTags)
      })
    })
  }

  const untagFiles = async (fileIds: number[], tagId: number): Promise<void> => {
    ipcRenderer.send('untag-files', { fileIds, tagId })

    await new Promise<void>((resolve, _reject) => {
      ipcRenderer.once('untagged-files', () => {
        void loadTags()
        resolve()
      })
    })
  }

  useEffect(() => {
    void loadTags()
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

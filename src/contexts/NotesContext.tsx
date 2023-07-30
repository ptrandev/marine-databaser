import { createContext, FC, useMemo, useState } from 'react'
import { FileNote } from '../../electron/database/schemas'

export interface NotesContextValue {
  notes: FileNote[]
  loadNotes: () => Promise<void>
  addNote: (file_id: number, note: string) => Promise<FileNote>
  updateNote: (note_id: number, note: string) => Promise<FileNote>
  deleteNote: (note_id: number) => Promise<void>
}

const NotesContext = createContext<NotesContextValue>(undefined as any)

interface NotesProviderProps {
  children: React.ReactNode
}

export const NotesProvider : FC<NotesProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<FileNote[]>([])

  const loadNotes = () : Promise<void> => {
    return new Promise((resolve, _) => {
      resolve()
    })
  }

  const addNote = (file_id : number, note: string) : Promise<FileNote> => {
    return new Promise((resolve, _) => {
      resolve({} as FileNote)
    })
  }

  const updateNote = (note_id : number, note: string) : Promise<FileNote> => {
    return new Promise((resolve, _) => {
      resolve({} as FileNote)
    })
  }

  const deleteNote = (note_id : number) : Promise<void> => {
    return new Promise((resolve, _) => {
      resolve()
    })
  }
  
  const contextValue = useMemo<NotesContextValue>(() => {
    return {
      notes,
      loadNotes,
      addNote,
      updateNote,
      deleteNote
    }
  }, [notes, loadNotes, addNote, updateNote, deleteNote])

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  )
}

export default NotesContext
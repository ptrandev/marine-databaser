import { Modal, type ModalProps } from '@/components/Modal'
import { type FC, useEffect, useState } from 'react'
import { ipcRenderer } from 'electron'
import { Button, Stack, TextField, ListItem, ListItemText, IconButton, Box, List } from '@mui/material'
import { type FileWithMetadata } from 'shared/types'
import { type FileNote } from 'electron/database/schemas'
import { Delete, Edit } from '@mui/icons-material'

interface FileNotesModalProps extends Omit<ModalProps, 'children'> {
  file: FileWithMetadata
}

const FileNotesModal: FC<FileNotesModalProps> = ({ open, onClose, file }) => {
  const [notes, setNotes] = useState<FileNote[]>([])
  const [note, setNote] = useState<string>('')

  const handleListNotes = () => {
    ipcRenderer.send('list-notes', { file_id: file.id })

    ipcRenderer.once('listed-notes', (_, notes) => {
      setNotes(notes)
    })
  }

  const handleAddNote = () => {
    ipcRenderer.send('add-note', { file_id: file.id, note })

    setNote('')

    ipcRenderer.once('added-note', () => {
      handleListNotes()
    })
  }

  const handleDeleteNote = (id: number) => {
    ipcRenderer.send('delete-note', { id })

    ipcRenderer.once('deleted-note', () => {
      handleListNotes()
    })
  }

  const handleUpdateNote = async (id: number, note: string) => {
    ipcRenderer.send('update-note', { id, note })

    await new Promise<void>((resolve, _) => {
      ipcRenderer.once('updated-note', () => {
        handleListNotes()
        resolve()
      })
    })
  }

  useEffect(() => {
    handleListNotes()
  }, [file])

  return (
    <Modal open={open} onClose={onClose}>
      <Stack mt={3}>
        <Box
          display='flex'
          flexDirection='column'
          gap={2}
          component='form'
          onSubmit={e => {
            e.preventDefault()
            handleAddNote()
          }}
        >
          <TextField
            label="Add Note"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={note}
            onChange={e => { setNote(e.target.value) }}
          />
          <Button variant='contained' type='submit' fullWidth>Add</Button>
        </Box>
      </Stack>
      {
        notes.length > 0 &&
        <List>
          {
            notes.map(note => (
              <Note key={note.id} note={note} handleDeleteNote={handleDeleteNote} handleUpdateNote={handleUpdateNote} />
            ))
          }
        </List>
      }
    </Modal>
  )
}

interface NoteProps {
  note: FileNote
  handleDeleteNote: (id: number) => void
  handleUpdateNote: (id: number, note: string) => Promise<void>
}

const Note: FC<NoteProps> = ({ note, handleDeleteNote, handleUpdateNote }) => {
  const [edited, setEdited] = useState<boolean>(false)
  const [_note, _setNote] = useState<string>(note.note)

  return (
    <ListItem key={note.id}>
      {
        edited
          ? <>
            <TextField
              label="Edit Note"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={_note}
              onChange={e => { _setNote(e.target.value) }}
              onBlur={async () => {
                await handleUpdateNote(note.id, _note)
                setEdited(false)
              }}
            />
          </>
          : <ListItemText primary={note.note} />
      }
      <IconButton
        aria-label='edit'
        onClick={() => {
          setEdited(true)
        }}
      >
        <Edit />
      </IconButton>
      <IconButton
        aria-label='delete'
        color='error'
        onClick={() => { handleDeleteNote(note.id) }}
      >
        <Delete />
      </IconButton>
    </ListItem>
  )
}

export default FileNotesModal

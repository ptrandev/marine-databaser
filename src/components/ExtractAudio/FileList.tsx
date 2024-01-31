import { FC } from 'react'
import { Virtuoso } from "react-virtuoso"
import { List, ListItem, ListItemText, Typography, IconButton } from '@mui/material'
import { Delete } from '@mui/icons-material'
import useExtractAudio from '@/hooks/useExtractAudio'

const FileList: FC = () => {
  const { selectedFiles, deleteSelectedFiles, isExtractingAudio } = useExtractAudio()

  return (
    <List>
      <ListItem
        sx={{
          mb: 2,
        }}
        secondaryAction={
          <IconButton color='error' onClick={() => deleteSelectedFiles(selectedFiles)} disabled={isExtractingAudio || selectedFiles.length === 0}>
            <Delete />
          </IconButton>
        }
      />
      <Virtuoso
        style={{ height: 'calc(100vh - 64px - 128px - 32px)' }}
        data={selectedFiles}
        itemContent={(_, file) => (
          <ListItem
            key={file}
            secondaryAction={
              <IconButton color='error' onClick={() => deleteSelectedFiles([file])} disabled={isExtractingAudio}>
                <Delete />
              </IconButton>
            }
          >
            <ListItemText
              primary={<Typography noWrap>{file}</Typography>}
            />
          </ListItem>
        )}
      />
    </List>
  )
}

export default FileList
import { ipcRenderer } from 'electron'
import { FC } from 'react'
import { IconButton } from '@mui/material'
import { Save } from '@mui/icons-material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { enqueueSnackbar } from 'notistack'

const SaveProject: FC = () => {
  const { spliceRegions, selectedVideo } = useSpliceVideo()

  const handleSave = () => {
    const data = {
      selectedVideo,
      spliceRegions
    }

    ipcRenderer.send('save-to-json', {
      data: data,
      filename: 'project.json'
    })

    ipcRenderer.once('save-to-json-success', () => {
      enqueueSnackbar('Project saved successfully.', { variant: 'success' })
    })

    ipcRenderer.once('save-to-json-error', () => {
      enqueueSnackbar('Error saving project.', { variant: 'error' })
    })
  }

  return (
    <IconButton onClick={handleSave} disabled={!selectedVideo}>
      <Save />
    </IconButton>
  )
}

export default SaveProject
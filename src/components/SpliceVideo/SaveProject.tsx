import { ipcRenderer } from 'electron'
import { useEffect, type FC } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { Save } from '@mui/icons-material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { enqueueSnackbar } from 'notistack'

const SaveProject: FC = () => {
  const { spliceRegions, selectedVideo } = useSpliceVideo()

  const handleSave = (): void => {
    const data = {
      selectedVideo,
      spliceRegions
    }

    ipcRenderer.send('save-to-json', {
      data,
      filename: 'project.json'
    })
  }

  const handleSaveToJsonSuccess = (): void => {
    enqueueSnackbar('Project saved successfully.', { variant: 'success' })
  }

  const handleSaveToJsonError = (): void => {
    enqueueSnackbar('Error saving project.', { variant: 'error' })
  }

  useEffect(() => {
    ipcRenderer.on('save-to-json-success', handleSaveToJsonSuccess)
    ipcRenderer.on('save-to-json-error', handleSaveToJsonError)

    return () => {
      ipcRenderer.removeListener('save-to-json-success', handleSaveToJsonSuccess)
      ipcRenderer.removeListener('save-to-json-error', handleSaveToJsonError)
    }
  }, [])

  return (
    <Tooltip title='Save project'>
      <IconButton onClick={handleSave} disabled={!selectedVideo}>
        <Save />
      </IconButton>
    </Tooltip>
  )
}

export default SaveProject

import { ipcRenderer } from 'electron'
import { FC, useState } from 'react'
import { IconButton, Snackbar, Alert } from '@mui/material'
import { Save } from '@mui/icons-material'
import useSpliceVideo from '@/hooks/useSpliceVideo'

const SaveProject: FC = () => {
  const { splicePoints, selectedVideo } = useSpliceVideo()

  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false)

  const handleSave = () => {
    const data = {
      selectedVideo,
      splicePoints
    }

    ipcRenderer.send('save-to-json', {
      data: data,
      filename: 'project.json'
    })

    ipcRenderer.once('save-to-json-success', () => {
      setShowSuccessSnackbar(true)
    })

    ipcRenderer.once('save-to-json-error', () => {
      setShowErrorSnackbar(true)
    })
  }

  return (
    <>
      <IconButton onClick={handleSave} disabled={!selectedVideo}>
        <Save />
      </IconButton>
      <Snackbar open={showSuccessSnackbar} autoHideDuration={6000} onClose={() => setShowSuccessSnackbar(false)}>
        <Alert severity="success" onClose={() => setShowSuccessSnackbar(false)}>
          Project saved successfully.
        </Alert>
      </Snackbar>
      <Snackbar open={showErrorSnackbar} autoHideDuration={6000} onClose={() => setShowErrorSnackbar(false)}>
        <Alert severity="error" onClose={() => setShowErrorSnackbar(false)}>
          Error saving project.
        </Alert>
      </Snackbar>
    </>
  )
}

export default SaveProject
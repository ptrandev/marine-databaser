import { ipcRenderer } from 'electron'
import { FC, useState } from 'react'
import { IconButton, Snackbar, Alert } from '@mui/material'
import { Download } from '@mui/icons-material'

const LoadProject: FC = () => {
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false)

  const handleLoad = () => {
    ipcRenderer.send('load-from-json')

    ipcRenderer.once('load-from-json-success', (_, data) => {
      setShowSuccessSnackbar(true)
    })

    ipcRenderer.once('load-from-json-error', () => {
      setShowErrorSnackbar(true)
    })
  }

  return (
    <>
      <IconButton onClick={handleLoad}>
        <Download />
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

export default LoadProject
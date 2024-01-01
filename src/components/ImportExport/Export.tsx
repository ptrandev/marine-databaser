import { FC } from 'react'
import { ipcRenderer } from 'electron'
import { Box, Typography, Button, Snackbar } from '@mui/material'
import { FileUpload } from '@mui/icons-material'
import { useState } from 'react'
import { Alert } from '@mui/material'


const Export: FC = () => {
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false)
  const [showCancelSnackbar, setShowCancelSnackbar] = useState(false)

  const handleDatabaseExport = () => {
    ipcRenderer.send('database-export')

    ipcRenderer.once('database-export-canceled', () => {
      setShowCancelSnackbar(true)
    })

    ipcRenderer.once('database-export-error', () => {
      setShowErrorSnackbar(true)
    })

    ipcRenderer.once('database-export-success', () => {
      setShowSuccessSnackbar(true)
    })
  }

  return (
    <>
      <Box>
        <Typography variant="h6">
          Export Database
        </Typography>
        <Typography variant="body1">
          This will export the database to a sqlite file. You can import this sqlite file into another instance of this application in order to transfer your database. This will not transfer any media files. It is recommended that you use this feature to store a periodic backup of your database. In the case of a database corruption, you can use this backup to restore your database.
        </Typography>
      </Box>

      <Box>
        <Button variant="contained" startIcon={<FileUpload />} onClick={handleDatabaseExport}>
          Export
        </Button>
      </Box>

      <Snackbar open={showSuccessSnackbar} autoHideDuration={6000} onClose={() => setShowSuccessSnackbar(false)}>
        <Alert severity="success">
          Database exported successfully.
        </Alert>
      </Snackbar>

      <Snackbar open={showErrorSnackbar} autoHideDuration={6000} onClose={() => setShowErrorSnackbar(false)}>
        <Alert severity="error">
          An error occurred while exporting the database.
        </Alert>
      </Snackbar>

      <Snackbar open={showCancelSnackbar} autoHideDuration={6000} onClose={() => setShowCancelSnackbar(false)}>
        <Alert severity="warning">
          Database export canceled.
        </Alert>
      </Snackbar>
    </>
  )
}

export default Export
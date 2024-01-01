import { FC } from 'react'
import { ipcRenderer } from 'electron'
import { Box, Typography, Button, Snackbar } from '@mui/material'
import { FileUpload } from '@mui/icons-material'
import { useState } from 'react'
import { Alert } from '@mui/material'


const Export: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false)
  const [showCancelSnackbar, setShowCancelSnackbar] = useState(false)

  const handleDatabaseExport = () => {
    setIsLoading(true)

    ipcRenderer.send('database-export')

    ipcRenderer.once('database-export-canceled', () => {
      setShowCancelSnackbar(true)
      setIsLoading(false)
    })

    ipcRenderer.once('database-export-error', () => {
      setShowErrorSnackbar(true)
      setIsLoading(false)
    })

    ipcRenderer.once('database-export-success', () => {
      setShowSuccessSnackbar(true)
      setIsLoading(false)
    })
  }

  return (
    <>
      <Box>
        <Typography variant="h6">
          Export Database
        </Typography>
        <Typography variant="body1">
          This will export the database to a sqlite file. You can import this sqlite file into another instance of this application in order to transfer your database. This will not transfer any media files. It is recommended that you use this feature to store a periodic backup of your database. In the case of a database corruption, you can use this backup to restore your database. Sqlite is a portable database format, so if this tool does not work in the future, you can use any sqlite tool to view your database.
        </Typography>
      </Box>

      <Box>
        <Button variant="contained" startIcon={<FileUpload />} onClick={handleDatabaseExport} disabled={isLoading}>
          Export
        </Button>
      </Box>

      <Snackbar open={showSuccessSnackbar} autoHideDuration={6000} onClose={() => setShowSuccessSnackbar(false)}>
        <Alert severity="success" onClose={() => setShowSuccessSnackbar(false)}>
          Database exported successfully.
        </Alert>
      </Snackbar>

      <Snackbar open={showErrorSnackbar} autoHideDuration={6000} onClose={() => setShowErrorSnackbar(false)}>
        <Alert severity="error" onClose={() => setShowErrorSnackbar(false)}>
          An error occurred while exporting the database.
        </Alert>
      </Snackbar>

      <Snackbar open={showCancelSnackbar} autoHideDuration={6000} onClose={() => setShowCancelSnackbar(false)}>
        <Alert severity="warning" onClose={() => setShowCancelSnackbar(false)}>
          Database export canceled.
        </Alert>
      </Snackbar>
    </>
  )
}

export default Export
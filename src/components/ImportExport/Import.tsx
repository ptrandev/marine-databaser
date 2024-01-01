import { FC, useState } from "react";
import { Box, Typography, Button, Alert, Snackbar } from "@mui/material";
import { FileDownload } from "@mui/icons-material";
import { ipcRenderer } from "electron";
import useDirectories from "@/hooks/useDirectories";
import useFiles from "@/hooks/useFiles";

const Import: FC = () => {
  const { loadDirectories } = useDirectories()
  const { loadFiles } = useFiles()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false)
  const [showCancelSnackbar, setShowCancelSnackbar] = useState(false)

  const handleDatabaseImport = () => {
    setIsLoading(true)

    ipcRenderer.send('database-import')

    ipcRenderer.once('database-import-canceled', () => {
      setShowCancelSnackbar(true)
      setIsLoading(false)
    })

    ipcRenderer.once('database-import-error', () => {
      setShowErrorSnackbar(true)
      setIsLoading(false)
    })

    ipcRenderer.once('database-import-success', () => {
      setShowSuccessSnackbar(true)

      loadDirectories()
      loadFiles()

      setIsLoading(false)
    })
  }

  return (
    <>
      <Box>
        <Typography variant="h6">
          Import Database
        </Typography>
        <Typography variant="body1">
          This will import a sqlite file into the database. This will not import any media files. This is useful in the case that you have a backup of your database and you want to restore it. This can also be used to transfer your database to another instance of this application. Importing a sqlite file will overwrite your current database. This cannot be undone. It is recommended that you backup your database before importing a sqlite file.
        </Typography>
      </Box>

      <Box>
        <Button variant="contained" startIcon={<FileDownload />} onClick={handleDatabaseImport} disabled={isLoading}>
          Import
        </Button>
      </Box>

      <Snackbar open={showSuccessSnackbar} autoHideDuration={6000} onClose={() => setShowSuccessSnackbar(false)}>
        <Alert severity="success" onClose={() => setShowSuccessSnackbar(false)}>
          Database imported successfully.
        </Alert>
      </Snackbar>

      <Snackbar open={showErrorSnackbar} autoHideDuration={6000} onClose={() => setShowErrorSnackbar(false)}>
        <Alert severity="error" onClose={() => setShowErrorSnackbar(false)}>
          An error occurred while importing the database.
        </Alert>
      </Snackbar>

      <Snackbar open={showCancelSnackbar} autoHideDuration={6000} onClose={() => setShowCancelSnackbar(false)}>
        <Alert severity="warning" onClose={() => setShowCancelSnackbar(false)}>
          Database import canceled.
        </Alert>
      </Snackbar>
    </>
  )
}

export default Import;
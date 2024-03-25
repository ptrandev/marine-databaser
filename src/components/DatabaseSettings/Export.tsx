import { type FC, useState, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import { Box, Typography, Button } from '@mui/material'
import { FileUpload } from '@mui/icons-material'
import { enqueueSnackbar } from 'notistack'

const Export: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleDatabaseExport = (): void => {
    setIsLoading(true)
    ipcRenderer.send('database-export')
  }

  const handleDatabaseExportCanceled = (): void => {
    enqueueSnackbar('Database export canceled.', { variant: 'warning' })
    setIsLoading(false)
  }

  const handleDatabaseExportError = (): void => {
    enqueueSnackbar('An error occurred while exporting the database.', { variant: 'error' })
    setIsLoading(false)
  }

  const handleDatabaseExportSuccess = (): void => {
    enqueueSnackbar('Database exported successfully.', { variant: 'success' })
    setIsLoading(false)
  }

  useEffect(() => {
    ipcRenderer.on('database-export-canceled', handleDatabaseExportCanceled)
    ipcRenderer.on('database-export-error', handleDatabaseExportError)
    ipcRenderer.on('database-export-success', handleDatabaseExportSuccess)

    return () => {
      ipcRenderer.removeListener('database-export-canceled', handleDatabaseExportCanceled)
      ipcRenderer.removeListener('database-export-error', handleDatabaseExportError)
      ipcRenderer.removeListener('database-export-success', handleDatabaseExportSuccess)
    }
  }, [])

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
    </>
  )
}

export default Export

import { type FC, useState, useEffect } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { FileDownload } from '@mui/icons-material'
import { ipcRenderer } from 'electron'
import useDirectories from '@/hooks/useDirectories'
import useFiles from '@/hooks/useFiles'
import { enqueueSnackbar } from 'notistack'

const Import: FC = () => {
  const { loadDirectories } = useDirectories()
  const { loadFiles } = useFiles()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleDatabaseImport = (): void => {
    setIsLoading(true)
    ipcRenderer.send('database-import')
  }

  const handleDatabaseImportCanceled = (): void => {
    enqueueSnackbar('Database import canceled.', { variant: 'warning' })
    setIsLoading(false)
  }

  const handleDatabaseImportError = (): void => {
    enqueueSnackbar('An error occurred while importing the database.', { variant: 'error' })
    setIsLoading(false)
  }

  const handleDatabaseImportSuccess = (): void => {
    enqueueSnackbar('Database imported successfully.', { variant: 'success' })

    void loadDirectories()
    void loadFiles()

    setIsLoading(false)
  }

  useEffect(() => {
    ipcRenderer.on('database-import-canceled', handleDatabaseImportCanceled)
    ipcRenderer.on('database-import-error', handleDatabaseImportError)
    ipcRenderer.on('database-import-success', handleDatabaseImportSuccess)

    return () => {
      ipcRenderer.removeListener('database-import-canceled', handleDatabaseImportCanceled)
      ipcRenderer.removeListener('database-import-error', handleDatabaseImportError)
      ipcRenderer.removeListener('database-import-success', handleDatabaseImportSuccess)
    }
  }, [])

  return (
    <>
      <Box>
        <Typography variant="h6">
          Import Database
        </Typography>
        <Typography variant="body1">
          This will import a sqlite file into the database. This will not import any media files. This is useful in the case that you have a backup of your database and you want to restore it. This can also be used to transfer your database to another instance of this application. Importing a sqlite file will overwrite your current database. This cannot be undone. It is recommended that you backup your database before importing a sqlite file. Please ensure that the sqlite file you are importing is compatible with this application (i.e. it was previously exported from this application).
        </Typography>
      </Box>

      <Box>
        <Button variant="contained" startIcon={<FileDownload />} onClick={handleDatabaseImport} disabled={isLoading}>
          Import
        </Button>
      </Box>
    </>
  )
}

export default Import

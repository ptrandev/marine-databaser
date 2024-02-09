import { type FC, useState } from 'react'
import { ipcRenderer } from 'electron'
import { Box, Typography, Button } from '@mui/material'
import { FileUpload } from '@mui/icons-material'
import { enqueueSnackbar } from 'notistack'

const Export: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleDatabaseExport = () => {
    setIsLoading(true)

    ipcRenderer.send('database-export')

    ipcRenderer.once('database-export-canceled', () => {
      enqueueSnackbar('Database export canceled.', { variant: 'warning' })
      setIsLoading(false)
    })

    ipcRenderer.once('database-export-error', () => {
      enqueueSnackbar('An error occurred while exporting the database.', { variant: 'error' })
      setIsLoading(false)
    })

    ipcRenderer.once('database-export-success', () => {
      enqueueSnackbar('Database exported successfully.', { variant: 'success' })
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
    </>
  )
}

export default Export

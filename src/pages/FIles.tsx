import { Box, CircularProgress, Typography } from "@mui/material"

import { FileList } from '@/components/Files'

import FileSearch from "@/components/Files/FileSearch"
import FileFilters from "@/components/Files/FileFilters"

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

import useFiles from "@/hooks/useFiles"

const Files = () => {
  const { files, isLoadingFiles } = useFiles()

  return (
    <Box>
      <Box>
        <FileSearch />
        <FileFilters />
      </Box>
      {
        !isLoadingFiles && files && (
          <>
            <Typography mt={2}>
              <span style={{ fontWeight: 'bold' }}>{files.length}</span> files found
            </Typography>
            <FileList />
          </>
        )
      }
      {
        isLoadingFiles && (
          <Box display='flex' flexDirection='column' mt={4} alignItems='center' justifyContent='center' width='100%' gap={2}>
            <CircularProgress />
            <Typography>
              Loading files...
            </Typography>
          </Box>
        )
      }
    </Box>
  )
}

export default Files

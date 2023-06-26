import { Box, CircularProgress, Typography } from "@mui/material"

import useFiles from "@/hooks/useFiles"
import FileList from "@/components/Files/FileList"
import FileSearch from "@/components/Files/FileSearch"
import FileFilters from "@/components/Files/FileFilters"
import FileActions from "@/components/Files/FileActions"

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
            <Typography my={2}>
              <span style={{ fontWeight: 'bold' }}>{files.length}</span> files found
            </Typography>
            <FileActions />
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

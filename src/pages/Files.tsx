import { type FC } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

import useFiles from '@/hooks/useFiles'
import FileList from '@/components/Files/FileList'
import FileSearch from '@/components/Files/FileSearch'
import FileActions from '@/components/Files/FileActions'

const Files: FC = () => {
  const { files, isLoadingFiles } = useFiles()

  return (
    <Box>
      <Box mb={2}>
        <FileSearch />
      </Box>
      {
        !isLoadingFiles && files && (
          <>
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{files.length}</span> files found
            </Typography>
          </>
        )
      }
      <Box mt={2}>
        <FileActions />
        {
          !isLoadingFiles && files && (
            <FileList />
          )
        }
      </Box>
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

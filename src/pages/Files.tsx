import { type FC, useRef, useEffect, useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

import useFiles from '@/hooks/useFiles'
import FileList from '@/components/Files/FileList'
import FileSearch from '@/components/Files/FileSearch'
import FileActions from '@/components/Files/FileActions'

const Files: FC = () => {
  const fileSearchRef = useRef<HTMLInputElement | null>(null)
  const { files, isLoadingFiles } = useFiles()

  const [fileSearchHeight, setFileSearchHeight] = useState<number>(0)

  useEffect(() => {
    if (!fileSearchRef.current) return

    const handleResize = (): void => {
      setFileSearchHeight(fileSearchRef.current?.clientHeight ?? 0)
    }

    handleResize()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [fileSearchRef.current])

  return (
    <Box>
      <Box mb={2} ref={fileSearchRef}>
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
            <Box
              sx={{
                height: `calc(100vh - 196px - ${fileSearchHeight}px)`
              }}
            >
              <FileList />
            </Box>
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

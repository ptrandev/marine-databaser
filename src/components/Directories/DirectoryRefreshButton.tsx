import { type FC, useMemo } from 'react'
import { Button } from '@mui/material'
import useDirectories from '@/hooks/useDirectories'
import { Refresh } from '@mui/icons-material'

const DirectoryRefreshButton: FC = () => {
  const { directories, isRefreshingDirectories, handleRefreshDirectories } = useDirectories()

  const directoryIdsToRefresh = useMemo(() => directories.map(directory => directory.id), [directories])

  const handleRefresh = (): void => {
    handleRefreshDirectories(directoryIdsToRefresh)
  }

  return (
    <>
      <Button
        color='primary'
        startIcon={<Refresh />}
        size='small'
        onClick={handleRefresh}
        disabled={isRefreshingDirectories}
      >
        Refresh All Directories
      </Button>
    </>
  )
}

export default DirectoryRefreshButton

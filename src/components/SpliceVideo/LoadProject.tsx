import { ipcRenderer } from 'electron'
import { useEffect, type FC } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { Download } from '@mui/icons-material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { enqueueSnackbar } from 'notistack'
import { type SpliceRegion } from '../../../shared/types'

const LoadProject: FC = () => {
  const { updateSelectedVideo, loadSpliceRegions } = useSpliceVideo()

  const handleLoad = (): void => {
    ipcRenderer.send('load-from-json')
  }

  const handleLoadFromJsonSuccess = (_: unknown, data: {
    selectedVideo: string
    spliceRegions: SpliceRegion[]
  }): void => {
    enqueueSnackbar('Project loaded successfully.', { variant: 'success' })
    updateSelectedVideo(data.selectedVideo)
    loadSpliceRegions(data.spliceRegions)
  }

  const handleLoadFromJsonError = (_: unknown, errMessage: string): void => {
    enqueueSnackbar(`Error loading project: ${errMessage}`, { variant: 'error' })
  }

  useEffect(() => {
    ipcRenderer.on('load-from-json-success', handleLoadFromJsonSuccess)
    ipcRenderer.on('load-from-json-error', handleLoadFromJsonError)

    return () => {
      ipcRenderer.removeAllListeners('load-from-json-success')
      ipcRenderer.removeAllListeners('load-from-json-error')
    }
  }, [])

  return (
    <Tooltip title='Load project'>
      <IconButton onClick={handleLoad}>
        <Download />
      </IconButton>
    </Tooltip>
  )
}

export default LoadProject

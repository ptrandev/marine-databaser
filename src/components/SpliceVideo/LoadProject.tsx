import { ipcRenderer } from 'electron'
import { type FC } from 'react'
import { IconButton } from '@mui/material'
import { Download } from '@mui/icons-material'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { enqueueSnackbar } from 'notistack'
import { type SpliceRegion } from '../../../shared/types'

const LoadProject: FC = () => {
  const { updateSelectedVideo, loadSpliceRegions } = useSpliceVideo()

  const handleLoad = (): void => {
    ipcRenderer.send('load-from-json')

    ipcRenderer.once('load-from-json-success', (_, data: {
      selectedVideo: string
      spliceRegions: SpliceRegion[]
    }) => {
      enqueueSnackbar('Project loaded successfully.', { variant: 'success' })
      updateSelectedVideo(data.selectedVideo)
      loadSpliceRegions(data.spliceRegions)
    })

    ipcRenderer.once('load-from-json-error', () => {
      enqueueSnackbar('Error loading project.', { variant: 'error' })
    })
  }

  return (
    <IconButton onClick={handleLoad}>
      <Download />
    </IconButton>
  )
}

export default LoadProject

import { type FC, useState, useEffect } from 'react'
import { Modal, type ModalProps } from '../Modal'
import { Typography, TextField, Stack, Checkbox, Grid, Button } from '@mui/material'
import { ipcRenderer } from 'electron'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import path from 'path'
import { enqueueSnackbar } from 'notistack'

const OptionsModal: FC<Omit<ModalProps, 'children'>> = ({ open, onClose }) => {
  const { selectedVideo, spliceRegions, videoBasename, updateVideoBasename } = useSpliceVideo()

  const [outputDirectory, setOutputDirectory] = useState('')
  const [useSameDirectory, setUseSameDirectory] = useState(true)

  const { handleSpliceVideo } = useSpliceVideo()

  const handleSelectOutputDirectory = (): void => {
    ipcRenderer.send('select-directory')
  }

  const handleSplice = (): void => {
    handleSpliceVideo({
      outputDirectory: useSameDirectory ? undefined : outputDirectory
    })

    onClose()
  }

  const handleSelectedDirectory = (_: unknown, directory: string): void => {
    setOutputDirectory(directory)
  }

  const handleSplicedVideo = (): void => {
    enqueueSnackbar('Video spliced successfully.', { variant: 'success' })
  }

  useEffect(() => {
    ipcRenderer.on('selected-directory', handleSelectedDirectory)
    ipcRenderer.on('spliced-video', handleSplicedVideo)

    return () => {
      ipcRenderer.removeListener('selected-directory', handleSelectedDirectory)
      ipcRenderer.removeListener('spliced-video', handleSplicedVideo)
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose}>
      <Typography variant="h5">
        Splice Video Options
      </Typography>
      <Grid container my={2} mt={useSameDirectory ? 0 : 2} spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label='Output File Name'
            variant="outlined"
            value={videoBasename}
            onChange={(e) => { updateVideoBasename(e.target.value) }}
          />
          <Typography variant='caption'>
            <b>File Name Preview:</b> {videoBasename}{spliceRegions[0]?.name}{path.extname(selectedVideo)}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          {
            !useSameDirectory && (
              <TextField
                fullWidth
                label="Output Directory"
                variant="outlined"
                value={outputDirectory}
                disabled={useSameDirectory}
                onClick={handleSelectOutputDirectory}
                inputProps={{
                  readOnly: true
                }}
              />
            )}
          <Stack direction="row" alignItems="center" mt={useSameDirectory ? 0 : 1}>
            <Checkbox
              checked={useSameDirectory}
              onChange={() => { setUseSameDirectory(!useSameDirectory) }}
            />
            <Typography variant="body1">
              Use same directory as source file
            </Typography>
          </Stack>
        </Grid>
      </Grid>
      <Button fullWidth variant="contained" color="primary" onClick={handleSplice}>
        Splice Video
      </Button>
    </Modal>
  )
}

export default OptionsModal

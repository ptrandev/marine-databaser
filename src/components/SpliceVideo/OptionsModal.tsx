import { FC, useState, useEffect } from 'react'
import { Modal, ModalProps } from '../Modal'
import { Typography, Snackbar, Alert, TextField, Stack, Checkbox, Grid, Button } from '@mui/material'
import { ipcRenderer } from 'electron'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import path from 'path'


const OptionsModal: FC<Omit<ModalProps, 'children'>> = ({ open, onClose }) => {
  const { selectedVideo, spliceRegions, videoBasename, updateVideoBasename } = useSpliceVideo()

  const [outputDirectory, setOutputDirectory] = useState('')
  const [useSameDirectory, setUseSameDirectory] = useState(true)

  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false)

  const { handleSpliceVideo } = useSpliceVideo()

  const handleSelectOutputDirectory = () => {
    ipcRenderer.send('select-directory')

    ipcRenderer.once('selected-directory', (_, directory) => {
      setOutputDirectory(directory)
    })
  }

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Typography variant="h5">
          Splice Video Options
        </Typography>
        <Grid container my={2} mt={useSameDirectory ? 0 : 2} spacing={2}>
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
            <Stack direction="row" alignItems="center" mt={1}>
              <Checkbox
                checked={useSameDirectory}
                onChange={() => setUseSameDirectory(!useSameDirectory)}
              />
              <Typography variant="body1">
                Use same directory as source file
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Output File Name'
              variant="outlined"
              value={videoBasename}
              onChange={(e) => updateVideoBasename(e.target.value)}
            />
            <Typography variant='caption'>
              <b>File Name Preview:</b> {videoBasename}{spliceRegions[0]?.name}{path.extname(selectedVideo)}
            </Typography>
          </Grid>
        </Grid>
        <Grid container justifyContent="flex-end">
          <Grid item>
            <Button variant="contained" color="primary" onClick={() => {
              handleSpliceVideo({
                outputDirectory: useSameDirectory ? undefined : outputDirectory
              })

              ipcRenderer.once('spliced-video', () => {
                setShowSuccessSnackbar(true)
              })

              onClose()
            }}>
              Splice Video
            </Button>
          </Grid>
        </Grid>
      </Modal>
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
      >
        <Alert onClose={() => setShowSuccessSnackbar(false)} severity="success">
          Video spliced successfully!
        </Alert>
      </Snackbar>
    </>
  )
}

export default OptionsModal
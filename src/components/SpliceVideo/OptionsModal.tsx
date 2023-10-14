import { FC, useState } from 'react'
import Modal from '../Modal'
import { Typography, Snackbar, Alert, TextField, Stack, Checkbox, Grid, Button } from '@mui/material'
import { ipcRenderer } from 'electron'
import useSpliceVideo from '@/hooks/useSpliceVideo'

interface OptionsModalProps {
  open: boolean
  onClose: () => void
}

const OptionsModal: FC<OptionsModalProps> = ({ open, onClose }) => {
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
        </Grid>
        <Grid container justifyContent="flex-end">
          <Grid item>
            <Button variant="contained" color="primary" onClick={() => {
              handleSpliceVideo({
                outputDirectory: useSameDirectory ? undefined : outputDirectory
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
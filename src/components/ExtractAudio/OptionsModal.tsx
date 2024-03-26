import { type FC, useState, useEffect } from 'react'
import { Modal, type ModalProps } from '../Modal'
import { Typography, Button, MenuItem, Grid, TextField, Checkbox, Stack } from '@mui/material'
import useExtractAudio from '@/hooks/useExtractAudio'
import { ipcRenderer } from 'electron'
import { type AudioFileFormat } from '../../../shared/types'
import { enqueueSnackbar } from 'notistack'

const fileFormats: Array<{
  value: AudioFileFormat
  label: string
}> = [
  {
    value: 'pcm_s16le',
    label: 'WAV 16-Bit (recommended)'
  },
  {
    value: 'pcm_s24le',
    label: 'WAV 24-Bit'
  },
  {
    value: 'pcm_s32le',
    label: 'WAV 32-Bit'
  }
]

const OptionsModal: FC<Omit<ModalProps, 'children'>> = ({ open, onClose }) => {
  const [fileFormat, setFileFormat] = useState<AudioFileFormat>('pcm_s16le')

  const [outputDirectory, setOutputDirectory] = useState('')
  const [useSameDirectory, setUseSameDirectory] = useState(true)

  const { handleExtractAudio, isExtractingAudio, selectedFiles } = useExtractAudio()

  const handleSelectOutputDirectory = (): void => {
    ipcRenderer.send('select-directory')
  }

  const handleSelectedDirectory = (_, directory: string): void => {
    setOutputDirectory(directory)
  }

  const handleBulkExtractAudio = (): void => {
    enqueueSnackbar('Audio successfully extracted!', { variant: 'success' })

    setOutputDirectory('')
    setUseSameDirectory(true)
    setFileFormat('pcm_s16le')
  }

  useEffect(() => {
    ipcRenderer.on('bulk-extract-audio', handleBulkExtractAudio)
    ipcRenderer.on('selected-directory', handleSelectedDirectory)

    return () => {
      ipcRenderer.removeListener('bulk-extract-audio', handleBulkExtractAudio)
      ipcRenderer.removeListener('selected-directory', handleSelectedDirectory)
    }
  }, [])

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Typography variant='h5'>
          Extract Audio Options
        </Typography>
        <Grid container my={2} spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth label='File Format' variant='outlined' select value={fileFormat} onChange={(e) => { setFileFormat(e.target.value as AudioFileFormat) }}>
              {
                fileFormats.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))
              }
            </TextField>
          </Grid>
          <Grid item xs={12}>
            {
              !useSameDirectory && (
                <TextField
                  fullWidth
                  label='Output Directory'
                  variant='outlined'
                  value={outputDirectory}
                  disabled={useSameDirectory}
                  onClick={handleSelectOutputDirectory}
                  inputProps={{
                    readOnly: true
                  }}
                />
              )
            }
            <Stack direction='row' alignItems='center' mt={1}>
              <Checkbox checked={useSameDirectory} onChange={(e) => { setUseSameDirectory(e.target.checked) }} />
              <Typography variant='body2'>
                Use same output directory as source file (recommended)
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        <Button fullWidth variant='contained' onClick={() => {
          handleExtractAudio({
            fileFormat,
            outputDirectory: useSameDirectory ? undefined : outputDirectory
          })
          onClose()
        }} disabled={isExtractingAudio || selectedFiles.length === 0 || (!useSameDirectory && !outputDirectory)}>
          Extract Audio
        </Button>
      </Modal>
    </>
  )
}

export default OptionsModal

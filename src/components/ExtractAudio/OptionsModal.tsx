import { FC, useState } from 'react'
import Modal from '../Modal'
import { Typography, Button, MenuItem, Grid, TextField, Checkbox, Box, Stack } from '@mui/material'

interface OptionsModalProps {
  open: boolean
  onClose: () => void
}

const fileFormats = [
  {
    value: 'pcm_s16le',
    label: 'WAV 16-Bit (recommended)'
  },
  {
    value: 'pcm_s24le',
    label: 'WAV 24-Bit',
  },
  {
    value: 'pcm_s32le',
    label: 'WAV 32-Bit'
  },
]

const OptionsModal: FC<OptionsModalProps> = ({ open, onClose }) => {
  const [fileFormat, setFileFormat] = useState('pcm_s16le')

  const [outputDirectory, setOutputDirectory] = useState('')
  const [useSameDirectory, setUseSameDirectory] = useState(true)

  return (
    <Modal open={open} onClose={onClose}>
      <Typography variant='h5'>
        Extract Audio Options
      </Typography>
      <Grid container my={2} spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label='File Format' variant='outlined' select value={fileFormat} onChange={(e) => setFileFormat(e.target.value)}>
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
          <TextField
            fullWidth
            label='Output Directory'
            variant='outlined'
            value={outputDirectory}
            onChange={(e) => setOutputDirectory(e.target.value)}
            disabled={useSameDirectory}
          />
          <Stack direction='row' alignItems='center' mt={1}>
            <Checkbox checked={useSameDirectory} onChange={(e) => setUseSameDirectory(e.target.checked)} />
            <Typography variant='body2'>
              Use same directory as source file (recommended)
            </Typography>
          </Stack>
        </Grid>
      </Grid>
      <Grid container justifyContent='flex-end'>
        <Button variant='contained' onClick={onClose}>
          Extract Audio
        </Button>
      </Grid>
    </Modal>
  )
}

export default OptionsModal
import { type FC, useState, useEffect, useCallback } from 'react'
import WavesurferPlayer from '@wavesurfer/react'
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'
import RegionPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.js'
import { Box, IconButton, Slider, Stack, Typography, TextField, Button, Grid } from '@mui/material'
import { ipcRenderer } from 'electron'
import colormap from 'colormap'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Delete, Loop, PlayArrow, Pause, Edit } from '@mui/icons-material'
import { type SpliceRegion } from '../../../shared/types'
import Modal from '../Modal'

const COLORS = colormap({
  colormap: 'hot',
  nshades: 256,
  format: 'float',
  alpha: 1
})

const REGION_COLOR = 'rgba(0, 0, 255, 0.1)'
const SELECTED_REGION_COLOR = 'rgba(0, 0, 255, 0.2)'

const AudioVisualizers: FC = () => {
  const { selectedVideo, videoRef, spliceRegions, modifySpliceRegion, deleteSpliceRegion } = useSpliceVideo()

  const [zoom, setZoom] = useState<number>(1)
  const [frequencyMax, setFrequencyMax] = useState<number>(22_050)
  const [audioSampleRate, setAudioSampleRate] = useState<number>(44_100)

  const [wsRegions, setWsRegions] = useState<RegionPlugin>()
  const [selectedRegion, setSelectedRegion] = useState<SpliceRegion>()

  const [regions, setRegions] = useState<Region[]>([])
  const [activeRegion, setActiveRegion] = useState<Region>()
  const [isLoop, setIsLoop] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const [editNameModalOpen, setEditNameModalOpen] = useState(false)

  const handlePlayPause = () => {
    // find selectedRegion in region
    const region = regions.find(region => region.id === selectedRegion?.name)

    if (region) {
      if (isPlaying) {
        videoRef?.pause()
        setIsPlaying(false)
        setActiveRegion(undefined)
      } else {
        region.play()
        setIsPlaying(true)
        setActiveRegion(region)
      }
    }
  }

  useEffect(() => {
    if (!wsRegions) {
      return
    }

    wsRegions.clearRegions()
    setRegions([])

    spliceRegions.forEach((spliceRegion, i) => {
      const region = wsRegions.addRegion({
        start: spliceRegion.start,
        end: spliceRegion.end,
        color: REGION_COLOR,
        drag: true,
        resize: true,
        id: spliceRegion.name
      })

      region.on('update-end', () => {
        modifySpliceRegion({
          name: spliceRegion.name,
          start: spliceRegion.start,
          end: spliceRegion.end
        }, {
          name: region.id,
          start: region.start,
          end: region.end
        })
      })

      setRegions(regions => [...regions, region])
    })
  }, [spliceRegions, wsRegions])

  useEffect(() => {
    wsRegions?.on('region-out', (region: Region) => {
      if (activeRegion?.id === region.id) {
        if (isLoop) {
          region.play()
        } else {
          setActiveRegion(undefined)
        }
      }
    })

    wsRegions?.on('region-clicked', (region: Region, e: MouseEvent) => {
      e.stopPropagation()

      if (videoRef) {
        videoRef.currentTime = region.start
      }

      setSelectedRegion({
        start: region.start,
        end: region.end,
        name: region.id
      })

      // for each region...
      regions.forEach(region => {
        // set the color of the region
        // @ts-expect-error
        region.setOptions({
          color: REGION_COLOR
        })
      })

      // set the color of the selected region
      // @ts-expect-error
      region.setOptions({
        color: SELECTED_REGION_COLOR
      })
    })

    return () => {
      wsRegions?.unAll()
    }
  }, [wsRegions, isLoop, activeRegion, videoRef, regions])

  useEffect(() => {
    // if selectedRegion is not in spliceRegions, deselect it
    if (!selectedRegion) {
      return
    }

    const { start, end, name } = selectedRegion

    if (!spliceRegions.find(region => region.name === name && region.start === start && region.end === end)) {
      setSelectedRegion(undefined)
    }
  }, [selectedRegion, spliceRegions])

  useEffect(() => {
    if (!selectedVideo) {
      return
    }

    // restore values to default
    setZoom(1)
    setFrequencyMax(22_050)
    setAudioSampleRate(44_100)

    ipcRenderer.send('get-audio-sample-rate', {
      filePath: selectedVideo
    })

    ipcRenderer.once('got-audio-sample-rate', (_, sampleRate) => {
      setAudioSampleRate(sampleRate)
    })
  }, [selectedVideo])

  useEffect(() => {
    setFrequencyMax(audioSampleRate / 2)
  }, [audioSampleRate])

  const handleInteraction = useCallback(() => {
    videoRef?.pause()
    setIsPlaying(false)

    setSelectedRegion(undefined)
    setActiveRegion(undefined)

    regions.forEach(region => {
      // @ts-expect-error
      region.setOptions({
        color: REGION_COLOR
      })
    })
  }, [videoRef, regions])

  return (
    <>
      <Box>
        <Stack direction='row' alignItems='center' justifyContent='space-between' mb={2}>
          <Stack direction='row' alignItems='center' spacing={1}>
            {
              selectedRegion &&
              <>
                <Typography>
                  <b>Selected Splice Region:</b> {selectedRegion.name}
                </Typography>
                <Box>
                  <IconButton size='small' onClick={() => { setEditNameModalOpen(true) }}>
                    <Edit fontSize='small' />
                  </IconButton>
                </Box>
              </>
            }
          </Stack>
          <Box>
            <IconButton onClick={handlePlayPause}
              disabled={!selectedRegion}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton
              onClick={() => { setIsLoop(!isLoop) }}
              disabled={!selectedRegion}
              color={isLoop ? 'primary' : 'default'}
            >
              <Loop />
            </IconButton>
            <IconButton onClick={() => { deleteSpliceRegion(selectedRegion) }} disabled={!selectedRegion} color='error'>
              <Delete />
            </IconButton>
          </Box>
        </Stack>
        <Box
          sx={{
            height: 'calc(100vh - 64px - 128px - 80px)',
            overflowY: 'auto',
            pb: 12
          }}
        >
          <WavesurferPlayer
            height={256}
            media={videoRef!}
            progressColor='#1976d2'
            minPxPerSec={zoom}
            dragToSeek
            normalize
            // @ts-expect-error
            splitChannels
            sampleRate={audioSampleRate}
            frequencyMax={frequencyMax}
            onDecode={(wavesurfer) => {
              wavesurfer.registerPlugin(TimelinePlugin.create({
                secondaryLabelOpacity: 1,
                style: 'font-size: 12px'
              }))

              wavesurfer.registerPlugin(SpectrogramPlugin.create({
                labels: true,
                frequencyMax,
                labelsBackground: '#00000066',
                colorMap: COLORS,
                splitChannels: false
              }))

              const wsRegions = wavesurfer.registerPlugin(RegionPlugin.create())
              setWsRegions(wsRegions)
            }}
            onInteraction={handleInteraction}
          />
          <Box maxWidth='calc(100% - 32px)'>
            <Stack direction='row' alignItems='center' gap={2}>
              <Typography variant='body2'>
                Zoom
              </Typography>
              <Slider
                value={zoom}
                onChange={(_, value) => { setZoom(value as number) }}
                min={1}
                max={5000}
                disabled={!selectedVideo}
              />
            </Stack>
            <Stack direction='row' alignItems='center' gap={2}>
              <Typography variant='body2' noWrap>
                Max Frequency (Hz)
              </Typography>
              <Slider
                value={frequencyMax}
                onChange={(_, value) => { setFrequencyMax(value as number) }}
                min={0}
                max={audioSampleRate / 2}
                valueLabelDisplay='auto'
                sx={{
                  flex: 1
                }}
                disabled={!selectedVideo}
              />
            </Stack>
          </Box>
        </Box>
      </Box>
      {
        selectedRegion && editNameModalOpen &&
        <EditNameModal
          open={editNameModalOpen}
          onClose={() => { setEditNameModalOpen(false) }}
          spliceRegion={selectedRegion}
        />
      }
    </>
  )
}

interface EditNameModalProps {
  open: boolean
  onClose: () => void
  spliceRegion: SpliceRegion
}

const EditNameModal: FC<EditNameModalProps> = ({
  open,
  onClose,
  spliceRegion
}) => {
  const { spliceRegions, modifySpliceRegion } = useSpliceVideo()

  const [name, setName] = useState<string>(spliceRegion.name)
  const [helperText, setHelperText] = useState<string>('')

  const handleChangeName = () => {
    // if name is not unique, return
    if (spliceRegions.find(region => region.name === name)) {
      setHelperText('Name must be unique')
      return
    }

    modifySpliceRegion(spliceRegion, {
      ...spliceRegion,
      name
    })

    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        gap={2}
        display='flex'
        flexDirection='column'
        component='form'
        onSubmit={e => {
          e.preventDefault()
          handleChangeName()
        }}
      >
        <Typography variant='h5'>
          Edit Splice Region Name
        </Typography>
        <TextField
          label='Name'
          value={name}
          onChange={e => {
            setName(e.target.value)
            setHelperText('')
          }}
          fullWidth
          error={!!helperText}
          helperText={helperText}
        />
        <Button variant='contained' fullWidth type='submit'>
          Save
        </Button>
      </Box>
    </Modal>
  )
}

export default AudioVisualizers

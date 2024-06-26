import { type FC, useState, useEffect, useCallback, useRef } from 'react'
import WavesurferPlayer from '@wavesurfer/react'
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'
import RegionPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.js'
import { Box, IconButton, Slider, Stack, Typography, TextField, Button, Tooltip } from '@mui/material'
import { ipcRenderer } from 'electron'
import colormap from 'colormap'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Delete, Loop, PlayArrow, Pause, Edit } from '@mui/icons-material'
import { type SpliceRegion } from '../../../shared/types'
import Modal from '../Modal'
import type WaveSurfer from 'wavesurfer.js'
import { useEffectDebounced } from '@/hooks/useEffectDebounced'

const COLORS = colormap({
  colormap: 'hot',
  nshades: 256,
  format: 'float',
  alpha: 1
})

const REGION_COLOR = 'rgba(0, 0, 255, 0.1)'
const SELECTED_REGION_COLOR = 'rgba(0, 0, 255, 0.2)'

const AudioVisualizers: FC = () => {
  const { selectedVideo, videoRef, spliceRegions, modifySpliceRegion, deleteSpliceRegion, zoom, updateZoom, updateWavesurferWidth } = useSpliceVideo()

  const audioVisualizerRef = useRef<HTMLDivElement>(null)

  const [frequencyMax, setFrequencyMax] = useState<number>(22_050)
  const [frequencyMaxDebounced, setFrequencyMaxDebounced] = useState<number>(22_050)
  const [audioSampleRate, setAudioSampleRate] = useState<number>(44_100)

  const [wsRegions, setWsRegions] = useState<RegionPlugin>()
  const [selectedRegion, setSelectedRegion] = useState<SpliceRegion>()

  const [ws, setWs] = useState<WaveSurfer>()

  const [regions, setRegions] = useState<Region[]>([])
  const [activeRegion, setActiveRegion] = useState<Region>()

  const [isLoop, setIsLoop] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [editNameModalOpen, setEditNameModalOpen] = useState(false)

  const handlePlayPause = (): void => {
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

  const handleDeleteSelectedRegion = (): void => {
    if (selectedRegion) {
      deleteSpliceRegion(selectedRegion)
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
        // @ts-expect-error - no types for setOptions
        region.setOptions({
          color: REGION_COLOR
        })
      })

      // set the color of the selected region
      // @ts-expect-error - no types for setOptions
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
    updateZoom(1)
    setFrequencyMax(22_050)
    setAudioSampleRate(44_100)

    ipcRenderer.send('get-audio-sample-rate', {
      filePath: selectedVideo
    })

    ipcRenderer.once('got-audio-sample-rate', (_, sampleRate: number) => {
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
      // @ts-expect-error - no types for setOptions
      region.setOptions({
        color: REGION_COLOR
      })
    })
  }, [videoRef, regions])

  useEffect(() => {
    setIsLoading(true)
  }, [videoRef])

  useEffectDebounced(() => {
    if (ws) {
      ws.zoom(zoom)
    }
  }, [ws, zoom], 500)

  useEffectDebounced(() => {
    setFrequencyMaxDebounced(frequencyMax)
  }, [frequencyMax], 500)

  // create a listener for the resize event and when the component mounts
  useEffect(() => {
    const handleResize = (): void => {
      if (audioVisualizerRef.current) {
        updateWavesurferWidth(audioVisualizerRef.current.clientWidth)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateWavesurferWidth])

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
                  <Tooltip title='Edit selected splice region name'>
                    <IconButton size='small' onClick={() => { setEditNameModalOpen(true) }}>
                      <Edit fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            }
          </Stack>
          <Box>
            <Tooltip title="play/pause selected splice region">
              <IconButton onClick={handlePlayPause}
                disabled={!selectedRegion}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle loop">
              <IconButton
                onClick={() => { setIsLoop(!isLoop) }}
                disabled={!selectedRegion}
                color={isLoop ? 'primary' : 'default'}
              >
                <Loop />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete selected splice region">
              <IconButton onClick={handleDeleteSelectedRegion} disabled={!selectedRegion} color='error'>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
        <Box
          sx={{
            height: 'calc(100vh - 64px - 128px - 80px)',
            overflowY: 'auto',
            pb: 12
          }}
          ref={audioVisualizerRef}
        >
          <WavesurferPlayer
            height={256}
            media={videoRef ?? undefined}
            progressColor='#1976d2'
            dragToSeek
            normalize
            // @ts-expect-error - no types for
            splitChannels
            sampleRate={audioSampleRate}
            frequencyMax={frequencyMaxDebounced}
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
                splitChannels: true
              }))

              const wsRegions = wavesurfer.registerPlugin(RegionPlugin.create())
              setWsRegions(wsRegions)

              setWs(wavesurfer)
              setIsLoading(false)
            }}
            onInteraction={handleInteraction}
          />
          <Box maxWidth='calc(100% - 32px)' mt={6}>
            <Stack direction='row' alignItems='center' gap={2}>
              <Typography variant='body2'>
                Zoom
              </Typography>
              <Slider
                value={zoom}
                onChange={(_, value) => { updateZoom(value as number) }}
                min={1}
                max={1000}
                disabled={!selectedVideo || isLoading}
                valueLabelDisplay='auto'
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
                disabled={!selectedVideo || isLoading}
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

  const [name, setName] = useState<string>(spliceRegion?.name ?? '')
  const [helperText, setHelperText] = useState<string>('')

  const handleChangeName = (): void => {
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

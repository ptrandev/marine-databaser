import { FC, useState, useEffect } from 'react'
import WavesurferPlayer from '@wavesurfer/react'
import SpectrogramPlugin from "wavesurfer.js/dist/plugins/spectrogram.js"
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'
import RegionPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { Box, IconButton, Slider, Stack, Typography } from '@mui/material'
import { ipcRenderer } from 'electron'
import colormap from 'colormap'
import useSpliceVideo from '@/hooks/useSpliceVideo'
import { Delete } from '@mui/icons-material'

const colors = colormap({
  colormap: 'hot',
  nshades: 256,
  format: 'float',
  alpha: 1,
})

const AudioVisualizers: FC = () => {
  const { selectedVideo, videoRef, splicePoints, modifySplicePoint, deleteSplicePoint } = useSpliceVideo()
  
  const [zoom, setZoom] = useState<number>(1)
  const [frequencyMax, setFrequencyMax] = useState<number>(22_050)
  const [audioSampleRate, setAudioSampleRate] = useState<number>(44_100)

  const [wsRegions, setWsRegions] = useState<RegionPlugin>()

  useEffect(() => {
    if (!wsRegions) {
      return
    }

    wsRegions.clearRegions()

    splicePoints.forEach(([start, end], i) => {
      const deleteButton = document.createElement('div')
      deleteButton.innerHTML = `<button style="background: none; border: none; cursor: pointer;" title="Delete"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></button>`
      
      deleteButton.onclick = (e) => {
        deleteSplicePoint([start, end])
        e.stopPropagation()
      }

      const region = wsRegions.addRegion({
        start: start,
        end: end,
        color: 'rgba(0, 0, 255, 0.1)',
        drag: true,
        resize: true,
        id: `${start} ${end}`,
        content: deleteButton,
      })

      region.on('update-end', () => {
        const [start, end] = region.id.split(' ').map(Number)
        modifySplicePoint([start, end], [region.start, region.end])
      })
    })
  }, [splicePoints, wsRegions])

  useEffect(() => {
    if (!selectedVideo) {
      return
    }

    // restore values to default
    setZoom(1)
    setFrequencyMax(22_050)
    setAudioSampleRate(44_100)

    ipcRenderer.send('get-audio-sample-rate', {
      filePath: selectedVideo,
    })

    ipcRenderer.once('got-audio-sample-rate', (_, sampleRate) => {
      setAudioSampleRate(sampleRate)
    })
  }, [selectedVideo])

  useEffect(() => {
    setFrequencyMax(audioSampleRate / 2)
  }, [audioSampleRate])

  return (
    <Box>
      <WavesurferPlayer
        height={256}
        media={videoRef!}
        progressColor='#1976d2'
        minPxPerSec={zoom}
        dragToSeek
        normalize
        // @ts-ignore
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
            colorMap: colors,
            splitChannels: false,
          }))

          const wsRegions = wavesurfer.registerPlugin(RegionPlugin.create())
          setWsRegions(wsRegions)
        }}
      />
      <Box maxWidth='calc(100% - 32px)'>
        <Stack direction='row' alignItems='center' gap={2}>
          <Typography variant='body2'>
            Zoom
          </Typography>
          <Slider
            value={zoom}
            onChange={(_, value) => setZoom(value as number)}
            min={1}
            max={5000}
          />
        </Stack>
        <Stack direction='row' alignItems='center' gap={2}>
          <Typography variant='body2' noWrap>
            Max Frequency (Hz)
          </Typography>
          <Slider
            value={frequencyMax}
            onChange={(_, value) => setFrequencyMax(value as number)}
            min={0}
            max={audioSampleRate / 2}
            valueLabelDisplay='auto'
            sx={{
              flex: 1,
            }}
          />
        </Stack>
      </Box>
    </Box>
  )
}

export default AudioVisualizers
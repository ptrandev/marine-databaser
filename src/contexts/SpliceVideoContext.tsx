import { convertSecondsToFrames } from '@/utils/video'
import { ipcRenderer } from 'electron'
import { FC, createContext, useMemo, useState } from 'react'
import { useEffect } from 'react'

export interface SpliceVideoContextValue {
  selectedVideo: string
  updateSelectedVideo: (video: string) => void
  splicePoints: [number, number][] // [start, end]
  addSplicePoint: (currentTime: number) => void
  deleteSplicePoint: (splicePoint: [number, number]) => void
  modifySplicePoint: (splicePoint: [number, number], newSplicePoint: [number, number]) => void
  updateSplicePoints: (splicePoints: [number, number][]) => void
  numSplicePointsCompleted: number
  isSplicingVideo: boolean
  handleSpliceVideo: ({
    outputDirectory,
  }: {
    outputDirectory?: string
  }) => void
  errorMessages: string[]
  videoFramerate: number | null
  videoRef: HTMLVideoElement | null
  videoDuration: number
  videoTotalFrames: number
  updateVideoRef: (video: HTMLVideoElement | null) => void
  isUnsavedSplicePoints: boolean
  addUnsavedSplicePoint: (splicePoint: string) => void
  removeUnsavedSplicePoint: (splicePoint: string) => void
}

const SpliceVideoContext = createContext<SpliceVideoContextValue>(undefined as any)

interface SpliceVideoProviderProps {
  children: React.ReactNode
}

export const SpliceVideoProvider: FC<SpliceVideoProviderProps> = ({ children }) => {
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [splicePoints, setSplicePoints] = useState<[number, number][]>([])
  const [numSplicePointsCompleted, setNumSplicePointsCompleted] = useState<number>(0)
  const [isSplicingVideo, setIsSplicingVideo] = useState<boolean>(false)
  const [unsavedSplicePoints, setUnsavedSplicePoints] = useState<string[]>([])

  const [errorMessages, setErrorMessages] = useState<string[]>([])

  // when selectedVideo changes, use electron to get the framerate of the video
  const [videoFramerate, setVideoFramerate] = useState<number | null>(null)

  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  
  const videoDuration = useMemo(() => {
    return videoRef?.duration || 0
  }, [videoRef?.duration])

  const videoTotalFrames = useMemo(() => {
    return convertSecondsToFrames(videoDuration, videoFramerate!)
  }, [videoDuration, videoFramerate])

  useEffect(() => {
    setVideoFramerate(null)

    if (!selectedVideo) {
      return
    }

    ipcRenderer.send('get-video-framerate', {
      videoPath: selectedVideo,
    })

    ipcRenderer.once('got-video-framerate', (_, framerate) => {
      // evaluate the string as a number; it is in the form of '30/1'
      framerate = eval(framerate)
      setVideoFramerate(framerate)
    })

    ipcRenderer.once('get-video-framerate-failed', (_, errorMessage) => {
      setErrorMessages((prev) => [...prev, errorMessage])
    })

    return () => {
      ipcRenderer.removeAllListeners('got-video-framerate')
      ipcRenderer.removeAllListeners('get-video-framerate-failed')
    }
  }, [selectedVideo])

  const addUnsavedSplicePoint = (splicePoint: string) => {
    setUnsavedSplicePoints((prev) => [...prev, splicePoint])
  }

  const removeUnsavedSplicePoint = (splicePoint: string) => {
    setUnsavedSplicePoints((prev) => prev.filter((splicePoint_) => splicePoint_ !== splicePoint))
  }

  const isUnsavedSplicePoints = useMemo(() => {
    return unsavedSplicePoints.length > 0
  }, [unsavedSplicePoints])
  
  const updateVideoRef = (video: HTMLVideoElement | null) => {
    setVideoRef(video)
  }

  const handleSpliceVideo = ({
    outputDirectory,
  }: {
    outputDirectory?: string
  }) => {
    // get length of video
    const video = document.getElementById('splice-video') as HTMLVideoElement

    if (!video) {
      return
    }

    setIsSplicingVideo(true)

    ipcRenderer.send('splice-video', {
      videoPath: selectedVideo,
      splicePoints,
      outputDirectory,
    })

    ipcRenderer.once('spliced-video', () => {
      setIsSplicingVideo(false)
      setNumSplicePointsCompleted(0)
    })
  }

  const updateSelectedVideo = (video: string) => {
    setSelectedVideo(video)
    setSplicePoints([])
  }

  const updateSplicePoints = (splicePoints: [number, number][]) => {
    // remove duplicates (remember to compare values and not references)
    // sort by start time but use end time as a tiebreaker
    setSplicePoints(
      splicePoints
        .filter((splicePoint, index, self) => self.findIndex(([start, end]) => start === splicePoint[0] && end === splicePoint[1]) === index)
        .sort((a, b) => {
          const [startA, endA] = a
          const [startB, endB] = b
          return startA - startB || endA - endB
        })
    )
  }

  const addSplicePoint = (currentTime: number) => {
    // first splice point...
    if (splicePoints.length === 0) {
      updateSplicePoints([[0, currentTime]])
      return
    }

    // check if the current time is in the middle of a splice point
    // if so, the start is the closest start to the current time and the end is the current time
    const [closestStart, closestEnd] = splicePoints.find(([start, end]) => start < currentTime && currentTime < end) || [-1, -1]

    if (closestStart !== -1 && closestEnd !== -1) {
      updateSplicePoints([...splicePoints, [closestStart, currentTime]])
      return
    }

    // check if the current time is after an existing splice point but before the next splice point
    // if so, the start is the closest end to the current time and the end is the current time
    const [nextStart, nextEnd] = splicePoints.find(([start, end]) => currentTime < start) || [-1, -1]
    const [prevStart, prevEnd] = splicePoints.find(([start, end]) => end < currentTime) || [-1, -1]

    if (nextStart !== -1 && nextEnd !== -1 && prevStart !== -1 && prevEnd !== -1) {
      updateSplicePoints([...splicePoints, [prevEnd, currentTime]])
      return
    }

    // check if the current time is before an existing splice point
    // if so, the start is 0 and the end is the current time
    const [firstStart,] = splicePoints[0]
    if (currentTime < firstStart) {
      updateSplicePoints([[0, currentTime], ...splicePoints])
      return
    }

    // else get the latest end splice point and add a new splice point with the start being the latest end and the end being the current time
    const [_, latestEnd] = splicePoints.sort((a, b) => a[1] - b[1])[splicePoints.length - 1]
    updateSplicePoints([...splicePoints, [latestEnd, currentTime]])
  }

  const deleteSplicePoint = (splicePoint: [number, number]) => {
    // remember to compare values and not references
    // ensure this works with splicePoints that have the same start and end
    updateSplicePoints(splicePoints.filter(([start, end]) => start !== splicePoint[0] || end !== splicePoint[1]))
  }

  const modifySplicePoint = (splicePoint: [number, number], newSplicePoint: [number, number]) => {
    // find splicePoint and replace with newSplicePoint
    updateSplicePoints(splicePoints.map((splicePoint_) => splicePoint_[0] === splicePoint[0] && splicePoint_[1] === splicePoint[1] ? newSplicePoint : splicePoint_))
  }

  useEffect(() => {
    ipcRenderer.on('spliced-point-video', () => {
      setNumSplicePointsCompleted((prev) => prev + 1)
    })

    ipcRenderer.on('splice-point-video-failed', (_, err) => {
      setErrorMessages((prev) => [...prev, err])
    });

    return () => {
      ipcRenderer.removeAllListeners('spliced-point-video')
      ipcRenderer.removeAllListeners('splice-point-video-failed')
    }
  }, [])

  const contextValue = useMemo<SpliceVideoContextValue>(() => {
    return {
      selectedVideo,
      updateSelectedVideo,
      numSplicePointsCompleted,
      addSplicePoint,
      deleteSplicePoint,
      modifySplicePoint,
      splicePoints,
      isSplicingVideo,
      handleSpliceVideo,
      errorMessages,
      videoFramerate,
      videoRef,
      updateVideoRef,
      updateSplicePoints,
      videoDuration,
      videoTotalFrames,
      isUnsavedSplicePoints,
      addUnsavedSplicePoint,
      removeUnsavedSplicePoint,
    }
  }, [selectedVideo, numSplicePointsCompleted, updateSelectedVideo, splicePoints, isSplicingVideo, handleSpliceVideo, deleteSplicePoint, addSplicePoint, modifySplicePoint, errorMessages, videoFramerate, videoRef, updateVideoRef, updateSplicePoints, videoDuration, videoTotalFrames, isUnsavedSplicePoints, addUnsavedSplicePoint, removeUnsavedSplicePoint])

  return (
    <SpliceVideoContext.Provider value={contextValue}>
      {children}
    </SpliceVideoContext.Provider>
  )
}

export default SpliceVideoContext
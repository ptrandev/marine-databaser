import { convertSecondsToFrames } from '@/utils/video'
import { ipcRenderer } from 'electron'
import { FC, createContext, useMemo, useState } from 'react'
import { useEffect } from 'react'

interface EventBase {
  type: 'add' | 'delete' | 'modify'
  splicePoint: [number, number]
}

interface AddEvent extends EventBase {
  type: 'add'
}

interface DeleteEvent extends EventBase {
  type: 'delete'
}

interface ModifyEvent extends EventBase {
  type: 'modify'
  newSplicePoint: [number, number]
}

type Event = AddEvent | DeleteEvent | ModifyEvent


export interface SpliceVideoContextValue {
  selectedVideo: string
  updateSelectedVideo: (video: string) => void
  splicePoints: [number, number][] // [start, end]
  initSplicePoint: (currentTime: number) => void
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
  videoDuration: number // in seconds, decimal
  videoTotalFrames: number
  updateVideoRef: (video: HTMLVideoElement | null) => void
  isUnsavedSplicePoints: boolean
  addUnsavedSplicePoint: (splicePoint: [number, number]) => void
  removeUnsavedSplicePoint: (splicePoint: [number, number]) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const SpliceVideoContext = createContext<SpliceVideoContextValue>(undefined as any)

interface SpliceVideoProviderProps {
  children: React.ReactNode
}

export const SpliceVideoProvider: FC<SpliceVideoProviderProps> = ({ children }) => {
  const [splicePoints, setSplicePoints] = useState<[number, number][]>([])
  const [unsavedSplicePoints, setUnsavedSplicePoints] = useState<[number, number][]>([])

  // a running ledger of all splice point events
  const [history, setHistory] = useState<Event[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  const [numSplicePointsCompleted, setNumSplicePointsCompleted] = useState<number>(0)
  const [isSplicingVideo, setIsSplicingVideo] = useState<boolean>(false)

  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [videoFramerate, setVideoFramerate] = useState<number | null>(null)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)

  const [errorMessages, setErrorMessages] = useState<string[]>([])

  const videoDuration = useMemo(() => {
    return videoRef?.duration || 0
  }, [videoRef?.duration])

  const videoTotalFrames = useMemo(() => {
    return convertSecondsToFrames(videoDuration, videoFramerate!)
  }, [videoDuration, videoFramerate])

  const isUnsavedSplicePoints = useMemo(() => {
    return unsavedSplicePoints.length > 0
  }, [unsavedSplicePoints])

  const addUnsavedSplicePoint = (splicePoint: [number, number]) => {
    setUnsavedSplicePoints((prev) => [...prev, splicePoint])
  }

  const removeUnsavedSplicePoint = (splicePoint: [number, number]) => {
    setUnsavedSplicePoints((prev) => prev.filter((splicePoint_) => splicePoint_ !== splicePoint))
  }

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

  const addEventToHistory = (event: Event) => {
    // remove future events when a new event is added
    setHistory((prev) => prev.slice(0, historyIndex + 1))

    // add new event to history
    setHistory((prev) => [...prev, event])

    // update history index
    setHistoryIndex(history.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      // apply event to reverse the action
      const event = history[historyIndex]

      switch (event.type) {
        case 'add':
          deleteSplicePoint(event.splicePoint)
          break
        case 'delete':
          initSplicePoint(event.splicePoint[0])
          break
        case 'modify':
          modifySplicePoint(event.newSplicePoint, event.splicePoint)
          break
      }
    }

    setHistoryIndex((prev) => prev - 1)
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      // apply event to reverse the action
      const event = history[historyIndex + 1]

      switch (event.type) {
        case 'add':
          initSplicePoint(event.splicePoint[0])
          break
        case 'delete':
          deleteSplicePoint(event.splicePoint)
          break
        case 'modify':
          modifySplicePoint(event.splicePoint, event.newSplicePoint)
          break
      }
    }

    setHistoryIndex((prev) => prev + 1)
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

    // ensure that unsavedSplicePoints doesn't contain any splice points that aren't in splicePoints
    setUnsavedSplicePoints((prev) => prev.filter((splicePoint) => splicePoints.find(([start, end]) => start === splicePoint[0] && end === splicePoint[1])))
  }

  const initSplicePoint = (currentTime: number) => {
    // first splice point...
    if (splicePoints.length === 0) {
      updateSplicePoints([[0, currentTime]])

      addEventToHistory({
        type: 'add',
        splicePoint: [0, currentTime],
      })
  
      return
    }

    // check if the current time is in the middle of a splice point
    // if so, the start is the closest start to the current time and the end is the current time
    const [closestStart, closestEnd] = splicePoints.find(([start, end]) => start < currentTime && currentTime < end) || [-1, -1]

    if (closestStart !== -1 && closestEnd !== -1) {
      updateSplicePoints([...splicePoints, [closestStart, currentTime]])

      addEventToHistory({
        type: 'add',
        splicePoint: [closestStart, currentTime],
      })

      return
    }

    // check if the current time is after an existing splice point but before the next splice point
    // if so, the start is the closest end to the current time and the end is the current time
    const [nextStart, nextEnd] = splicePoints.find(([start, end]) => currentTime < start) || [-1, -1]
    const [prevStart, prevEnd] = splicePoints.find(([start, end]) => end < currentTime) || [-1, -1]

    if (nextStart !== -1 && nextEnd !== -1 && prevStart !== -1 && prevEnd !== -1) {
      updateSplicePoints([...splicePoints, [prevEnd, currentTime]])

      addEventToHistory({
        type: 'add',
        splicePoint: [prevEnd, currentTime],
      })

      return
    }

    // check if the current time is before an existing splice point
    // if so, the start is 0 and the end is the current time
    const [firstStart,] = splicePoints[0]
    if (currentTime < firstStart) {
      updateSplicePoints([[0, currentTime], ...splicePoints])

      addEventToHistory({
        type: 'add',
        splicePoint: [0, currentTime],
      })

      return
    }

    // else get the latest end splice point and add a new splice point with the start being the latest end and the end being the current time
    const [_, latestEnd] = splicePoints.sort((a, b) => a[1] - b[1])[splicePoints.length - 1]
    updateSplicePoints([...splicePoints, [latestEnd, currentTime]])

    addEventToHistory({
      type: 'add',
      splicePoint: [latestEnd, currentTime],
    })
  }

  const deleteSplicePoint = (splicePoint: [number, number]) => {
    // remember to compare values and not references
    // ensure this works with splicePoints that have the same start and end
    updateSplicePoints(splicePoints.filter(([start, end]) => start !== splicePoint[0] || end !== splicePoint[1]))

    // remove from unsaved splice points if it exists
    removeUnsavedSplicePoint(splicePoint)

    addEventToHistory({
      type: 'delete',
      splicePoint,
    })
  }

  const modifySplicePoint = (splicePoint: [number, number], newSplicePoint: [number, number]) => {
    // find splicePoint and replace with newSplicePoint
    updateSplicePoints(splicePoints.map((splicePoint_) => splicePoint_[0] === splicePoint[0] && splicePoint_[1] === splicePoint[1] ? newSplicePoint : splicePoint_))
    
    addEventToHistory({
      type: 'modify',
      splicePoint,
      newSplicePoint,
    })
  }

  // use electron to get the framerate of the video once it is selected
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

  const canUndo = useMemo(() => {
    return historyIndex > 0
  }, [historyIndex])

  const canRedo = useMemo(() => {
    return historyIndex < history.length - 1 && history.length > 0
  }, [historyIndex, history.length])

  const contextValue = useMemo<SpliceVideoContextValue>(() => {
    return {
      selectedVideo,
      updateSelectedVideo,
      numSplicePointsCompleted,
      initSplicePoint,
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
      history,
      undo,
      redo,
      canUndo,
      canRedo,
    }
  }, [selectedVideo, numSplicePointsCompleted, updateSelectedVideo, splicePoints, isSplicingVideo, handleSpliceVideo, deleteSplicePoint, initSplicePoint, modifySplicePoint, errorMessages, videoFramerate, videoRef, updateVideoRef, updateSplicePoints, videoDuration, videoTotalFrames, isUnsavedSplicePoints, addUnsavedSplicePoint, removeUnsavedSplicePoint, history, undo, redo, canUndo, canRedo])

  return (
    <SpliceVideoContext.Provider value={contextValue}>
      {children}
    </SpliceVideoContext.Provider>
  )
}

export default SpliceVideoContext
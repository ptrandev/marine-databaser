import { convertSecondsToFrames } from '@/utils/video'
import { ipcRenderer } from 'electron'
import { FC, createContext, useMemo, useState } from 'react'
import { useEffect } from 'react'


interface AddEvent {
  type: 'add'
  splicePoint: [number, number]
}

interface DeleteEvent {
  type: 'delete'
  splicePoint: [number, number]
}

interface ModifyEvent {
  type: 'modify'
  splicePoint: [number, number]
  newSplicePoint: [number, number]
}

interface LoadEvent {
  type: 'load'
  splicePoints: [number, number][]
}

interface DeleteAllEvent {
  type: 'deleteAll'
  splicePoints: [number, number][]
}

type Event = AddEvent | DeleteEvent | ModifyEvent | LoadEvent | DeleteAllEvent

interface HistoryOptions {
  clearUndoHistory?: boolean
  addToEventHistory?: boolean
}

export interface SpliceVideoContextValue {
  selectedVideo: string
  updateSelectedVideo: (video: string) => void
  splicePoints: [number, number][] // [start, end]
  initSplicePoint: (currentTime: number) => void
  deleteSplicePoint: (splicePoint: [number, number], options?: HistoryOptions) => void
  modifySplicePoint: (splicePoint: [number, number], newSplicePoint: [number, number], options?: HistoryOptions) => void
  deleteAllSplicePoints: (options?: HistoryOptions) => void
  loadSplicePoints: (splicePoints: [number, number][], options?: HistoryOptions) => void
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

const MAXIMUM_EVENT_HISTORY_LENGTH = 100

export const SpliceVideoProvider: FC<SpliceVideoProviderProps> = ({ children }) => {
  const [splicePoints, setSplicePoints] = useState<[number, number][]>([])
  const [unsavedSplicePoints, setUnsavedSplicePoints] = useState<[number, number][]>([])

  // a stack of events that have occurred, used for undo
  const [eventHistory, setEventHistory] = useState<Event[]>([])
  // a stack of events that have been undone, used for redo
  const [undoHistory, setUndoHistory] = useState<Event[]>([])

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

  const addEventToEventHistory = (event: Event, {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    // if there are events in the undo history, clear them
    if (clearUndoHistory && undoHistory.length > 0) {
      setUndoHistory([])
    }

    if (addToEventHistory) {
      setEventHistory((prev) => [...prev, event])
    }
  }

  const undo = () => {
    if (eventHistory.length === 0) {
      return
    }

    const event = eventHistory[eventHistory.length - 1]

    switch (event.type) {
      case 'add':
        deleteSplicePoint(event.splicePoint, {
          clearUndoHistory: false,
        })
        break
      case 'delete':
        addSplicePoint(event.splicePoint, {
          clearUndoHistory: false,
        })
        break
      case 'modify':
        modifySplicePoint(event.newSplicePoint, event.splicePoint, {
          clearUndoHistory: false,
        })
        break
      case 'load':
        deleteAllSplicePoints({
          clearUndoHistory: false,
        })
        break
      case 'deleteAll':
        loadSplicePoints(event.splicePoints, {
          clearUndoHistory: false,
        })
        break
    }

    // remove event from event history
    setEventHistory((prev) => prev.slice(0, prev.length - 2))
    
    // add event to undo history
    setUndoHistory((prev) => [...prev, event])
  }

  const redo = () => {
    if (undoHistory.length === 0) {
      return
    }

    const event = undoHistory[undoHistory.length - 1]

    switch (event.type) {
      case 'add':
        addSplicePoint(event.splicePoint, {
          clearUndoHistory: false,
        })
        break
      case 'delete':
        deleteSplicePoint(event.splicePoint, {
          clearUndoHistory: false,
        })
        break
      case 'modify':
        modifySplicePoint(event.splicePoint, event.newSplicePoint, {
          clearUndoHistory: false,
        })
        break
      case 'load':
        loadSplicePoints(event.splicePoints, {
          clearUndoHistory: false,
        })
        break
      case 'deleteAll':
        deleteAllSplicePoints({
          clearUndoHistory: false,
        })
        break
    }

    // consume event from undo history
    setUndoHistory((prev) => prev.slice(0, prev.length - 1))
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

  /**
   * Manually add a splice point given a start and end time
   * @param splicePoint in seconds
   */
  const addSplicePoint = (splicePoint: [number, number], {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    // find splicePoint and replace with newSplicePoint
    updateSplicePoints([...splicePoints, splicePoint])

    addEventToEventHistory({
      type: 'add',
      splicePoint,
    }, {
      clearUndoHistory,
      addToEventHistory,
    })
  }

  /**
   * Automatically determines where to initialize a splice point based on the current time
   * @param currentTime in seconds
  */
  const initSplicePoint = (currentTime: number) => {
    // first splice point...
    if (splicePoints.length === 0) {
      updateSplicePoints([[0, currentTime]])

      addEventToEventHistory({
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

      addEventToEventHistory({
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

      addEventToEventHistory({
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

      addEventToEventHistory({
        type: 'add',
        splicePoint: [0, currentTime],
      })

      return
    }

    // else get the latest end splice point and add a new splice point with the start being the latest end and the end being the current time
    const [_, latestEnd] = splicePoints.sort((a, b) => a[1] - b[1])[splicePoints.length - 1]
    updateSplicePoints([...splicePoints, [latestEnd, currentTime]])

    addEventToEventHistory({
      type: 'add',
      splicePoint: [latestEnd, currentTime],
    })
  }

  /**
   * Manually delete a splice point
   * @param splicePoint in seconds
   */
  const deleteSplicePoint = (splicePoint: [number, number], {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    // remember to compare values and not references
    // ensure this works with splicePoints that have the same start and end
    updateSplicePoints(splicePoints.filter(([start, end]) => start !== splicePoint[0] || end !== splicePoint[1]))

    // remove from unsaved splice points if it exists
    removeUnsavedSplicePoint(splicePoint)

    addEventToEventHistory({
      type: 'delete',
      splicePoint,
    }, {
      clearUndoHistory,
      addToEventHistory,
    })
  }

  /**
   * Manually modify a splice point
   * @param splicePoint in seconds
   * @param newSplicePoint in seconds
   */
  const modifySplicePoint = (splicePoint: [number, number], newSplicePoint: [number, number], {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    // find splicePoint and replace with newSplicePoint
    updateSplicePoints(splicePoints.map((splicePoint_) => splicePoint_[0] === splicePoint[0] && splicePoint_[1] === splicePoint[1] ? newSplicePoint : splicePoint_))

    addEventToEventHistory({
      type: 'modify',
      splicePoint,
      newSplicePoint,
    }, {
      clearUndoHistory,
      addToEventHistory,
    })
  }

  /**
   * Manually load splice points
   * @param splicePoints in seconds
   */
  const loadSplicePoints = (splicePoints: [number, number][], {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    updateSplicePoints(splicePoints)
    setEventHistory([])
    setUndoHistory([])

    addEventToEventHistory({
      type: 'load',
      splicePoints,
    }, {
      clearUndoHistory,
      addToEventHistory,
    })
  }

  /**
   * Manually delete all splice points
   */
  const deleteAllSplicePoints = ({
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    addEventToEventHistory({
      type: 'deleteAll',
      splicePoints,
    }, {
      clearUndoHistory,
      addToEventHistory: false,
    })

    updateSplicePoints([])
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

  // only hold the last MAXIMUM_EVENT_HISTORY_LENGTH most recent events in the event history
  useEffect(() => {
    if (eventHistory.length > MAXIMUM_EVENT_HISTORY_LENGTH) {
      setEventHistory((prev) => prev.slice(prev.length - MAXIMUM_EVENT_HISTORY_LENGTH))
    }
  }, [eventHistory.length])

  const canUndo = useMemo(() => {
    return eventHistory.length > 0
  }, [eventHistory.length])

  const canRedo = useMemo(() => {
    return undoHistory.length > 0
  }, [undoHistory.length])

  const contextValue = useMemo<SpliceVideoContextValue>(() => {
    return {
      selectedVideo,
      updateSelectedVideo,
      numSplicePointsCompleted,
      initSplicePoint,
      deleteSplicePoint,
      modifySplicePoint,
      deleteAllSplicePoints,
      loadSplicePoints,
      splicePoints,
      isSplicingVideo,
      handleSpliceVideo,
      errorMessages,
      videoFramerate,
      videoRef,
      updateVideoRef,
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
  }, [selectedVideo, numSplicePointsCompleted, updateSelectedVideo, splicePoints, isSplicingVideo, handleSpliceVideo, deleteSplicePoint, deleteAllSplicePoints, loadSplicePoints, initSplicePoint, modifySplicePoint, errorMessages, videoFramerate, videoRef, updateVideoRef, videoDuration, videoTotalFrames, isUnsavedSplicePoints, addUnsavedSplicePoint, removeUnsavedSplicePoint, history, undo, redo, canUndo, canRedo])

  return (
    <SpliceVideoContext.Provider value={contextValue}>
      {children}
    </SpliceVideoContext.Provider>
  )
}

export default SpliceVideoContext
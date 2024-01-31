import { ipcRenderer } from 'electron'
import { FC, createContext, useMemo, useState } from 'react'
import { useEffect } from 'react'

interface AddEvent {
  type: 'add'
  spliceRegion: [number, number]
}

interface DeleteEvent {
  type: 'delete'
  spliceRegion: [number, number]
}

interface ModifyEvent {
  type: 'modify'
  spliceRegion: [number, number]
  newSplicePoint: [number, number]
}

interface LoadEvent {
  type: 'load'
  spliceRegions: [number, number][]
}

interface DeleteAllEvent {
  type: 'deleteAll'
  spliceRegions: [number, number][]
}

type Event = AddEvent | DeleteEvent | ModifyEvent | LoadEvent | DeleteAllEvent

interface HistoryOptions {
  clearUndoHistory?: boolean
  addToEventHistory?: boolean
}

export interface SpliceVideoContextValue {
  selectedVideo: string
  updateSelectedVideo: (video: string) => void
  spliceRegions: [number, number][] // [start, end]
  initSplicePoint: (currentTime: number) => void
  deleteSplicePoint: (spliceRegion: [number, number], options?: HistoryOptions) => void
  modifySplicePoint: (spliceRegion: [number, number], newSplicePoint: [number, number], options?: HistoryOptions) => void
  deleteAllSplicePoints: (options?: HistoryOptions) => void
  loadSplicePoints: (spliceRegions: [number, number][], options?: HistoryOptions) => void
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
  updateVideoRef: (video: HTMLVideoElement | null) => void
  videoDuration: number // in seconds, decimal
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
  const [spliceRegions, setSplicePoints] = useState<[number, number][]>([])

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

  const canUndo = useMemo(() => {
    return eventHistory.length > 0
  }, [eventHistory.length])

  const canRedo = useMemo(() => {
    return undoHistory.length > 0
  }, [undoHistory.length])

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
      spliceRegions,
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
        deleteSplicePoint(event.spliceRegion, {
          clearUndoHistory: false,
          addToEventHistory: false,
        })
        break
      case 'delete':
        addSplicePoint(event.spliceRegion, {
          clearUndoHistory: false,
          addToEventHistory: false,
        })
        break
      case 'modify':
        modifySplicePoint(event.newSplicePoint, event.spliceRegion, {
          clearUndoHistory: false,
          addToEventHistory: false,
        })
        break
      case 'load':
        deleteAllSplicePoints({
          clearUndoHistory: false,
          addToEventHistory: false,
        })
        break
      case 'deleteAll':
        loadSplicePoints(event.spliceRegions, {
          clearUndoHistory: false,
          addToEventHistory: false,
        })
        break
    }

    // consume event from event history
    setEventHistory((prev) => prev.slice(0, prev.length - 1))

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
        addSplicePoint(event.spliceRegion, {
          clearUndoHistory: false,
        })
        break
      case 'delete':
        deleteSplicePoint(event.spliceRegion, {
          clearUndoHistory: false,
        })
        break
      case 'modify':
        modifySplicePoint(event.spliceRegion, event.newSplicePoint, {
          clearUndoHistory: false,
        })
        break
      case 'load':
        loadSplicePoints(event.spliceRegions, {
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

  const updateSplicePoints = (spliceRegions: [number, number][]) => {
    // remove duplicates (remember to compare values and not references)
    // sort by start time but use end time as a tiebreaker
    setSplicePoints(
      spliceRegions
        .filter((spliceRegion, index, self) => self.findIndex(([start, end]) => start === spliceRegion[0] && end === spliceRegion[1]) === index)
        .sort((a, b) => {
          const [startA, endA] = a
          const [startB, endB] = b
          return startA - startB || endA - endB
        })
    )
  }

  /**
   * Manually add a splice region given a start and end time
   * @param spliceRegion in seconds
   */
  const addSplicePoint = (spliceRegion: [number, number], {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    // find spliceRegion and replace with newSplicePoint
    updateSplicePoints([...spliceRegions, spliceRegion])

    addEventToEventHistory({
      type: 'add',
      spliceRegion,
    }, {
      clearUndoHistory,
      addToEventHistory,
    })
  }

  /**
   * Automatically determines where to initialize a splice region based on the current time
   * @param currentTime in seconds
  */
  const initSplicePoint = (currentTime: number) => {
    // first splice region...
    if (spliceRegions.length === 0) {
      updateSplicePoints([[0, currentTime]])

      addEventToEventHistory({
        type: 'add',
        spliceRegion: [0, currentTime],
      })

      return
    }

    // check if the current time is in the middle of a splice region
    // if so, the start is the closest start to the current time and the end is the current time
    const [closestStart, closestEnd] = spliceRegions.find(([start, end]) => start < currentTime && currentTime < end) || [-1, -1]

    if (closestStart !== -1 && closestEnd !== -1) {
      updateSplicePoints([...spliceRegions, [closestStart, currentTime]])

      addEventToEventHistory({
        type: 'add',
        spliceRegion: [closestStart, currentTime],
      })

      return
    }

    // check if the current time is after an existing splice region but before the next splice region
    // if so, the start is the closest end to the current time and the end is the current time
    const [nextStart, nextEnd] = spliceRegions.find(([start, end]) => currentTime < start) || [-1, -1]
    const [prevStart, prevEnd] = spliceRegions.find(([start, end]) => end < currentTime) || [-1, -1]

    if (nextStart !== -1 && nextEnd !== -1 && prevStart !== -1 && prevEnd !== -1) {
      updateSplicePoints([...spliceRegions, [prevEnd, currentTime]])

      addEventToEventHistory({
        type: 'add',
        spliceRegion: [prevEnd, currentTime],
      })

      return
    }

    // check if the current time is before an existing splice region
    // if so, the start is 0 and the end is the current time
    const [firstStart,] = spliceRegions[0]
    if (currentTime < firstStart) {
      updateSplicePoints([[0, currentTime], ...spliceRegions])

      addEventToEventHistory({
        type: 'add',
        spliceRegion: [0, currentTime],
      })

      return
    }

    // else get the latest end splice region and add a new splice region with the start being the latest end and the end being the current time
    const [_, latestEnd] = spliceRegions.sort((a, b) => a[1] - b[1])[spliceRegions.length - 1]
    updateSplicePoints([...spliceRegions, [latestEnd, currentTime]])

    addEventToEventHistory({
      type: 'add',
      spliceRegion: [latestEnd, currentTime],
    })
  }

  /**
   * Manually delete a splice region
   * @param spliceRegion in seconds
   */
  const deleteSplicePoint = (spliceRegion: [number, number], {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    // remember to compare values and not references
    // ensure this works with spliceRegions that have the same start and end
    updateSplicePoints(spliceRegions.filter(([start, end]) => start !== spliceRegion[0] || end !== spliceRegion[1]))

    addEventToEventHistory({
      type: 'delete',
      spliceRegion,
    }, {
      clearUndoHistory,
      addToEventHistory,
    })
  }

  /**
   * Manually modify a splice region
   * @param spliceRegion in seconds
   * @param newSplicePoint in seconds
   */
  const modifySplicePoint = (spliceRegion: [number, number], newSplicePoint: [number, number], {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    // find spliceRegion and replace with newSplicePoint
    updateSplicePoints(spliceRegions.map((splicePoint_) => splicePoint_[0] === spliceRegion[0] && splicePoint_[1] === spliceRegion[1] ? newSplicePoint : splicePoint_))

    addEventToEventHistory({
      type: 'modify',
      spliceRegion,
      newSplicePoint,
    }, {
      clearUndoHistory,
      addToEventHistory,
    })
  }

  /**
   * Manually load splice regions
   * @param spliceRegions in seconds
   */
  const loadSplicePoints = (spliceRegions: [number, number][], {
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    updateSplicePoints(spliceRegions)

    if (clearUndoHistory) {
      setUndoHistory([])
    }

    if (addToEventHistory) {
      setEventHistory([])
    }

    addEventToEventHistory({
      type: 'load',
      spliceRegions,
    }, {
      clearUndoHistory,
      addToEventHistory,
    })
  }

  /**
   * Manually delete all splice regions
   */
  const deleteAllSplicePoints = ({
    clearUndoHistory = true,
    addToEventHistory = true,
  }: HistoryOptions = {
    }) => {
    addEventToEventHistory({
      type: 'deleteAll',
      spliceRegions,
    }, {
      clearUndoHistory,
      addToEventHistory,
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
      spliceRegions,
      isSplicingVideo,
      handleSpliceVideo,
      errorMessages,
      videoFramerate,
      videoRef,
      updateVideoRef,
      videoDuration,
      history,
      undo,
      redo,
      canUndo,
      canRedo,
    }
  }, [selectedVideo, numSplicePointsCompleted, updateSelectedVideo, spliceRegions, isSplicingVideo, handleSpliceVideo, deleteSplicePoint, deleteAllSplicePoints, loadSplicePoints, initSplicePoint, modifySplicePoint, errorMessages, videoFramerate, videoRef, updateVideoRef, videoDuration, history, undo, redo, canUndo, canRedo])

  return (
    <SpliceVideoContext.Provider value={contextValue}>
      {children}
    </SpliceVideoContext.Provider>
  )
}

export default SpliceVideoContext
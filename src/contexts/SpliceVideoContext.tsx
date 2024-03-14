import { ipcRenderer } from 'electron'
import { type FC, createContext, useMemo, useState, useEffect } from 'react'
import { type SpliceRegion } from '../../shared/types'
import path from 'path'
import { enqueueSnackbar } from 'notistack'
import fs from 'fs'

interface AddEvent {
  type: 'add'
  spliceRegion: SpliceRegion
}

interface DeleteEvent {
  type: 'delete'
  spliceRegion: SpliceRegion
}

interface ModifyEvent {
  type: 'modify'
  spliceRegion: SpliceRegion
  newSpliceRegion: SpliceRegion
}

interface LoadEvent {
  type: 'load'
  spliceRegions: SpliceRegion[]
}

interface DeleteAllEvent {
  type: 'deleteAll'
  spliceRegions: SpliceRegion[]
}

type Event = AddEvent | DeleteEvent | ModifyEvent | LoadEvent | DeleteAllEvent

interface HistoryOptions {
  clearUndoHistory?: boolean
  addToEventHistory?: boolean
}

export interface SpliceVideoContextValue {
  selectedVideo: string
  updateSelectedVideo: (video: string) => void
  videoBasename: string
  updateVideoBasename: (basename: string) => void
  videoUrl: string | null
  updateVideoUrl: (url: string) => void
  spliceRegions: SpliceRegion[]
  initSpliceRegion: (currentTime: number) => void
  deleteSpliceRegion: (spliceRegion: SpliceRegion, options?: HistoryOptions) => void
  modifySpliceRegion: (spliceRegion: SpliceRegion, newSpliceRegion: SpliceRegion, options?: HistoryOptions) => void
  deleteAllSpliceRegions: (options?: HistoryOptions) => void
  loadSpliceRegions: (spliceRegions: SpliceRegion[], options?: HistoryOptions) => void
  numSpliceRegionsCompleted: number
  isSplicingVideo: boolean
  handleSpliceVideo: ({
    outputDirectory
  }: {
    outputDirectory?: string
  }) => void
  videoFramerate: number | null
  videoRef: HTMLVideoElement | null
  updateVideoRef: (video: HTMLVideoElement | null) => void
  videoDuration: number | null // in seconds, decimal
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const SpliceVideoContext = createContext<SpliceVideoContextValue | null>(null)

interface SpliceVideoProviderProps {
  children?: React.ReactNode
}

const MAXIMUM_EVENT_HISTORY_LENGTH = 100

export const SpliceVideoProvider: FC<SpliceVideoProviderProps> = ({ children }) => {
  const [spliceRegions, setSpliceRegions] = useState<SpliceRegion[]>([])

  // a stack of events that have occurred, used for undo
  const [eventHistory, setEventHistory] = useState<Event[]>([])
  // a stack of events that have been undone, used for redo
  const [undoHistory, setUndoHistory] = useState<Event[]>([])

  const [numSpliceRegionsCompleted, setNumSpliceRegionsCompleted] = useState<number>(0)
  const [isSplicingVideo, setIsSplicingVideo] = useState<boolean>(false)

  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [videoBasename, setVideoBasename] = useState<string>('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const [videoFramerate, setVideoFramerate] = useState<number | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)

  const canUndo = useMemo(() => {
    return eventHistory.length > 0
  }, [eventHistory.length])

  const canRedo = useMemo(() => {
    return undoHistory.length > 0
  }, [undoHistory.length])

  const updateVideoRef = (video: HTMLVideoElement | null): void => {
    setVideoRef(video)
  }

  const handleSpliceVideo = ({
    outputDirectory
  }: {
    outputDirectory?: string
  }): void => {
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
      videoBasename
    })

    ipcRenderer.once('spliced-video', () => {
      setIsSplicingVideo(false)
      setNumSpliceRegionsCompleted(0)
    })
  }

  const updateVideoBasename = (basename: string): void => {
    setVideoBasename(basename)
  }

  const updateSelectedVideo = (video: string): void => {
    setSelectedVideo(video)
    setSpliceRegions([])
  }

  const updateVideoUrl = (url: string): void => {
    if (!url) {
      return
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }

    const blob = fs.readFileSync(url)
    const _url = URL.createObjectURL(new Blob([blob]))

    setVideoUrl(_url)
  }

  const addEventToEventHistory = (event: Event, {
    clearUndoHistory = true,
    addToEventHistory = true
  }: HistoryOptions = {}): void => {
    // if there are events in the undo history, clear them
    if (clearUndoHistory && undoHistory.length > 0) {
      setUndoHistory([])
    }

    if (addToEventHistory) {
      setEventHistory((prev) => [...prev, event])
    }
  }

  const undo = (): void => {
    if (eventHistory.length === 0) {
      return
    }

    const event = eventHistory[eventHistory.length - 1]

    switch (event.type) {
      case 'add':
        deleteSpliceRegion(event.spliceRegion, {
          clearUndoHistory: false,
          addToEventHistory: false
        })
        break
      case 'delete':
        addSpliceRegion(event.spliceRegion, {
          clearUndoHistory: false,
          addToEventHistory: false
        })
        break
      case 'modify':
        modifySpliceRegion(event.newSpliceRegion, event.spliceRegion, {
          clearUndoHistory: false,
          addToEventHistory: false
        })
        break
      case 'load':
        deleteAllSpliceRegions({
          clearUndoHistory: false,
          addToEventHistory: false
        })
        break
      case 'deleteAll':
        loadSpliceRegions(event.spliceRegions, {
          clearUndoHistory: false,
          addToEventHistory: false
        })
        break
    }

    // consume event from event history
    setEventHistory((prev) => prev.slice(0, prev.length - 1))

    // add event to undo history
    setUndoHistory((prev) => [...prev, event])
  }

  const redo = (): void => {
    if (undoHistory.length === 0) {
      return
    }

    const event = undoHistory[undoHistory.length - 1]

    switch (event.type) {
      case 'add':
        addSpliceRegion(event.spliceRegion, {
          clearUndoHistory: false
        })
        break
      case 'delete':
        deleteSpliceRegion(event.spliceRegion, {
          clearUndoHistory: false
        })
        break
      case 'modify':
        modifySpliceRegion(event.spliceRegion, event.newSpliceRegion, {
          clearUndoHistory: false
        })
        break
      case 'load':
        loadSpliceRegions(event.spliceRegions, {
          clearUndoHistory: false
        })
        break
      case 'deleteAll':
        deleteAllSpliceRegions({
          clearUndoHistory: false
        })
        break
    }

    // consume event from undo history
    setUndoHistory((prev) => prev.slice(0, prev.length - 1))
  }

  /**
   * Dedupe splice regions when they are updated
   */
  const updateSpliceRegions = (spliceRegions: SpliceRegion[]): void => {
    // remove duplicates (remember to compare values and not references)
    setSpliceRegions(
      spliceRegions
        .filter((spliceRegion, i, self) => self.findIndex((s) => s.start === spliceRegion.start && s.end === spliceRegion.end) === i)
    )
  }

  /**
   * Manually add a splice region given a start and end time
   * @param spliceRegion object representing a splice region
   */
  const addSpliceRegion = (spliceRegion: SpliceRegion, {
    clearUndoHistory = true,
    addToEventHistory = true
  }: HistoryOptions = {}): void => {
    updateSpliceRegions([...spliceRegions, spliceRegion])

    addEventToEventHistory({
      type: 'add',
      spliceRegion
    }, {
      clearUndoHistory,
      addToEventHistory
    })
  }

  /**
   * Automatically determines where to initialize a splice region based on the current time
   * @param currentTime in seconds
  */
  const initSpliceRegion = (currentTime: number): void => {
    if (!videoDuration) return

    const regionTime = [currentTime, currentTime + 0.5 > videoDuration ? currentTime - 0.5 : currentTime + 0.5]
    regionTime.sort((a, b) => a - b)

    addSpliceRegion({
      name: `${Date.now()}`, // use a unique name
      start: regionTime[0],
      end: regionTime[1]
    })
  }

  /**
   * Manually delete a splice region
   * @param spliceRegion object representing a splice region
   */
  const deleteSpliceRegion = (spliceRegion: SpliceRegion, {
    clearUndoHistory = true,
    addToEventHistory = true
  }: HistoryOptions = {}): void => {
    // remember to compare values and not references
    // ensure this works with spliceRegions that have the same start and end
    updateSpliceRegions(spliceRegions.filter((spliceRegion_) => spliceRegion_.start !== spliceRegion.start && spliceRegion_.end !== spliceRegion.end))

    addEventToEventHistory({
      type: 'delete',
      spliceRegion
    }, {
      clearUndoHistory,
      addToEventHistory
    })
  }

  /**
   * Manually modify a splice region
   * @param spliceRegion object representing a splice region
   * @param newSpliceRegion object representing a splice region
   */
  const modifySpliceRegion = (spliceRegion: SpliceRegion, newSpliceRegion: SpliceRegion, {
    clearUndoHistory = true,
    addToEventHistory = true
  }: HistoryOptions = {}): void => {
    // find spliceRegion, replace with newSpliceRegion
    updateSpliceRegions(spliceRegions.map((spliceRegion_) => {
      if (spliceRegion_.start === spliceRegion.start && spliceRegion_.end === spliceRegion.end && spliceRegion.name === spliceRegion_.name) {
        return newSpliceRegion
      }

      return spliceRegion_
    }))

    addEventToEventHistory({
      type: 'modify',
      spliceRegion,
      newSpliceRegion
    }, {
      clearUndoHistory,
      addToEventHistory
    })
  }

  /**
   * Manually load splice regions
   * @param spliceRegions object representing a splice region
   */
  const loadSpliceRegions = (spliceRegions: SpliceRegion[], {
    clearUndoHistory = true,
    addToEventHistory = true
  }: HistoryOptions = {}): void => {
    updateSpliceRegions(spliceRegions)

    if (clearUndoHistory) {
      setUndoHistory([])
    }

    if (addToEventHistory) {
      setEventHistory([])
    }

    addEventToEventHistory({
      type: 'load',
      spliceRegions
    }, {
      clearUndoHistory,
      addToEventHistory
    })
  }

  /**
   * Manually delete all splice regions
   */
  const deleteAllSpliceRegions = ({
    clearUndoHistory = true,
    addToEventHistory = true
  }: HistoryOptions = {}): void => {
    addEventToEventHistory({
      type: 'deleteAll',
      spliceRegions
    }, {
      clearUndoHistory,
      addToEventHistory
    })

    updateSpliceRegions([])
  }

  // use electron to get the framerate of the video once it is selected
  useEffect(() => {
    setVideoFramerate(null)
    setVideoDuration(null)

    if (!selectedVideo) {
      return
    }

    ipcRenderer.send('get-video-framerate', {
      videoPath: selectedVideo
    })

    ipcRenderer.once('got-video-framerate', (_, framerate: string) => {
      // evaluate the string as a number; it is in the form of '30/1'
      // eslint-disable-next-line no-eval
      const _framerate: number = eval(framerate)
      setVideoFramerate(_framerate)
    })

    ipcRenderer.once('get-video-framerate-error', (_, errMessage) => {
      enqueueSnackbar(`Error getting video framerate: ${errMessage}`, { variant: 'error' })
    })

    ipcRenderer.send('get-video-duration', {
      videoPath: selectedVideo
    })

    ipcRenderer.once('got-video-duration', (_, duration: number) => {
      setVideoDuration(duration)
    })

    ipcRenderer.once('get-video-duration-error', (_, errMessage) => {
      enqueueSnackbar(`Error getting video duration: ${errMessage}`, { variant: 'error' })
    })

    return () => {
      ipcRenderer.removeAllListeners('got-video-framerate')
      ipcRenderer.removeAllListeners('get-video-framerate-error')
      ipcRenderer.removeAllListeners('got-video-duration')
      ipcRenderer.removeAllListeners('get-video-duration-error')
    }
  }, [selectedVideo])

  useEffect(() => {
    ipcRenderer.on('spliced-point-video', () => {
      setNumSpliceRegionsCompleted((prev) => prev + 1)
    })

    ipcRenderer.on('splice-point-video-error', (_, errMessage) => {
      enqueueSnackbar(`Error splicing video: ${errMessage}`, { variant: 'error' })
    })

    return () => {
      ipcRenderer.removeAllListeners('spliced-point-video')
      ipcRenderer.removeAllListeners('splice-point-video-error')
    }
  }, [])

  // only hold the last MAXIMUM_EVENT_HISTORY_LENGTH most recent events in the event history
  useEffect(() => {
    if (eventHistory.length > MAXIMUM_EVENT_HISTORY_LENGTH) {
      setEventHistory((prev) => prev.slice(prev.length - MAXIMUM_EVENT_HISTORY_LENGTH))
    }
  }, [eventHistory.length])

  useEffect(() => {
    setVideoBasename(path.basename(selectedVideo).replace(/\.[^/.]+$/, ''))
    updateVideoUrl(selectedVideo)
  }, [selectedVideo])

  const contextValue = useMemo<SpliceVideoContextValue>(() => {
    return {
      selectedVideo,
      updateSelectedVideo,
      videoBasename,
      updateVideoBasename,
      videoUrl,
      updateVideoUrl,
      numSpliceRegionsCompleted,
      initSpliceRegion,
      deleteSpliceRegion,
      modifySpliceRegion,
      deleteAllSpliceRegions,
      loadSpliceRegions,
      spliceRegions,
      isSplicingVideo,
      handleSpliceVideo,
      videoFramerate,
      videoRef,
      updateVideoRef,
      videoDuration,
      history,
      undo,
      redo,
      canUndo,
      canRedo
    }
  }, [selectedVideo, numSpliceRegionsCompleted, updateSelectedVideo, videoBasename, updateVideoBasename, videoUrl, updateVideoUrl, spliceRegions, isSplicingVideo, handleSpliceVideo, deleteSpliceRegion, deleteAllSpliceRegions, loadSpliceRegions, initSpliceRegion, modifySpliceRegion, videoFramerate, videoRef, updateVideoRef, videoDuration, history, undo, redo, canUndo, canRedo])

  return (
    <SpliceVideoContext.Provider value={contextValue}>
      {children}
    </SpliceVideoContext.Provider>
  )
}

export default SpliceVideoContext

import { ipcRenderer } from 'electron'
import { FC, createContext, useMemo, useState } from 'react' 
import { useEffect } from 'react'

export interface SpliceVideoContextValue {
  selectedVideo: string
  updateSelectedVideo: (video: string) => void
  splicePoints: number[]
  updateSplicePoints: (splicePoints: number[]) => void
  numSplicePointsCompleted: number
  isSplicingVideo: boolean
  handleSpliceVideo: () => void
}

const SpliceVideoContext = createContext<SpliceVideoContextValue>(undefined as any)

interface SpliceVideoProviderProps {
  children: React.ReactNode
}

export const SpliceVideoProvider: FC<SpliceVideoProviderProps> = ({ children }) => {
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [splicePoints, setSplicePoints] = useState<number[]>([])
  const [numSplicePointsCompleted, setNumSplicePointsCompleted] = useState<number>(0)
  const [isSplicingVideo, setIsSplicingVideo] = useState<boolean>(false)
  
  const handleSpliceVideo = () => {
    setIsSplicingVideo(true)
  }

  const updateSelectedVideo = (video: string) => {
    setSelectedVideo(video)
  }

  const updateSplicePoints = (splicePoints: number[]) => {
    setSplicePoints(splicePoints)
  }

  useEffect(() => {
    updateSplicePoints([])
  }, [selectedVideo])

  useEffect(() => {
    ipcRenderer.on('spliced-point-video', () => {
      setNumSplicePointsCompleted((prev) => prev + 1)
    })

    ipcRenderer.on('spliced-video', () => {
      setIsSplicingVideo(false)
      setNumSplicePointsCompleted(0)
    })

    return () => {
      ipcRenderer.removeAllListeners('spliced-point-video')
    }
  }, [])

  const contextValue = useMemo(() => {
    return {
      selectedVideo,
      numSplicePointsCompleted,
      updateSelectedVideo,
      splicePoints,
      updateSplicePoints,
      isSplicingVideo,
      handleSpliceVideo,
    }
  }, [selectedVideo, numSplicePointsCompleted, updateSelectedVideo, splicePoints, updateSplicePoints, isSplicingVideo, handleSpliceVideo])

  return (
    <SpliceVideoContext.Provider value={contextValue}>
      {children}
    </SpliceVideoContext.Provider>
  )
}

export default SpliceVideoContext
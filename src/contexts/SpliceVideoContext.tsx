import { FC, createContext, useMemo, useState } from 'react' 

export interface SpliceVideoContextValue {
  selectedVideo: string
  updateSelectedVideo: (video: string) => void
  splicePoints: number[]
  updateSplicePoints: (splicePoints: number[]) => void
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

  const contextValue = useMemo(() => {
    return {
      selectedVideo,
      updateSelectedVideo,
      splicePoints,
      updateSplicePoints,
      isSplicingVideo,
      handleSpliceVideo,
    }
  }, [selectedVideo, updateSelectedVideo, splicePoints, updateSplicePoints, isSplicingVideo, handleSpliceVideo])

  return (
    <SpliceVideoContext.Provider value={contextValue}>
      {children}
    </SpliceVideoContext.Provider>
  )
}

export default SpliceVideoContext
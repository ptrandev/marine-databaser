import { FC, createContext, useMemo, useState } from 'react' 

export interface SpliceVideoContextValue {
  selectedVideo: string
  updateSelectedVideo: (video: string) => void
  isSplicingVideo: boolean
  handleSpliceVideo: () => void
}

const SpliceVideoContext = createContext<SpliceVideoContextValue>(undefined as any)

interface SpliceVideoProviderProps {
  children: React.ReactNode
}

export const SpliceVideoProvider: FC<SpliceVideoProviderProps> = ({ children }) => {
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [isSplicingVideo, setIsSplicingVideo] = useState<boolean>(false)
  
  const handleSpliceVideo = () => {
    setIsSplicingVideo(true)
  }

  const contextValue = useMemo(() => {
    return {
      selectedVideo,
      updateSelectedVideo: (video: string) => setSelectedVideo(video),
      isSplicingVideo,
      handleSpliceVideo,
    }
  }, [selectedVideo, isSplicingVideo])

  return (
    <SpliceVideoContext.Provider value={contextValue}>
      {children}
    </SpliceVideoContext.Provider>
  )
}

export default SpliceVideoContext
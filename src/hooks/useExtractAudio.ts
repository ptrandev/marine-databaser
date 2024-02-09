import { useContext } from 'react'
import ExtractAudioContext, { type ExtractAudioContextValue } from '../contexts/ExtractAudioContext'

const useExtractAudio = (): ExtractAudioContextValue => useContext(ExtractAudioContext)

export default useExtractAudio

import { useContext } from 'react'
import ExtractAudioContext, { type ExtractAudioContextValue } from '../contexts/ExtractAudioContext'

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'value' implicitly has an 'any' type.
const useExtractAudio = (): ExtractAudioContextValue => useContext(ExtractAudioContext)

export default useExtractAudio

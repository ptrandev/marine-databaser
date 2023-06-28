import { useContext } from 'react';
import ExtractAudioContext, { ExtractAudioContextValue } from '../contexts/ExtractAudioContext';

const useExtractAudio = (): ExtractAudioContextValue => useContext(ExtractAudioContext);

export default useExtractAudio;
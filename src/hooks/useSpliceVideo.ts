import { useContext } from 'react';
import SpliceVideoContext, { SpliceVideoContextValue } from '../contexts/SpliceVideoContext';

const useSpliceVideo = (): SpliceVideoContextValue => useContext(SpliceVideoContext);

export default useSpliceVideo;
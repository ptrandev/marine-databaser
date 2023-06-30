import { useContext } from 'react';
import SpliceVideoContext, { SpliceVideoContextValue } from '../contexts/SpliceVideo';

const useSpliceVideo = (): SpliceVideoContextValue => useContext(SpliceVideoContext);

export default useSpliceVideo;
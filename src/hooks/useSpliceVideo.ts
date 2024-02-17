import { useContext } from 'react'
import SpliceVideoContext, { type SpliceVideoContextValue } from '../contexts/SpliceVideoContext'

const useSpliceVideo = (): SpliceVideoContextValue => useContext(SpliceVideoContext)

export default useSpliceVideo

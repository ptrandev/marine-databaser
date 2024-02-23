import { useContext } from 'react'
import SpliceVideoContext, { type SpliceVideoContextValue } from '../contexts/SpliceVideoContext'

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'value' implicitly has an 'any' type.
const useSpliceVideo = (): SpliceVideoContextValue => useContext(SpliceVideoContext)

export default useSpliceVideo

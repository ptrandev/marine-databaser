import { useContext } from 'react'
import DirectoriesContext, { type DirectoriesContextValue } from '../contexts/DirectoriesContext'

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'value' implicitly has an 'any' type.
const useDirectories = (): DirectoriesContextValue => useContext(DirectoriesContext)

export default useDirectories

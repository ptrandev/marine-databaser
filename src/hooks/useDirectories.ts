import { useContext } from 'react'
import DirectoriesContext, { type DirectoriesContextValue } from '../contexts/DirectoriesContext'

const useDirectories = (): DirectoriesContextValue => useContext(DirectoriesContext)

export default useDirectories

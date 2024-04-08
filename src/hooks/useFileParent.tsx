import { useContext } from 'react'
import FileParentContext, { type FileParentContextValue } from '../contexts/FileParentContext'

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'value' implicitly has an 'any' type.
const useFileParent = (): FileParentContextValue => useContext(FileParentContext)

export default useFileParent

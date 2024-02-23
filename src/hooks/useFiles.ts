import { useContext } from 'react'
import FilesContext, { type FilesContextValue } from '../contexts/FilesContext'

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'value' implicitly has an 'any' type.
const useFiles = (): FilesContextValue => useContext(FilesContext)

export default useFiles

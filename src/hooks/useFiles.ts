import { useContext } from 'react'
import FilesContext, { type FilesContextValue } from '../contexts/FilesContext'

const useFiles = (): FilesContextValue => useContext(FilesContext)

export default useFiles

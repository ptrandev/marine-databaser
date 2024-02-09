import { useContext } from 'react'
import TagsContext, { type TagsContextValue } from '../contexts/TagsContext'

const useTags = (): TagsContextValue => useContext(TagsContext)

export default useTags

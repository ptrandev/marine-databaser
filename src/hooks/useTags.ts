import { useContext } from 'react'
import TagsContext, { type TagsContextValue } from '../contexts/TagsContext'

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'value' implicitly has an 'any' type.
const useTags = (): TagsContextValue => useContext(TagsContext)

export default useTags

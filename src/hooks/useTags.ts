import { useContext } from 'react';
import TagsContext, { TagsContextValue } from '../contexts/TagsContext';

const useTags = (): TagsContextValue => useContext(TagsContext);

export default useTags;
import { useContext } from 'react';
import DirectoriesContext, { DirectoriesContextValue } from '../contexts/DirectoriesContext';

const useDirectories = (): DirectoriesContextValue => useContext(DirectoriesContext);

export default useDirectories;
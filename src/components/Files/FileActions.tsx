import { Checkbox, Box } from '@mui/material'
import { FC } from 'react'

import useFiles from '@/hooks/useFiles'

const FileActions: FC = () => {
  const { selectedFiles, updateSelectedFiles, files } = useFiles()

  return (
    <Box ml={2}>
      <Checkbox
        checked={selectedFiles?.length === files?.length}
        indeterminate={selectedFiles?.length > 0 && selectedFiles?.length < files?.length}
        onChange={(e) => {
          e.stopPropagation()

          updateSelectedFiles(
            selectedFiles?.length === files?.length ?
              [] :
              files?.map(file => file.id)
          )
        }}
      />
    </Box>
  )
}

export default FileActions
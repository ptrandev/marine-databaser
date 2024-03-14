import { type FC } from 'react'
import { Box, Typography, Stack, Divider } from '@mui/material'
import Export from '@/components/ImportExport/Export'
import Import from '@/components/ImportExport/Import'

const ImportExport: FC = () => {
  return (
    <Box mb={2}>
      <Stack gap={2}>
        <Typography variant="h4">
          Import / Export
        </Typography>
        <Import/>
        <Divider />
        <Export />
      </Stack>
    </Box>
  )
}

export default ImportExport

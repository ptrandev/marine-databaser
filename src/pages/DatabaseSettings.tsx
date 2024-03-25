import { type FC } from 'react'
import { Box, Typography, Stack, Divider } from '@mui/material'
import Export from '@/components/DatabaseSettings/Export'
import Import from '@/components/DatabaseSettings/Import'
import ResetDatabase from '@/components/DatabaseSettings/ResetDatabase'

const DatabaseSettings: FC = () => {
  return (
    <Box mb={2}>
      <Stack gap={2}>
        <Typography variant="h4">
          Import / Export
        </Typography>
        <Import/>
        <Divider />
        <Export />
        <Divider />
        <ResetDatabase />
      </Stack>
    </Box>
  )
}

export default DatabaseSettings

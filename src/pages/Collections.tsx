import { Box, Button, Stack, Typography } from '@mui/material'
import { Add } from '@mui/icons-material'

const Collections = () => {
  return (
    <Box>
      <Stack flexWrap='wrap' direction='row' justifyContent='space-between' width='100%' mb={2} gap={2}>
        <Typography variant='h4' mr={2}>
          Collections
        </Typography>
        <Stack direction='row' alignItems='center' gap={2}>
          <Box>
            <Button
              color='primary'
              size='small'
            >
              Import Collection
            </Button>
          </Box>
          <Box>
            <Button variant='contained' color='primary' startIcon={<Add />}>
              New Collection
            </Button>
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}

export default Collections

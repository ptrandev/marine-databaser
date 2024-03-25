import type { FC } from 'react'
import { Typography, Box, Button, Stack } from '@mui/material'
import { NavLink } from 'react-router-dom'

const NotFound: FC = () => {
  return (
    <Stack alignItems='center' justifyContent='center' width='100%' height='100vh' flexDirection='column' gap={2} p={4}>
      <Stack alignItems='center'>
        <Typography variant='h3' textAlign='center'>
          Not Found
        </Typography>
        <Box maxWidth='500px'>
          <img src='src/assets/NotFound.png' alt='404 Not Found' width='100%' />
        </Box>
        <Typography variant='body1' textAlign='center'>
          The page you are looking for does not exist.
        </Typography>
      </Stack>
      <Button to='/' component={NavLink} variant='contained'>
        Go back to home
      </Button>
    </Stack>
  )
}

export default NotFound

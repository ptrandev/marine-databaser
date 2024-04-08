import Files from './pages/Files'
import Directories from './pages/Directories'
import Collections from './pages/Collections'
import ExtractAudio from './pages/ExtractAudio'
import SpliceVideo from './pages/SpliceVideo'
import DatabaseSettings from './pages/DatabaseSettings'
import NotFound from './pages/NotFound'

import Navbar from './components/Navbar'

import { createHashRouter, Outlet } from 'react-router-dom'
import { Box } from '@mui/system'

const NavbarWrapper = (): JSX.Element => {
  return (
    <Box>
      <Navbar />
      <Box pt={2} px={2}>
        <Outlet />
      </Box>
    </Box>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <NavbarWrapper />,
    children: [
      {
        path: '/',
        element: (
          <Files />
        )
      },
      {
        path: '/directories',
        element: (
          <Directories />
        )
      },
      {
        path: '/collections',
        element: (
          <Collections />
        )
      },
      {
        path: '/extract-audio',
        element: (
          <ExtractAudio />
        )
      },
      {
        path: '/splice-video',
        element: (
          <SpliceVideo />
        )
      },
      {
        path: '/database-settings',
        element: (
          <DatabaseSettings />
        )
      }
    ]
  },
  {
    path: '*',
    element: (
      <NotFound />
    )
  }
])

export default router

import Files from './pages/Files'
import Directories from './pages/Directories'
import Collections from './pages/Collections'
import ExtractAudio from './pages/ExtractAudio'
import SpliceVideo from './pages/SpliceVideo'
import ImportExport from './pages/ImportExport'

import Navbar from './components/Navbar'

import { createHashRouter, Outlet } from 'react-router-dom'
import { Box } from '@mui/system'

const NavbarWrapper = () => {
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
        path: '/import-export',
        element: (
          <ImportExport />
        )
      }
    ]
  }
])

export default router

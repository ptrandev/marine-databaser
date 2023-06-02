import Files from './pages/Files'
import Directories from './pages/Directories'
import Navbar from './components/Navbar'

import { createHashRouter, Outlet } from 'react-router-dom'
import { Box } from '@mui/system'

const NavbarWrapper = () => {
  return (
    <Box>
      <Navbar />
      <Box pt={2} px={4}>
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
        element: <Files />,
      },
      {
        path: '/directories',
        element: <Directories />,
      },
    ],
  },
])

export default router

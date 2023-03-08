import Home from './pages/Home'
import Directories from './pages/Directories'
import Navbar from './components/Navbar'

import { createHashRouter, Outlet } from 'react-router-dom'

const NavbarWrapper = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <NavbarWrapper />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/directories',
        element: <Directories />,
      },
    ],
  },
])

export default router

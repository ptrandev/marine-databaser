import Files from "./pages/Files";
import Directories from "./pages/Directories";
import ExtractAudio from "./pages/ExtractAudio";

import Navbar from "./components/Navbar";

import { createHashRouter, Outlet } from "react-router-dom";
import { Box } from "@mui/system";
import SpliceVideo from "./pages/SpliceVideo";

const NavbarWrapper = () => {
  return (
    <Box>
      <Navbar />
      <Box pt={2} px={2}>
        <Outlet />
      </Box>
    </Box>
  );
};

const router = createHashRouter([
  {
    path: "/",
    element: <NavbarWrapper />,
    children: [
      {
        path: "/",
        element: (
          <Files />
        ),
      },
      {
        path: "/directories",
        element: (
          <Directories />
        ),
      },
      {
        path: "/audio",
        element: (
          <ExtractAudio />
        ),
      },
      {
        path: '/video',
        element: (
          <SpliceVideo />
        )
      }
    ],
  },
]);

export default router;

import Files from "./pages/Files";
import Directories from "./pages/Directories";
import Navbar from "./components/Navbar";


import { createHashRouter, Outlet } from "react-router-dom";
import { Box } from "@mui/system";
import { FilesProvider } from "./contexts/FilesContext";
import { DirectoriesProvider } from "./contexts/DirectoriesContext";

const NavbarWrapper = () => {
  return (
    <Box>
      <Navbar />
      <Box pt={2} px={4}>
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
          <FilesProvider>
            <Files />
          </FilesProvider>
        ),
      },
      {
        path: "/directories",
        element: (
          <DirectoriesProvider>
            <Directories />
          </DirectoriesProvider>
        ),
      },
    ],
  },
]);

export default router;

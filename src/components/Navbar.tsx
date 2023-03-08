import { AppBar, Box, Button, Toolbar } from "@mui/material"
import { NavLink } from "react-router-dom"

const Navbar = () => {
  return (
    <AppBar position='sticky'>
      <Toolbar>
        <Button color='inherit' to='/' component={NavLink}>
          Files
        </Button>
        <Button color='inherit' to='/directories' component={NavLink}>
          Manage Directories
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
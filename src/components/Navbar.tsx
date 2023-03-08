import { Button } from "@mui/material"
import { NavLink } from "react-router-dom"

const Navbar = () => {
  return (
    <div>
      <Button to='/' component={NavLink}>
        Home
      </Button>
      <Button to='/directories' component={NavLink}>
        Manage Directories
      </Button>
    </div>
  )
}

export default Navbar
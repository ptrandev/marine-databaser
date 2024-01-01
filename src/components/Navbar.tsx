import { useState } from "react"
import { AppBar, Box, Button, Toolbar, Menu, MenuItem, IconButton } from "@mui/material"
import { NavLink } from "react-router-dom"
import { ipcRenderer } from 'electron'
import MenuIcon from '@mui/icons-material/Menu'

const LINKS = [
  {
    label: 'Files',
    to: '/'
  },
  {
    label: 'Directories',
    to: '/directories'
  },
  {
    label: 'Extract Audio',
    to: '/extract-audio'
  },
  {
    label: 'Splice Video',
    to: '/splice-video'
  }
]

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  return (
    <AppBar position='sticky'>
      <Toolbar>
        <Box display={{
          xs: 'block',
          sm: 'none'
        }}>
          <IconButton edge="start" color="inherit" aria-label="menu"
            onClick={(e) => {
              setAnchorEl(e.currentTarget)
            }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => {
              setAnchorEl(null)
            }}
          >
            {LINKS.map((link) => (
              <MenuItem
                key={link.to}
                onClick={() => {
                  setAnchorEl(null)
                }}
                to={link.to}
                component={NavLink}
              >
                {link.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
        <Box display={{
          xs: 'none',
          sm: 'block'
        }}>
          {LINKS.map((link) => (
            <Button
              key={link.to}
              color='inherit'
              to={link.to}
              component={NavLink}
            >
              {link.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
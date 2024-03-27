import { type FC } from 'react'
import { Box, IconButton, Dialog } from '@mui/material'
import { Close } from '@mui/icons-material'

export interface ModalProps {
  children: React.ReactNode
  open: boolean
  onClose: () => void
  disableClose?: boolean
}

export const Modal: FC<ModalProps> = ({ children, open, onClose, disableClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <Box
        position='relative'
        p={4}
      >
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }} disabled={disableClose}>
          <Close />
        </IconButton>
        {children}
      </Box>
    </Dialog>
  )
}

export default Modal

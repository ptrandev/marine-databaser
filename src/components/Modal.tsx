import { FC } from "react"
import { Modal as MUIModal, Box, Card, IconButton } from "@mui/material"
import { Close } from "@mui/icons-material"

export interface ModalProps {
  children: React.ReactNode
  open: boolean
  onClose: () => void
  disableClose?: boolean
}

export const Modal: FC<ModalProps> = ({ children, open, onClose, disableClose }) => {
  return (
    <MUIModal open={open} onClose={onClose}>
      <Box display='flex' width='100%' height='100%' justifyContent='center' alignItems='center' p={2}>
        <Card
          sx={{
            position: 'relative',
            maxWidth: 500,
            width: '100%',
            p: 4,
          }}
        >
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }} disabled={disableClose}>
            <Close />
          </IconButton>
          {children}
        </Card>
      </Box>
    </MUIModal>
  )
}

export default Modal
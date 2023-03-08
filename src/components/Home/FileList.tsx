import { Typography, Button } from "@mui/material"
const { ipcRenderer } = window.require('electron')

const FileList = ({ files }: { files: any }) => {
  return (
    <div>
      <Typography variant='h3'>
        File List
      </Typography>
      {
        files?.map((file: any) => (
          <Button
            key={file.dataValues.id}
            onClick={() => {
              ipcRenderer.send('open-file', file.dataValues.path)
            }}
            sx={{
              pointerEvents: 'pointer',
              gap: 1,
            }}
          >
            <Typography>
              {file.dataValues.name}
            </Typography>
            <Typography variant='caption'>
              {file.dataValues.path}
            </Typography>
          </Button>
        ))
      }
    </div>
  )
}

export default FileList
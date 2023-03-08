import { Typography } from "@mui/material"

const FileList = ({ files } : { files : any }) => {
  return (
    <div>
      <Typography variant='h3'>
        File List
      </Typography>
      {
        files?.map((file : any) => (
          <Typography key={file.dataValues.id}>
            {file.dataValues.name}
          </Typography>
        ))
      }
    </div>
  )
}

export default FileList
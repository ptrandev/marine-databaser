import { FC } from "react";
import { Box, Typography, Button } from "@mui/material";
import { FileDownload } from "@mui/icons-material";

const Import: FC = () => {
  return (
    <>
      <Box>
        <Typography variant="h6">
          Import Database
        </Typography>
        <Typography variant="body1">
          This will import a sqlite file into the database. This will not import any media files. This is useful in the case that you have a backup of your database and you want to restore it. This can also be used to transfer your database to another instance of this application. Importing a sqlite file will overwrite your current database. This cannot be undone. It is recommended that you backup your database before importing a sqlite file.
        </Typography>
      </Box>

      <Box>
        <Button variant="contained" startIcon={<FileDownload />}>
          Import
        </Button>
      </Box>
    </>
  )
}

export default Import;
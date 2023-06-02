import { Search } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import { FC } from "react";
import useFiles from "@/hooks/useFiles";

const FileSearch: FC= () => {
  const { searchTerm, updateSearchTerm } = useFiles()

  return (
    <div>
      <TextField
        placeholder='Search'
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search />
            </InputAdornment>
          )
        }}
        fullWidth
        value={searchTerm}
        onChange={e => updateSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default FileSearch;
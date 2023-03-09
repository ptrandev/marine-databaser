import { Search } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import { FC } from "react";

interface FileSearchProps {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
}

const FileSearch: FC<FileSearchProps> = ({ searchTerm, setSearchTerm }) => {
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
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default FileSearch;
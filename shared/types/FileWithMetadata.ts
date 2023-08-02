import { File, Tag, FileNote } from "../../electron/database/schemas"

export interface FileWithMetadata extends File {
  Tags: Tag[] 
  FileNotes: FileNote[]
};
import { File, Tag } from "../../electron/database/schemas"
export interface FileWithTags extends File {
  Tags: Tag[] 
};
import { type File, type Tag, type FileNote } from '../../electron/database/schemas'

export interface FileWithMetadata extends File {
  Tags: Tag[]
  FileNotes: FileNote[]
};

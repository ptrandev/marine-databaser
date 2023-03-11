import { File, Tag } from "../../electron/database/schemas"
export type FileWithTags = File & { Tags: Tag[] };
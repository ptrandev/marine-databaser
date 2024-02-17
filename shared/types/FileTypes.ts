export const FileTypes = [
  'image',
  'video',
  'audio',
  'document',
  'archive',
  'executable',
  'unknown'
] as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FileTypes = typeof FileTypes[number]

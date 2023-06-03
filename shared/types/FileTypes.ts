export const FileTypes = [
  'image',
  'video',
  'audio',
  'document',
  'archive',
  'executable',
  'unknown'
] as const

export type FileTypes = typeof FileTypes[number]
export const FileTypes = [
  'image',
  'video',
  'audio',
  'document',
  'archive',
  'executable',
  'other'
] as const

export type FileTypes = typeof FileTypes[number]
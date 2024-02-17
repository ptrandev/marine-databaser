import { type FileTypes } from './FileTypes'

export const MimeTypes: Record<FileTypes, string[]> = {
  image: ['image/'],
  video: ['video/'],
  audio: ['audio/'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'text/'
  ],
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/x-bzip',
    'application/x-bzip2',
    'application/x-gzip',
    'application/x-xz',
    'application/x-lzip',
    'application/x-lzma',
    'application/x-lzop',
    'application/x-snappy-framed',
    'application/xz',
    'application/x-gtar'
  ],
  executable: [
    'application/x-msdownload',
    'application/x-dosexec',
    'application/x-executable',
    'application/x-sharedlib',
    'application/x-shellscript',
    'application/x-pie-executable',
    'application/x-object',
    'application/x-archive',
    'application/x-mach-binary'
  ],
  unknown: ['false']
}

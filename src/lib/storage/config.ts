export interface StorageResult {
  path: string
  url: string
}

export interface StorageProvider {
  uploadFile(file: File, path: string, onProgress?: (pct: number) => void): Promise<StorageResult>
  deleteFile(path: string): Promise<void>
  getDownloadUrl(path: string): Promise<string>
  getPreviewUrl(path: string): Promise<string>
}

export const ALLOWED_EXTENSIONS = [
  'pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip',
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp4', 'mov', 'webm',
  'mp3', 'wav', 'm4a',
  'dwg', 'dxf', 'dwf', 'rvt', 'rfa', 'ifc', 'nwd', 'nwc', 'skp',
]

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm']
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a']
export const CAD_EXTENSIONS = ['dwg', 'dxf', 'dwf', 'rvt', 'rfa', 'ifc', 'nwd', 'nwc', 'skp']
export const DOCUMENT_EXTENSIONS = ['pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip']

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export function isExtensionAllowed(ext: string): boolean {
  return ALLOWED_EXTENSIONS.includes(ext.toLowerCase())
}

export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function isImage(ext: string): boolean {
  return IMAGE_EXTENSIONS.includes(ext.toLowerCase())
}

export function isVideo(ext: string): boolean {
  return VIDEO_EXTENSIONS.includes(ext.toLowerCase())
}

export function isAudio(ext: string): boolean {
  return AUDIO_EXTENSIONS.includes(ext.toLowerCase())
}

export function isCAD(ext: string): boolean {
  return CAD_EXTENSIONS.includes(ext.toLowerCase())
}

export function generateStoragePath(conversationId: string, filename: string): string {
  const ext = getExtension(filename)
  const uuid = crypto.randomUUID()
  return `${conversationId}/${uuid}.${ext}`
}

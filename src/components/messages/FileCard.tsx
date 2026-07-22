import { Download, FileText, Image as ImageIcon, Film, Music, FileArchive, FileSpreadsheet, File as FileIcon, FileCode } from 'lucide-react'
import type { ComponentType } from 'react'
import { formatFileSize } from '../../lib/formatDate'

interface FileCardProps {
  name: string
  size: number
  extension: string
  url?: string
}

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

const ICON_MAP: Record<string, { Icon: IconType; className: string }> = {
  jpg: { Icon: ImageIcon, className: 'text-ios-blue-light dark:text-ios-blue-dark' },
  jpeg: { Icon: ImageIcon, className: 'text-ios-blue-light dark:text-ios-blue-dark' },
  png: { Icon: ImageIcon, className: 'text-ios-blue-light dark:text-ios-blue-dark' },
  webp: { Icon: ImageIcon, className: 'text-ios-blue-light dark:text-ios-blue-dark' },
  gif: { Icon: ImageIcon, className: 'text-ios-blue-light dark:text-ios-blue-dark' },
  svg: { Icon: ImageIcon, className: 'text-ios-blue-light dark:text-ios-blue-dark' },
  mp4: { Icon: Film, className: 'text-ios-purple-light dark:text-ios-purple-dark' },
  mov: { Icon: Film, className: 'text-ios-purple-light dark:text-ios-purple-dark' },
  webm: { Icon: Film, className: 'text-ios-purple-light dark:text-ios-purple-dark' },
  mp3: { Icon: Music, className: 'text-ios-pink-light dark:text-ios-pink-dark' },
  wav: { Icon: Music, className: 'text-ios-pink-light dark:text-ios-pink-dark' },
  m4a: { Icon: Music, className: 'text-ios-pink-light dark:text-ios-pink-dark' },
  pdf: { Icon: FileText, className: 'text-ios-red-light dark:text-ios-red-dark' },
  xls: { Icon: FileSpreadsheet, className: 'text-ios-green-light dark:text-ios-green-dark' },
  xlsx: { Icon: FileSpreadsheet, className: 'text-ios-green-light dark:text-ios-green-dark' },
  csv: { Icon: FileSpreadsheet, className: 'text-ios-green-light dark:text-ios-green-dark' },
  doc: { Icon: FileText, className: 'text-ios-blue-light dark:text-ios-blue-dark' },
  docx: { Icon: FileText, className: 'text-ios-blue-light dark:text-ios-blue-dark' },
  ppt: { Icon: FileText, className: 'text-ios-orange-light dark:text-ios-orange-dark' },
  pptx: { Icon: FileText, className: 'text-ios-orange-light dark:text-ios-orange-dark' },
  txt: { Icon: FileText, className: 'text-ios-secondary_label-light dark:text-ios-secondary_label-dark' },
  zip: { Icon: FileArchive, className: 'text-ios-orange-light dark:text-ios-orange-dark' },
  rar: { Icon: FileArchive, className: 'text-ios-orange-light dark:text-ios-orange-dark' },
  '7z': { Icon: FileArchive, className: 'text-ios-orange-light dark:text-ios-orange-dark' },
  dwg: { Icon: FileCode, className: 'text-ios-indigo-light dark:text-ios-indigo-dark' },
  dxf: { Icon: FileCode, className: 'text-ios-indigo-light dark:text-ios-indigo-dark' },
  dwf: { Icon: FileCode, className: 'text-ios-indigo-light dark:text-ios-indigo-dark' },
  rvt: { Icon: FileCode, className: 'text-ios-indigo-light dark:text-ios-indigo-dark' },
  rfa: { Icon: FileCode, className: 'text-ios-indigo-light dark:text-ios-indigo-dark' },
  ifc: { Icon: FileCode, className: 'text-ios-indigo-light dark:text-ios-indigo-dark' },
  skp: { Icon: FileCode, className: 'text-ios-indigo-light dark:text-ios-indigo-dark' },
}

const EXT_COLORS: Record<string, string> = {
  pdf: 'bg-ios-red-light/15 text-ios-red-light dark:bg-ios-red-dark/20 dark:text-ios-red-dark',
  doc: 'bg-ios-blue-light/15 text-ios-blue-light dark:bg-ios-blue-dark/20 dark:text-ios-blue-dark',
  docx: 'bg-ios-blue-light/15 text-ios-blue-light dark:bg-ios-blue-dark/20 dark:text-ios-blue-dark',
  xls: 'bg-ios-green-light/15 text-ios-green-light dark:bg-ios-green-dark/20 dark:text-ios-green-dark',
  xlsx: 'bg-ios-green-light/15 text-ios-green-light dark:bg-ios-green-dark/20 dark:text-ios-green-dark',
  csv: 'bg-ios-green-light/15 text-ios-green-light dark:bg-ios-green-dark/20 dark:text-ios-green-dark',
  zip: 'bg-ios-orange-light/15 text-ios-orange-light dark:bg-ios-orange-dark/20 dark:text-ios-orange-dark',
  mp4: 'bg-ios-purple-light/15 text-ios-purple-light dark:bg-ios-purple-dark/20 dark:text-ios-purple-dark',
}

/**
 * iOS-style file attachment card.
 *  - Colored icon tile on the left (type-coded)
 *  - File name + size on the right
 *  - Trailing download button
 */
export default function FileCard({ name, size, extension, url }: FileCardProps) {
  const ext = extension.toLowerCase()
  const { Icon } = ICON_MAP[ext] ?? { Icon: FileIcon }
  const colorClass = EXT_COLORS[ext] ?? 'bg-ios-fill-light text-ios-secondary_label-light dark:bg-ios-fill-dark dark:text-ios-secondary_label-dark'

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ios-press flex w-[260px] items-center gap-2.5 rounded-[14px] bg-ios-bubble-light/70 p-2.5 active:bg-ios-bubble-light dark:bg-ios-bubble-dark/60 dark:active:bg-ios-bubble-dark/80"
      aria-label={`Open ${name}`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${colorClass}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ios-label-light dark:text-ios-label-dark">
          {name}
        </p>
        <p className="text-[11px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
          {formatFileSize(size)} · {ext.toUpperCase()}
        </p>
      </div>
      {url && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ios-blue-light active:bg-ios-blue-light/15 dark:text-ios-blue-dark">
          <Download className="h-4 w-4" strokeWidth={2.2} />
        </span>
      )}
    </a>
  )
}

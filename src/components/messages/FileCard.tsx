import { useState } from 'react'
import { FileText, Download, X, File as FileIcon } from 'lucide-react'
import { formatFileSize } from '../../lib/formatDate'

interface FileCardProps {
  name: string
  size: number
  extension: string
  url?: string
  onDownload?: () => void
}

const extensionIcons: Record<string, string> = {
  pdf: '📄', xls: '📊', xlsx: '📊', csv: '📋',
  doc: '📝', docx: '📝', ppt: '📽️', pptx: '📽️',
  txt: '📃', zip: '📦',
  dwg: '📐', dxf: '📐', dwf: '📐', rvt: '🏗️', rfa: '🏗️',
  ifc: '🏗️', nwd: '🏗️', nwc: '🏗️', skp: '🏗️',
}

export default function FileCard({ name, size, extension, url, onDownload }: FileCardProps) {
  const icon = extensionIcons[extension] ?? '📎'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(size)}</p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

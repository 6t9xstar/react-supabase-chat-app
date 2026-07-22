import { ExternalLink, Lock, Shield } from 'lucide-react'

interface FileKiwiCardProps {
  folderUrl: string
  folderId: string
}

/**
 * iOS-style card for file.kiwi (E2E encrypted) file-share links.
 * Blue accent, lock icon, bold folder ID.
 */
export default function FileKiwiCard({ folderUrl, folderId }: FileKiwiCardProps) {
  return (
    <a
      href={folderUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="ios-press flex w-[260px] items-center gap-3 rounded-[14px] bg-ios-blue-light/12 p-3 active:bg-ios-blue-light/20 dark:bg-ios-blue-dark/20 dark:active:bg-ios-blue-dark/30"
      aria-label="Open file.kiwi folder"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ios-blue-light text-white dark:bg-ios-blue-dark">
        <Shield className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ios-blue-light dark:text-ios-blue-dark">
          file.kiwi
        </p>
        <div className="flex items-center gap-1 text-[11px] text-ios-blue-light/80 dark:text-ios-blue-dark/80">
          <Lock className="h-3 w-3" strokeWidth={2.5} />
          <span className="truncate">E2E encrypted · {folderId}</span>
        </div>
      </div>
      <ExternalLink
        className="h-4 w-4 shrink-0 text-ios-blue-light dark:text-ios-blue-dark"
        strokeWidth={2.5}
      />
    </a>
  )
}

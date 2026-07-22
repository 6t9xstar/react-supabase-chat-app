import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ImagePreviewProps {
  src: string
  alt: string
}

/**
 * iOS Messages-style image attachment.
 *  - Tappable thumbnail that opens a fullscreen viewer
 *  - Fullscreen viewer has tap-to-dismiss on backdrop, native close button
 */
export default function ImagePreview({ src, alt }: ImagePreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!expanded) return
    closeBtnRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [expanded])

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="block max-w-xs overflow-hidden rounded-[12px] active:opacity-90"
        aria-label={`Expand image: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-64 w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 animate-ios-fade"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpanded(false)}
        >
          <button
            ref={closeBtnRef}
            onClick={() => setExpanded(false)}
            aria-label="Close image"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/30"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-ios-lg object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  )
}

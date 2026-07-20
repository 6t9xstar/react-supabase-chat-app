import { useState } from 'react'
import { X, Expand } from 'lucide-react'

interface ImagePreviewProps {
  src: string
  alt: string
}

export default function ImagePreview({ src, alt }: ImagePreviewProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <div className="group relative inline-block max-w-sm cursor-pointer overflow-hidden rounded-lg">
        <img
          src={src}
          alt={alt}
          className="max-h-64 w-full object-cover transition group-hover:opacity-90"
          onClick={() => setExpanded(true)}
          loading="lazy"
        />
        <button
          onClick={() => setExpanded(true)}
          className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute right-4 top-4 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

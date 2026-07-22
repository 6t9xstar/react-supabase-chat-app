import { useEffect, useRef, useState } from 'react'
import { X, Reply } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { isImage } from '../../lib/storage/config'
import type { Message } from '../../types/database'

interface ReplyPreviewProps {
  message: Message
  onCancel: () => void
}

/**
 * iOS-style reply preview above the composer.
 * Sender name on top, content (or attachment label) below, close X on the right.
 */
export default function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const senderName = message.sender?.full_name ?? 'Someone'
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  useEffect(() => {
    if (!message.id) return
    let cancelled = false
    supabase
      .from('attachments')
      .select('storage_path, extension')
      .eq('message_id', message.id)
      .then(async ({ data }) => {
        if (!data?.length || cancelled) return
        const imgAtt = data.find((a) => isImage(a.extension))
        if (!imgAtt) return
        const { data: signed } = await supabase.storage
          .from('attachments')
          .createSignedUrls([imgAtt.storage_path], 3600)
        if (signed?.[0]?.signedUrl && !cancelled) setThumbUrl(signed[0].signedUrl as string)
      })
    return () => {
      cancelled = true
    }
  }, [message.id])

  return (
    <div
      ref={ref}
      className="flex items-center gap-2.5 border-t border-ios-separator-light bg-ios-grouped-light px-3 pb-1.5 pt-2 dark:border-ios-separator-dark dark:bg-ios-grouped-dark"
    >
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-[8px] object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-ios-fill-light dark:bg-ios-fill-dark">
          <Reply
            className="h-4 w-4 text-ios-blue-light dark:text-ios-blue-dark"
            strokeWidth={2.2}
          />
        </div>
      )}
      <div className="min-w-0 flex-1 border-l-2 border-ios-blue-light pl-2.5 dark:border-ios-blue-dark">
        <p className="truncate text-[12px] font-semibold text-ios-blue-light dark:text-ios-blue-dark">
          Replying to {senderName}
        </p>
        <p className="truncate text-[12px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
          {message.deleted_at
            ? 'Message deleted'
            : message.content || (thumbUrl ? 'Photo' : message.attachments?.length ? 'Attachment' : '…')}
        </p>
      </div>
      <button
        onClick={onCancel}
        aria-label="Cancel reply"
        className="ios-press flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ios-secondary_label-light active:bg-ios-fill-light dark:text-ios-secondary_label-dark dark:active:bg-ios-fill-dark"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}

import { MessageCircle, Edit } from 'lucide-react'

interface EmptyStateProps {
  onStartChat?: () => void
}

/**
 * iOS Messages-style empty state.
 * Big icon, friendly headline, hint to start a new chat.
 */
export default function EmptyState({ onStartChat }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center bg-ios-grouped-light px-6 text-center dark:bg-ios-grouped-dark">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-ios-blue-light/20 to-ios-blue-light/5 dark:from-ios-blue-dark/30 dark:to-ios-blue-dark/10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-ios-blue-light to-ios-blue-light/70 shadow-ios dark:from-ios-blue-dark dark:to-ios-blue-dark/70">
          <MessageCircle className="h-8 w-8 text-white" strokeWidth={2} />
        </div>
      </div>
      <h2 className="text-[22px] font-semibold tracking-tight text-ios-label-light dark:text-ios-label-dark">
        Welcome to Apex Chat
      </h2>
      <p className="mt-2 max-w-[280px] text-[15px] leading-snug text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
        Select a conversation from the list, or start a new one to begin messaging your team.
      </p>
      {onStartChat && (
        <button
          onClick={onStartChat}
          className="ios-press mt-6 inline-flex h-10 items-center gap-2 rounded-ios bg-ios-blue-light px-5 text-[15px] font-medium text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark"
        >
          <Edit className="h-4 w-4" strokeWidth={2.5} />
          New Message
        </button>
      )}
    </div>
  )
}

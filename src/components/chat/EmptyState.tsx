import { MessageCircle } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
          <MessageCircle className="h-10 w-10 text-brand-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Welcome to Apex Chat</h2>
        <p className="mt-2 text-sm text-gray-500">
          Select a conversation from the sidebar or start a new one
        </p>
      </div>
    </div>
  )
}

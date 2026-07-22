interface SkeletonProps {
  className?: string
}

/**
 * iOS-style skeleton: a soft pill shimmer, not a harsh block.
 */
export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-ios-sm bg-ios-fill-light dark:bg-ios-fill-dark ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          animation: 'skeleton-shimmer 1.4s infinite',
        }}
      />
      <style>{`@keyframes skeleton-shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex flex-col gap-1.5 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
            {i === 1 && <Skeleton className="h-3 w-16" />}
            <Skeleton
              className={`h-9 ${i % 2 === 0 ? 'w-56' : 'w-40'} rounded-[20px]`}
            />
            {i === 3 && <Skeleton className="h-9 w-32 rounded-[20px]" />}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ConversationSkeleton() {
  return (
    <div className="px-3 py-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-3">
          <Skeleton className="h-12 w-12 rounded-[12px]" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      ))}
    </div>
  )
}

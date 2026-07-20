interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
}

const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }
const dotMap = { sm: 'h-2.5 w-2.5', md: 'h-3 w-3', lg: 'h-3.5 w-3.5' }

export default function Avatar({ src, name, size = 'md', online }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div class={`relative inline-flex shrink-0 ${sizeMap[size]}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          class="rounded-full object-cover"
        />
      ) : (
        <div class="flex h-full w-full items-center justify-center rounded-full bg-brand-500 font-medium text-white">
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          class={`absolute bottom-0 right-0 rounded-full border-2 border-white ${
            online ? 'bg-green-500' : 'bg-gray-400'
          } ${dotMap[size]}`}
        />
      )}
    </div>
  )
}

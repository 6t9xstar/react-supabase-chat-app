import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'

const CATEGORIES = [
  {
    name: 'Smileys',
    emojis: [
      '😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕',
    ],
  },
  {
    name: 'Gestures',
    emojis: [
      '👋','🤚','✋','🖐','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💪',
    ],
  },
  {
    name: 'Hearts',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💑','💏',
    ],
  },
  {
    name: 'Animals',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐢','🐍','🦎','🐙','🦑','🦐','🦀','🐠','🐬','🐳','🐋','🦈',
    ],
  },
  {
    name: 'Food',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥕','🌽','🍞','🥐','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🌮','🌯','🥗','🍝','🍜','🍲','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🍥','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','☕','🍵','🥤','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🍾',
    ],
  },
  {
    name: 'Travel',
    emojis: [
      '🌍','🌎','🌏','🌐','🗺️','🧭','🏔️','⛰️','🌋','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🏠','🏡','🏢','🏣','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','⛲','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','🗾',
    ],
  },
  {
    name: 'Objects',
    emojis: [
      '⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💽','💾','💿','📀','📷','📸','📹','🎥','📞','☎️','📺','📻','🎙️','⏰','🕰️','⌛','⏳','🔋','🔌','💡','🔦','🕯️','💸','💵','💴','💶','💷','💰','💳','💎','⚖️','🔧','🔨','⚒️','🛠️','⛏️','🔩','⚙️','🧰','🧲','🔫','💣','🔪','📜','📃','📄','📑','📊','📈','📉','📆','📅','📇','📋','📁','📂','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','📌','📍','✂️','📝','🔍','🔎','🔏','🔐','🔒','🔓',
    ],
  },
  {
    name: 'Symbols',
    emojis: [
      '❤️','🔥','✨','⭐','🎉','🎊','💯','✅','❌','❓','❗','💢','💤','💬','💭','🗯️','♻️','⚠️','🚫','🔞','📵','🚭','❕','❔','‼️','⁉️','💹','💠','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤',
    ],
  },
]

const ALL_EMOJIS = CATEGORIES.flatMap((c) => c.emojis)

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

/**
 * iOS-style emoji picker.
 *  - Compact, rounded card
 *  - Top: search field
 *  - Category tabs (round buttons with first emoji as icon)
 *  - Grid of emojis
 */
export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(0)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const filtered = search.trim()
    ? ALL_EMOJIS.filter((e) => e.includes(search))
    : CATEGORIES[activeCategory].emojis

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-ios-lg bg-ios-bg-light shadow-ios-lg dark:bg-ios-secondary-dark animate-ios-pop"
      role="dialog"
      aria-label="Emoji picker"
    >
      <div className="border-b border-ios-separator-light p-2 dark:border-ios-separator-dark">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ios-secondary_label-light dark:text-ios-secondary_label-dark"
            strokeWidth={2.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji"
            className="h-8 w-full rounded-[8px] bg-ios-fill-light pl-8 pr-3 text-[14px] text-ios-label-light placeholder:text-ios-secondary_label-light focus:outline-none focus:ring-2 focus:ring-ios-blue-light/30 dark:bg-ios-fill-dark dark:text-ios-label-dark dark:placeholder:text-ios-secondary_label-dark"
            aria-label="Search emoji"
          />
        </div>
      </div>

      {!search.trim() && (
        <div className="flex gap-0.5 overflow-x-auto border-b border-ios-separator-light px-2 py-1.5 scrollbar-thin dark:border-ios-separator-dark">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[16px] transition-colors ${
                i === activeCategory
                  ? 'bg-ios-blue-light/15 dark:bg-ios-blue-dark/25'
                  : 'active:bg-ios-fill-light dark:active:bg-ios-fill-dark'
              }`}
              aria-label={cat.name}
              title={cat.name}
            >
              {cat.emojis[0]}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-8 gap-0.5 p-1.5 max-h-56 overflow-y-auto scrollbar-thin">
        {filtered.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji)
              onClose()
            }}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[20px] active:bg-ios-fill-light dark:active:bg-ios-fill-dark"
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

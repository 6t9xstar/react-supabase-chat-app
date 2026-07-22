import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  theme: 'dark' | 'light'
  onToggle: () => void
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="ios-press flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-ios-secondary_label-light hover:bg-ios-fill-light dark:text-ios-secondary_label-dark dark:hover:bg-ios-fill-dark"
      title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" strokeWidth={2.25} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={2.25} />}
    </button>
  )
}

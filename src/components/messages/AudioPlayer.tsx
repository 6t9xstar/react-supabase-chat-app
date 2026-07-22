import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  name: string
}

/**
 * iOS Messages-style voice/audio attachment.
 *  - Pill-shaped, tappable play/pause button on the left
 *  - Thin progress bar with brand-color fill
 *  - Time labels on each side of the bar
 */
export default function AudioPlayer({ src, name }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [seeking, setSeeking] = useState(false)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play()
    setPlaying(!playing)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const getPercent = () => (duration ? (currentTime / duration) * 100 : 0)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || !progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    audioRef.current.currentTime = pct * duration
    setCurrentTime(pct * duration)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setSeeking(true)
    handleSeek(e)
  }

  useEffect(() => {
    if (!seeking) return
    const handleMove = (e: MouseEvent) => {
      if (!audioRef.current || !duration || !progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = Math.max(0, Math.min(1, x / rect.width))
      audioRef.current.currentTime = pct * duration
      setCurrentTime(pct * duration)
    }
    const handleUp = () => setSeeking(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [seeking, duration])

  return (
    <div className="flex w-[260px] items-center gap-2.5 rounded-[16px] bg-ios-bubble-light/70 px-2.5 py-2 dark:bg-ios-bubble-dark/60">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onTimeUpdate={() => {
          if (!seeking) setCurrentTime(audioRef.current?.currentTime ?? 0)
        }}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="ios-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ios-blue-light text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark"
        aria-label={playing ? 'Pause audio' : 'Play audio'}
      >
        {playing ? (
          <Pause className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          <Play className="h-4 w-4 ml-0.5" strokeWidth={2.5} />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className="truncate text-[12px] font-medium text-ios-label-light dark:text-ios-label-dark"
          title={name}
        >
          {name}
        </p>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] tabular-nums text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            className="relative h-1 flex-1 cursor-pointer rounded-full bg-ios-fill-light dark:bg-ios-fill-dark"
            onMouseDown={handleMouseDown}
            role="slider"
            aria-label="Audio progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(getPercent())}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-ios-blue-light dark:bg-ios-blue-dark"
              style={{ width: `${getPercent()}%`, transition: seeking ? 'none' : 'width 0.08s linear' }}
            />
            <div
              className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-black/10 dark:bg-white"
              style={{
                left: `calc(${getPercent()}% - 5px)`,
                opacity: seeking ? 1 : 0,
                transition: seeking ? 'none' : 'opacity 0.2s',
              }}
            />
          </div>
          <span className="shrink-0 text-[10px] tabular-nums text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}

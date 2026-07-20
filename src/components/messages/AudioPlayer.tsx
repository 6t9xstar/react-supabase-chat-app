import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  name: string
}

export default function AudioPlayer({ src, name }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={togglePlay}
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-400"
      >
        {playing ? <Pause class="h-4 w-4" /> : <Play class="h-4 w-4 ml-0.5" />}
      </button>
      <div class="flex-1 min-w-0">
        <p class="truncate text-sm font-medium text-gray-900">{name}</p>
        <div class="mt-1 h-1.5 w-full rounded-full bg-gray-200">
          <div
            class="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div class="mt-0.5 flex justify-between text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}

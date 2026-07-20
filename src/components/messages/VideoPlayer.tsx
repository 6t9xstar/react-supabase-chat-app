interface VideoPlayerProps {
  src: string
  name: string
}

export default function VideoPlayer({ src, name }: VideoPlayerProps) {
  return (
    <div className="max-w-md overflow-hidden rounded-lg">
      <video
        src={src}
        controls
        className="w-full"
        preload="metadata"
      >
        <p className="text-sm text-gray-500">Your browser does not support video playback.</p>
      </video>
    </div>
  )
}

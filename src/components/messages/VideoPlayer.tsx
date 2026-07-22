interface VideoPlayerProps {
  src: string
  name: string
}

/**
 * iOS Messages-style video attachment.
 * Native HTML5 video with rounded corners.
 */
export default function VideoPlayer({ src, name }: VideoPlayerProps) {
  return (
    <div className="max-w-sm overflow-hidden rounded-[12px]">
      <video
        src={src}
        controls
        playsInline
        className="w-full"
        preload="metadata"
        aria-label={name || 'Video player'}
      >
        <p className="bg-ios-fill-light p-3 text-[13px] text-ios-secondary_label-light dark:bg-ios-fill-dark dark:text-ios-secondary_label-dark">
          Your browser does not support video playback.
        </p>
      </video>
    </div>
  )
}

// src/features/explore/vdrop/FullscreenVideo.jsx
import { forwardRef, useCallback } from 'react';

const FullscreenVideo = forwardRef(function FullscreenVideo(
  {
    src,
    isMuted = true,
    autoPlay = true,
    loop = true,
    poster,
    objectFit = 'cover', // 'cover' | 'contain'
    className = '',
    onToggleMute,        // optional callback(newMuted)
    ...videoProps        // pass-through (onTimeUpdate, onEnded, etc.)
  },
  ref
) {
  // keep Tailwind classes explicit so they aren't purged
  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  // Try to play again once we can, ignore blocked autoplay errors
  const handleCanPlay = useCallback((e) => {
    const v = e.currentTarget;
    const p = v.play?.();
    if (p?.catch) p.catch(() => {});
  }, []);

  // Tap to toggle mute (handy on mobile)
  const handleToggleMute = useCallback(() => {
    const v = ref && 'current' in ref ? ref.current : null;
    if (!v) return;
    v.muted = !v.muted;
    onToggleMute?.(v.muted);
  }, [ref, onToggleMute]);

  return (
    <div className={`relative w-[100vw] h-[100dvh] bg-black overflow-hidden ${className}`}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted={isMuted}
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        className={`absolute inset-0 w-full h-full ${fitClass}`}
        onCanPlay={handleCanPlay}
        onClick={handleToggleMute}
        onKeyDown={(e) => ((e.key === 'Enter' || e.key === ' ') && handleToggleMute())}
        role="button"
        tabIndex={0}
        aria-label="Video player"
        onContextMenu={(e) => e.preventDefault()}
        {...videoProps}
      />
    </div>
  );
});

export default FullscreenVideo;

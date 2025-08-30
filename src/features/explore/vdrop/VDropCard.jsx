// src/features/explore/vdrop/VDropCard.jsx
import { useRef, useEffect } from 'react';
import FullscreenVideo from './FullscreenVideo';
import VDropActions from './components/VDropActions';
import UserLink from '@/components/UserLink';

export default function VDropCard({ video, isActive, muted = true }) {
  const videoRef = useRef(null);

  // Keep playback state in sync with "isActive" and "muted"
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // ensure mute state first (mobile autoplay requires muted)
    el.muted = !!muted;

    if (isActive) {
      // play may reject on some browsers; ignore
      const p = el.play?.();
      if (p?.catch) p.catch(() => {});
    } else {
      try { el.pause?.(); } catch {}
    }
  }, [isActive, muted]);

  const authorType = video.source === 'vport_posts' ? 'vport' : 'user';
  const authorObj = authorType === 'vport' ? video.author_vport : video.author_user;

  return (
    <div className="relative w-full h-[100dvh] snap-start bg-black overflow-hidden">
      {/* Background Video (reuses hardened player) */}
      <FullscreenVideo
        ref={videoRef}
        src={video.media_url}
        poster={video.poster_url /* optional thumbnail if you have it */}
        isMuted={muted}
        autoPlay // we still guard with effect above
        loop
        objectFit="cover"
        className="" // extra wrapper classes if you need
        // prevent long-press save context menu is already handled inside
      />

      {/* Top Left: Author */}
      <div className="absolute top-4 left-4 z-10">
        <UserLink
          user={authorObj}
          authorType={authorType}
          avatarSize="w-10 h-10"
          textSize="text-sm"
        />
      </div>

      {/* Bottom Left: Caption */}
      {video.title ? (
        <div className="absolute bottom-24 left-4 z-10 max-w-[65%] text-white space-y-1">
          <div className="text-sm leading-snug opacity-90">{video.title}</div>
        </div>
      ) : null}

      {/* Bottom Right: Actions */}
      <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-4 text-white">
        <VDropActions
          postId={video.id}
          mediaUrl={video.media_url}
          title={video.title}
          source={video.source} // 'posts' | 'vport_posts'
        />
      </div>
    </div>
  );
}

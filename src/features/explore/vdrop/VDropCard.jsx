// src/features/explore/vdrop/VDropCard.jsx
import { useRef, useEffect } from 'react';
import VDropActions from './components/VDropActions';
import UserLink from '@/components/UserLink';

export default function VDropCard({ video, isActive, muted }) {
  const videoRef = useRef(null);

  // prefer new alias `author`, fallback to legacy `profiles`
  const author =
    video?.author ||
    video?.profiles || // legacy
    {
      id: video?.user_id,
      display_name: '',
      username: '',
      photo_url: '/avatar.jpg',
    };

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.muted = Boolean(muted);
    if (isActive) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isActive, muted]);

  return (
    <div className="relative w-full h-[100dvh] snap-start bg-black overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        src={video.media_url}
        autoPlay
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* Top Left: User info */}
      <div className="absolute top-4 left-4 z-10">
        <UserLink user={author} avatarSize="w-10 h-10" textSize="text-sm" />
      </div>

      {/* Bottom Left: Caption */}
      <div className="absolute bottom-24 left-4 z-10 max-w-[65%] text-white space-y-1">
        {video?.title ? (
          <div className="text-sm leading-snug opacity-90">{video.title}</div>
        ) : null}
      </div>

      {/* Bottom Right: Reactions + Share */}
      <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-4 text-white">
        <VDropActions postId={video.id} mediaUrl={video.media_url} title={video.title} />
      </div>
    </div>
  );
}

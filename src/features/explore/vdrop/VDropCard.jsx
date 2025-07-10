// src/features/explore/vdrop/VDropCard.jsx
import { useRef, useEffect } from 'react';
import VDropActions from './components/VDropActions';

export default function VDropCard({ video, isActive }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <div className="relative h-screen snap-start bg-black overflow-hidden">
      {/* Fullscreen Video with border for testing */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover border-4 border-white/10"
        src={video.media_url}
        muted
        playsInline
        loop
      />

      {/* Overlay: info at bottom-left */}
      <div className="absolute bottom-20 left-4 text-white z-10 max-w-[70%] bg-black/50 p-2 rounded-lg">
        <div className="font-bold text-lg">{video.profiles?.display_name || 'Unknown'}</div>
        <div className="text-sm opacity-80">{video.title}</div>
      </div>

      {/* Overlay: reactions at bottom-right */}
      <div className="absolute bottom-20 right-4 z-10 flex flex-col items-center gap-4 text-white bg-black/40 p-2 rounded-lg">
        <VDropActions postId={video.id} />
      </div>
    </div>
  );
}

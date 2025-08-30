import React, { useRef, useEffect } from 'react';
import { db } from '@/data/data'; // ← use centralized data layer

const StoryItem = ({ story, isMuted, onMuteToggle, isActive }) => {
  const { media_url, media_type, caption, id: storyId } = story;
  const videoRef = useRef(null);
  const hasLogged = useRef(false);
  const resetTimeout = useRef(null);

  useEffect(() => {
    if (!isActive || !storyId) return;

    // Log a view at most once per 15s while active
    const logOnce = async () => {
      if (hasLogged.current) return;
      try {
        await db.stories.logView(storyId);
        hasLogged.current = true;
        resetTimeout.current = setTimeout(() => {
          hasLogged.current = false;
        }, 15000);
      } catch (e) {
        // swallow: view logging should never break playback
        console.warn('View logging failed:', e?.message || e);
      }
    };

    logOnce();

    let onTimeUpdate = null;

    const v = videoRef.current;
    if (media_type === 'video' && v) {
      // ensure mute state reflects prop
      v.muted = isMuted;
      // restart from beginning when becoming active
      v.currentTime = 0;

      v.play().catch((err) => console.warn('🎥 Video play error:', err));

      // enforce 15s cap (stories-style)
      onTimeUpdate = () => {
        if (v.currentTime >= 15) v.pause();
      };
      v.addEventListener('timeupdate', onTimeUpdate);
    }

    // single unified cleanup
    return () => {
      if (onTimeUpdate && videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', onTimeUpdate);
      }
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch {}
      }
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
        resetTimeout.current = null;
      }
    };
  }, [isMuted, isActive, storyId, media_type]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white relative">
      <div className="w-full h-full relative overflow-hidden">
        {media_type === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={media_url}
              autoPlay
              playsInline
              loop={false}
              muted={isMuted}
              className="w-full h-full object-contain"
            />
            <button
              onClick={onMuteToggle}
              className="absolute top-4 left-4 z-50 bg-black bg-opacity-70 rounded-full px-3 py-1 text-white text-lg shadow-md"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </>
        ) : (
          <img
            src={media_url}
            alt="story"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {caption && (
        <div className="absolute bottom-8 w-full text-center px-4">
          <p className="text-sm text-zinc-300">{caption}</p>
        </div>
      )}
    </div>
  );
};

export default StoryItem;

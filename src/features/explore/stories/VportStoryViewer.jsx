// src/features/explore/stories/components/VportStoryItem.jsx
import React, { useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { db } from '@/data/data';

export default function VportStoryItem({ story, isMuted, onMuteToggle, isActive }) {
  const { id: storyId, media_url, media_type, caption } = story || {};
  const videoRef = useRef(null);

  // throttle view logging so we don't spam on quick replays
  const hasLoggedRef = useRef(false);
  const resetTimerRef = useRef(null);

  // dev-only guard to avoid React 18 StrictMode double invocation
  const devOnceRef = useRef(false);

  // VPORT-ONLY: log a view when active (single call-site)
  useEffect(() => {
    let cancelled = false;

    const logView = async () => {
      try {
        if (import.meta.env?.DEV) {
          if (devOnceRef.current) return; // skip StrictMode 2nd run
          devOnceRef.current = true;
        }

        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id;
        if (!userId || !storyId) return;

        await db.stories.logVportStoryView({ storyId, userId });

        if (!cancelled) {
          hasLoggedRef.current = true;
          // allow re-logging after 15s (matches story length)
          resetTimerRef.current = setTimeout(() => {
            hasLoggedRef.current = false;
            if (import.meta.env?.DEV) devOnceRef.current = false; // allow again after window
          }, 15000);
        }
      } catch (e) {
        if (import.meta.env?.DEV) console.warn('[VportStoryItem] view log failed:', e?.message || e);
      }
    };

    if (isActive && storyId && !hasLoggedRef.current) {
      logView();
    }

    return () => {
      cancelled = true;
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, [isActive, storyId]);

  // playback + 15s cap
  useEffect(() => {
    const video = videoRef.current;
    if (!isActive || media_type !== 'video' || !video) return;

    video.muted = isMuted;
    try {
      video.currentTime = 0;
      video.play().catch(() => {}); // ignore autoplay block
    } catch {}

    const onTimeUpdate = () => {
      if (video.currentTime >= 15) video.pause();
    };
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      try { video.pause(); } catch {}
    };
  }, [isMuted, isActive, media_type]);

  // pause immediately when deactivated
  useEffect(() => {
    if (!isActive && videoRef.current) {
      try { videoRef.current.pause(); } catch {}
    }
  }, [isActive]);

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
              className="absolute top-4 left-4 z-50 bg-black/70 rounded-full px-3 py-1 text-white text-lg shadow-md"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </>
        ) : (
          <img src={media_url} alt="story" className="w-full h-full object-contain" />
        )}
      </div>

      {caption && (
        <div className="absolute bottom-8 w-full text-center px-4">
          <p className="text-sm text-zinc-300">{caption}</p>
        </div>
      )}
    </div>
  );
}

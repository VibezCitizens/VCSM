import React, { useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const StoryItem = ({ story, isMuted, onMuteToggle, isActive }) => {
  const { media_url, media_type, caption, id: storyId } = story;
  const videoRef = useRef(null);
  const hasLogged = useRef(false); // 👁️ avoid multiple inserts per mount
  const resetTimeout = useRef(null); // for clearing timeout on unmount

  // 👁️ Log view event + insert into story_views
  const logStoryView = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;
      const userId = user.id;

      // Log view event (always)
      await supabase.from('story_view_events').insert({
        user_id: userId,
        story_id: storyId,
      });

      // Insert unique view (idempotent RPC)
      await supabase.rpc('insert_unique_story_view', {
        uid: userId,
        sid: storyId,
      });

      console.log('👁️ View logged:', storyId);
    } catch (err) {
      console.warn('View logging failed:', err.message);
    }
  };

  useEffect(() => {
    if (!isActive || !storyId) return;

    if (!hasLogged.current) {
      logStoryView();
      hasLogged.current = true;

      // 🔁 Allow re-logging after 15s (for looped story or replay)
      resetTimeout.current = setTimeout(() => {
        hasLogged.current = false;
      }, 15000);
    }

    const video = videoRef.current;

    if (media_type === 'video' && video) {
      video.muted = isMuted;
      video.currentTime = 0;

      video.play().catch((err) =>
        console.warn('🎥 Video play error:', err)
      );

      const onTimeUpdate = () => {
        if (video.currentTime >= 15) {
          video.pause();
        }
      };

      video.addEventListener('timeupdate', onTimeUpdate);

      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate);
      };
    }

    return () => {
      if (videoRef.current) videoRef.current.pause();
      if (resetTimeout.current) clearTimeout(resetTimeout.current); // ⛔ clean up
    };
  }, [isMuted, isActive, storyId]);

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

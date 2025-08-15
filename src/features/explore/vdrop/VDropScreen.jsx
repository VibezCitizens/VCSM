// src/features/vdrop/VDropScreen.jsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import VDropCard from './VDropCard';
import { Volume2, VolumeX } from 'lucide-react';

export default function VDropScreen() {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadVideos() {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          media_url,
          post_type,
          user_id,
          created_at,
          author:profiles!posts_user_id_fkey (
            id,
            display_name,
            username,
            photo_url
          )
        `)
        .eq('post_type', 'video') // or .eq('media_type','video') if that's your field
        .eq('deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Video fetch error:', error);
        return;
      }
      if (!mounted) return;
      setVideos(data || []);
    }

    loadVideos();
    return () => {
      mounted = false;
    };
  }, []);

  // derive the active snap index from scroll position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const vh = el.clientHeight || window.innerHeight;
      const index = Math.round(el.scrollTop / vh);
      setCurrentIndex(index);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // lock body scroll behind full-screen feed
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory bg-black z-50"
    >
      {/* 🔈 Global Mute/Unmute */}
      <div className="fixed top-4 right-3 z-[100]">
        <button
          onClick={() => setIsMuted((p) => !p)}
          className="bg-black/60 p-1.5 rounded-full text-white"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {videos.map((video, i) => (
        <div key={video.id} className="h-[100dvh] snap-start">
          <VDropCard video={video} isActive={i === currentIndex} muted={isMuted} />
        </div>
      ))}
    </div>
  );
}

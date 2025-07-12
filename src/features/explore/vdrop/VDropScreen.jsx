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
    async function loadVideos() {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          media_url,
          post_type,
          user_id,
          profiles (
            id,
            display_name,
            username,
            photo_url
          )
        `)
        .eq('post_type', 'video')
        .order('created_at', { ascending: false });

      if (!error) setVideos(data || []);
      else console.error('Video fetch error:', error);
    }

    loadVideos();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const handleScroll = () => {
      const index = Math.round(container.scrollTop / window.innerHeight);
      setCurrentIndex(index);
    };

    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      container?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-black z-50"
    >
      {/* 🔈 Global Mute/Unmute Button */}
      <div className="fixed top-4 right-3 z-[100]">
  <button
    onClick={() => setIsMuted(prev => !prev)}
    className="bg-black/60 p-1.5 rounded-full text-white"
  >
    {isMuted ? (
      <VolumeX className="w-4 h-4" />
    ) : (
      <Volume2 className="w-4 h-4" />
    )}
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

// src/features/explore/vdrop/VDropScreen.jsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import VDropCard from './VDropCard';

export default function VDropScreen() {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollTop / window.innerHeight);
    setCurrentIndex(index);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) container.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
    >
      {videos.map((video, i) => (
        <VDropCard key={video.id} video={video} isActive={i === currentIndex} />
      ))}
    </div>
  );
}

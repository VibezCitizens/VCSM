import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import VDropCard from '@/features/explore/vdrop/VDropCard';
import { Volume2, VolumeX } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function SingleVideoEntryScreen() {
  const { videoId } = useParams(); // route: /video/:videoId
  const [videos, setVideos] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchInitialVideo = async () => {
      const { data: singleVideo, error } = await supabase
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
        .eq('id', videoId)
        .single();

      if (error) {
        console.error('Failed to fetch video:', error);
        return;
      }

      setVideos([singleVideo]);
    };

    fetchInitialVideo();
  }, [videoId]);

  // Auto-load VDRop feed when user scrolls down
  const loadGlobalFeed = async () => {
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

    if (!error && data) {
      // Avoid duplicate first video
      const filtered = data.filter((v) => v.id !== videoId);
      setVideos((prev) => [...prev, ...filtered]);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const handleScroll = () => {
      const index = Math.round(container.scrollTop / window.innerHeight);
      setCurrentIndex(index);

      // If user scrolls to second video, load full VDRop feed
      if (videos.length === 1 && index >= 1) {
        loadGlobalFeed();
      }
    };

    if (container) container.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [videos]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = 'auto');
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-black z-50"
    >
      {/* 🔈 Mute Toggle */}
      <div className="fixed top-4 right-3 z-[100]">
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="bg-black/60 p-1.5 rounded-full text-white"
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
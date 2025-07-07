// features/explore/VDropScreen.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function VDropScreen() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const loadVideos = async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*, profiles!inner(*)')
        .order('created_at', { ascending: false });

      if (!error) setVideos(data);
    };

    loadVideos();
  }, []);

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black">
      {videos.map((video) => (
        <div
          key={video.id}
          className="h-screen snap-start relative flex flex-col justify-end items-center p-4"
        >
          <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            src={video.media_url}
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="z-10 text-white text-sm w-full">
            <div className="font-bold">{video.profiles?.display_name}</div>
            <p className="truncate">{video.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

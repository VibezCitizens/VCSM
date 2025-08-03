import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Viewby from '@/features/explore/stories/components/Viewby';
import Spinner from '@/components/Spinner'; // Your loading spinner component

export default function NotiViewStoryScreen() {
  const { storyId } = useParams(); // from route /noti/story/:storyId
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stories')
      .select('*, profiles(*)')
      .eq('id', storyId)
      .single();

    if (error) {
      console.error('Error fetching story:', error);
      navigate('/'); // fallback to home
      return;
    }

    setStory(data);
    setLoading(false);
  };

  useEffect(() => {
    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Spinner />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white bg-black">
        Story not found.
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <Viewby
        initialStory={story}
        onClose={() => navigate(-1)}
        showCloseButton={true}
        showMuteToggle={true}
        fromNotification={true}
      />
    </div>
  );
}

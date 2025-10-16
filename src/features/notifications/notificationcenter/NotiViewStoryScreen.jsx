// src/features/noti/NotiViewStoryScreen.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';
import StoryViewer from '@/features/explore/stories/StoryViewer';
import VportStoryViewer from '@/features/explore/stories/VportStoryViewer';

export default function NotiViewStoryScreen() {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState(null);   // 'user' | 'vport' | null
  const [story, setStory] = useState(null); // the row we found

  useEffect(() => {
    let cancelled = false;
    if (!storyId) return;

    (async () => {
      setLoading(true);

      // 1) Try user stories
      const u = await supabase
        .from('stories')
        .select('id, user_id, media_url, media_type, caption, created_at, is_active, deleted')
        .eq('id', storyId)
        .maybeSingle();

      if (!cancelled && u.data && !u.error) {
        setKind('user');
        setStory(u.data);
        setLoading(false);
        return;
      }

      // 2) Fallback to VPORT stories
      const v = await supabase
        .from('vport_stories')
        .select('id, vport_id, created_by, media_url, media_type, caption, created_at, is_active, deleted')
        .eq('id', storyId)
        .maybeSingle();

      if (!cancelled && v.data && !v.error) {
        setKind('vport');
        setStory(v.data);
        setLoading(false);
        return;
      }

      if (!cancelled) {
        setKind(null);
        setStory(null);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [storyId]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Spinner />
      </div>
    );
  }

  if (!story || !kind) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white bg-black">
        Story not found.
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {kind === 'user' ? (
        <StoryViewer
          stories={[story]}
          onClose={() => navigate(-1)}
        />
      ) : (
        <VportStoryViewer
          stories={[story]}
          onClose={() => navigate(-1)}
        />
      )}
    </div>
  );
}

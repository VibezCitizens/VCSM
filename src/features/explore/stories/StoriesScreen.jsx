import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import StoryViewer from './StoryViewer';

export default function StoriesScreen() {
  const [storiesByUser, setStoriesByUser] = useState({});
  const [activeUserId, setActiveUserId] = useState(null);

  useEffect(() => {
    const loadStories = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('stories')
        .select('*, profiles(*)')
        .gte('created_at', since)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const grouped = {};
        data.forEach((story) => {
          const uid = story.user_id;
          if (!grouped[uid]) {
            grouped[uid] = { profile: story.profiles, items: [] };
          }
          grouped[uid].items.push(story);
        });
        setStoriesByUser(grouped);
      } else {
        console.error('Failed to load stories:', error);
      }
    };

    loadStories();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">24Drop</h1>

      <div className="flex overflow-x-auto gap-4">
        {Object.entries(storiesByUser).map(([userId, { profile, items }]) => (
          <div
            key={userId}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => setActiveUserId(userId)}
          >
            <img
              src={profile?.photo_url || '/default.png'}
              alt={profile?.display_name}
              className="w-16 h-16 rounded-full border-2 border-purple object-cover"
            />
            <p className="text-xs text-white mt-1 text-center">{profile?.display_name}</p>
          </div>
        ))}
      </div>

      {/* Story (24Drop) Viewer */}
      {activeUserId && storiesByUser[activeUserId] && (
        <StoryViewer
          stories={storiesByUser[activeUserId].items}
          onClose={() => setActiveUserId(null)}
        />
      )}
    </div>
  );
}

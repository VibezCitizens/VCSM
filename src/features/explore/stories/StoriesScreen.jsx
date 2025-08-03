import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import StoryViewer from './StoryViewer'; // Update path if needed

export default function StoriesScreen() {
  const [storiesByUser, setStoriesByUser] = useState({});
  const [activeUserId, setActiveUserId] = useState(null);
  const [seenStoryIds, setSeenStoryIds] = useState(new Set());

  useEffect(() => {
    const loadStories = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('stories')
        .select('*, profile:profiles!fk_stories_user_profile(*)')
        .gte('created_at', since)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const grouped = {};
        data.forEach((story) => {
          const uid = story.user_id;
          if (!grouped[uid]) {
            grouped[uid] = { profile: story.profile, items: [] };
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

  const handleStoryView = (userId) => {
    setActiveUserId(userId);
    const stories = storiesByUser[userId]?.items || [];

    const updated = new Set([...seenStoryIds]);
    stories.forEach((s) => updated.add(s.id));
    setSeenStoryIds(updated);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">24Drop</h1>

      <div className="flex overflow-x-auto gap-4">
        {Object.entries(storiesByUser).map(([userId, { profile, items }]) => {
          const seen = items.every((s) => seenStoryIds.has(s.id));

          return (
            <div
              key={userId}
              className="flex flex-col items-center cursor-pointer relative"
              onClick={() => handleStoryView(userId)}
            >
              <div
                className={`relative w-20 h-28 rounded-lg overflow-hidden border-2 ${
                  seen ? 'border-zinc-600' : 'border-purple-500'
                }`}
              >
                <img
                  src={profile?.photo_url || '/default.png'}
                  alt={profile?.display_name}
                  className="w-full h-full object-cover"
                />
                {seen && (
                  <div className="absolute inset-0 bg-gray-800 bg-opacity-50" />
                )}
              </div>
              <p className="text-xs text-white mt-1 text-center">
                {profile?.display_name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Story Viewer */}
      {activeUserId &&
        storiesByUser[activeUserId]?.items?.length > 0 && (
          <StoryViewer
            key={activeUserId}
            stories={storiesByUser[activeUserId].items}
            onClose={() => setActiveUserId(null)}
          />
        )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import VportStoryViewer from './VportStoryViewer';

export default function VportStoriesScreen() {
  const [storiesByVport, setStoriesByVport] = useState({});
  const [activeVportId, setActiveVportId] = useState(null);
  const [seenStoryIds, setSeenStoryIds] = useState(new Set());

  useEffect(() => {
    const loadStories = async () => {
      // last 24h; RLS already filters by is_active, deleted=false, now()<expires_at
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('vport_stories')
        .select(`
          id, vport_id, media_url, media_type, caption, created_at,
          vport:vport_id ( id, name, avatar_url )
        `)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load VPORT stories:', error);
        return;
      }

      const grouped = {};
      (data || []).forEach((story) => {
        const vid = story.vport_id;
        if (!grouped[vid]) {
          grouped[vid] = { vport: story.vport, items: [] };
        }
        grouped[vid].items.push(story);
      });

      setStoriesByVport(grouped);
    };

    loadStories();
  }, []);

  const handleOpen = (vportId) => {
    setActiveVportId(vportId);
    const items = storiesByVport[vportId]?.items || [];
    const updated = new Set([...seenStoryIds]);
    items.forEach((s) => updated.add(s.id));
    setSeenStoryIds(updated);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">VPORT 24Drop</h1>

      <div className="flex overflow-x-auto gap-4">
        {Object.entries(storiesByVport).map(([vportId, { vport, items }]) => {
          const seen = items.every((s) => seenStoryIds.has(s.id));

          return (
            <div
              key={vportId}
              className="flex flex-col items-center cursor-pointer relative"
              onClick={() => handleOpen(vportId)}
            >
              <div
                className={`relative w-20 h-28 rounded-lg overflow-hidden border-2 ${
                  seen ? 'border-zinc-600' : 'border-purple-500'
                }`}
              >
                <img
                  src={vport?.avatar_url || '/default.png'}
                  alt={vport?.name}
                  className="w-full h-full object-cover"
                />
                {seen && <div className="absolute inset-0 bg-gray-800 bg-opacity-50" />}
              </div>
              <p className="text-xs text-white mt-1 text-center">{vport?.name}</p>
            </div>
          );
        })}
      </div>

      {/* Viewer */}
      {activeVportId &&
        storiesByVport[activeVportId]?.items?.length > 0 && (
          <VportStoryViewer
            key={activeVportId}
            stories={storiesByVport[activeVportId].items}
            onClose={() => setActiveVportId(null)}
          />
        )}
    </div>
  );
}

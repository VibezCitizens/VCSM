// src/features/explore/stories/components/VportViewby.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { db } from '@/data/data';
import UserLink from '@/components/UserLink';

const REACTIONS = ['🔥', '😂', '😍', '👏', '💯'];

export default function VportViewby({ storyId }) {
  const [me, setMe] = useState(null);
  const [story, setStory] = useState(null); // { id, vport_id, created_by }
  const [isManager, setIsManager] = useState(false);

  const [viewers, setViewers] = useState([]);      // [{ user_id, count, profiles:{...}, reaction? }]
  const [emojiCounts, setEmojiCounts] = useState({}); // { '🔥': 3, ... }

  const [showModal, setShowModal] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  // --- helpers ---------------------------------------------------------------

  const fetchStoryMeta = async (sid) => {
    const { data, error } = await supabase
      .from('vport_stories')
      .select('id, vport_id, created_by')
      .eq('id', sid)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  const fetchIsManager = async (vportId, userId) => {
    // manager_user_id is the field we standardized on
    const { data, error } = await supabase
      .from('vport_managers')
      .select('manager_user_id')
      .eq('vport_id', vportId)
      .eq('manager_user_id', userId)
      .maybeSingle();
    if (error && String(error?.code) !== 'PGRST116') throw error;
    return Boolean(data);
  };

  const fetchViewers = async (sid) => {
    const { data, error } = await supabase
      .from('vport_story_views')
      .select(`
        user_id, count, viewed_at,
        profiles!vport_story_views_user_id_fkey ( id, display_name, username, photo_url )
      `)
      .eq('story_id', sid);
    if (error) throw error;
    return (data || []).map((r) => ({
      user_id: r.user_id,
      count: r.count,
      profiles: r.profiles,
      reaction: null, // fill from reactions below
    }));
  };

  const fetchReactionsAndMerge = async (sid, baseViewers) => {
    const reactions = await db.stories.listVportStoryReactions(sid);
    const counts = {};
    const vmap = new Map(baseViewers.map(v => [v.user_id, { ...v }]));

    (reactions || []).forEach(({ user_id, emoji }) => {
      counts[emoji] = (counts[emoji] || 0) + 1;
      const row = vmap.get(user_id);
      if (row) row.reaction = emoji;
    });

    return { viewers: Array.from(vmap.values()), counts };
  };

  // --- initial load ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const authUser = await db.auth.getAuthUser();
        if (!authUser?.id) return;
        if (cancelled) return;

        setMe(authUser);

        const meta = await fetchStoryMeta(storyId);
        if (cancelled) return;
        setStory(meta);

        if (meta?.vport_id) {
          const mgr = await fetchIsManager(meta.vport_id, authUser.id);
          if (cancelled) return;
          setIsManager(mgr);
        }

        const base = await fetchViewers(storyId);
        if (cancelled) return;

        const { viewers: merged, counts } = await fetchReactionsAndMerge(storyId, base);
        if (cancelled) return;

        setViewers(merged);
        setEmojiCounts(counts);
      } catch (e) {
        if (import.meta.env?.DEV) console.warn('[VportViewby] init failed:', e?.message || e);
      }
    })();

    return () => { cancelled = true; };
  }, [storyId]);

  // --- derived ---------------------------------------------------------------

  const myReaction = useMemo(() => {
    if (!me) return null;
    const v = viewers.find((x) => x.user_id === me.id);
    return v?.reaction || null;
  }, [me, viewers]);

  // --- actions ---------------------------------------------------------------

  const handleReact = async (emoji) => {
    if (!me || !storyId || cooldown) return;

    setCooldown(true);
    setTimeout(() => setCooldown(false), 800);

    const nextEmoji = myReaction === emoji ? null : emoji;

    try {
      // Use centralized DAL: toggles for us
      await db.stories.setStoryReaction({
        isVport: true,
        storyId,
        userId: me.id,
        emoji: nextEmoji,
      });

      // Fire-and-forget notify managers about reaction change
      db.stories.notifyStoryReaction({
        isVport: true,
        storyId,
        actorUserId: me.id,
        emoji: nextEmoji,
      }).catch(() => {});

      // Refresh counts from DAL, update my row locally
      const reactions = await db.stories.listVportStoryReactions(storyId);
      const counts = {};
      (reactions || []).forEach(({ emoji }) => { counts[emoji] = (counts[emoji] || 0) + 1; });
      setEmojiCounts(counts);

      setViewers((prev) => {
        const exists = prev.some(v => v.user_id === me.id);
        const updated = prev.map((v) =>
          v.user_id === me.id ? { ...v, reaction: nextEmoji } : v
        );
        // if I'm not in viewers yet (edge-case), add a minimal row
        return exists
          ? updated
          : [{ user_id: me.id, count: 1, reaction: nextEmoji, profiles: { id: me.id } }, ...updated];
      });
    } catch (e) {
      if (import.meta.env?.DEV) console.warn('[VportViewby] react failed:', e?.message || e);
    }
  };

  // --- render ---------------------------------------------------------------

  if (!story) return null;

  return (
    <>
      {/* Eye count only for managers */}
      {isManager && viewers.length > 0 && (
        <div
          className="fixed top-1/2 right-2 -translate-y-1/2 z-50 bg-black/60 px-3 py-1 rounded-full cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-white text-lg">👁️</span>
            <span className="text-white text-sm">{viewers.length}</span>
          </div>
        </div>
      )}

      {/* Reaction bar (all viewers) */}
      <div className="fixed top-1/2 right-2 -translate-y-1/2 z-50 pointer-events-auto">
        <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-3 flex flex-col gap-4 shadow-lg">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className={`text-2xl transition-transform ${
                cooldown ? 'opacity-40 pointer-events-none' : 'active:scale-95'
              }`}
              onClick={() => handleReact(emoji)}
              disabled={cooldown}
              aria-label={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Manager modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center p-6 overflow-y-auto">
          <button
            className="text-white text-sm mb-4 self-end"
            onClick={() => setShowModal(false)}
          >
            Close
          </button>

          {isManager && (
            <div className="flex gap-4 mb-6 flex-wrap justify-center">
              {Object.entries(emojiCounts).map(([emoji, count]) => (
                <div key={emoji} className="text-white text-sm bg-zinc-800 px-3 py-1 rounded-full">
                  {emoji} × {count}
                </div>
              ))}
            </div>
          )}

          <h2 className="text-white text-base mb-4">Viewers ({viewers.length})</h2>

          <div className="space-y-4 w-full">
            {viewers.map((viewer) => (
              <div key={viewer.user_id} className="bg-zinc-800 p-2 rounded-lg">
                <UserLink
                  user={{ ...(viewer.profiles || {}), id: viewer.user_id }}
                  avatarSize="w-8 h-8"
                  avatarShape="rounded-full"
                  textSize="text-sm"
                />
                <div className="ml-10 mt-1 text-white text-sm">
                  Viewed ×{viewer.count}
                  {viewer.reaction && <span className="ml-2">Reacted with: {viewer.reaction}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useStoryViewData } from '@/hooks/useStoryViewData';
import UserLink from '@/components/userlink';

const REACTIONS = ['🔥', '😂', '😍', '👏', '💯'];

export default function Viewby({ storyId }) {
  const [showModal, setShowModal] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const {
    loading,
    isOwner,
    userId,
    viewers,
    emojiCounts,
    storyOwnerId, // ✅ must be added in useStoryViewData
  } = useStoryViewData(storyId);

  const handleReact = async (emoji) => {
    if (!userId || !storyId || isOwner || cooldown) return;

    const currentReaction = viewers.find(v => v.user_id === userId)?.reaction;

    setCooldown(true);
    setTimeout(() => setCooldown(false), 1000);

    if (currentReaction === emoji) {
      const { error } = await supabase
        .from('story_reactions')
        .delete()
        .match({ story_id: storyId, user_id: userId });

      if (error) console.error('❌ Remove reaction error:', error.message);
      else console.log(`🗑️ Removed reaction: ${emoji}`);
    } else {
      const { error } = await supabase
        .from('story_reactions')
        .upsert(
          { story_id: storyId, user_id: userId, emoji },
          { onConflict: 'story_id, user_id' }
        );

      if (error) {
        console.error('❌ Reaction error:', error.message);
      } else {
        console.log(`✅ Reacted with: ${emoji}`);

        // ✅ Send notification to story owner
        if (storyOwnerId && storyOwnerId !== userId) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: storyOwnerId,
              actor_id: userId,
              type: 'story_reaction',
              post_id: storyId,
            });

          if (notifError) {
            console.error('❌ Notification insert error:', notifError.message);
          } else {
            console.log('📨 Notification sent to story owner');
          }
        }
      }
    }
  };

  if (loading) return null;

  return (
    <>
      {/* 👁️ Eye Icon */}
      {isOwner && viewers.length > 0 && (
        <div
          className="fixed top-1/2 right-2 transform -translate-y-1/2 z-50 bg-black bg-opacity-60 px-3 py-1 rounded-full cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-white text-lg">👁️</span>
            <span className="text-white text-sm">{viewers.length}</span>
          </div>
        </div>
      )}

      {/* 🧡 Emoji Reaction Bar */}
      {!isOwner && (
        <div className="fixed top-1/2 right-2 transform -translate-y-1/2 z-50 pointer-events-auto">
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-full px-3 py-3 flex flex-col gap-4 shadow-lg">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                className={`text-2xl transition-transform ${
                  cooldown ? 'opacity-40 pointer-events-none' : 'active:scale-95'
                }`}
                onClick={() => handleReact(emoji)}
                disabled={cooldown}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 📊 Viewer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center p-6 overflow-y-auto">
          <button
            className="text-white text-sm mb-4 self-end"
            onClick={() => setShowModal(false)}
          >
            Close
          </button>

          {isOwner && (
            <div className="flex gap-4 mb-6 flex-wrap justify-center">
              {Object.entries(emojiCounts).map(([emoji, count]) => (
                <div
                  key={emoji}
                  className="text-white text-sm bg-zinc-800 px-3 py-1 rounded-full"
                >
                  {emoji} × {count}
                </div>
              ))}
            </div>
          )}

          <h2 className="text-white text-base mb-4">
            Viewers ({viewers.length})
          </h2>

          <div className="space-y-4 w-full">
            {viewers.map((viewer) => (
              <div
                key={viewer.user_id}
                className="bg-zinc-800 p-2 rounded-lg"
              >
                <UserLink
                  user={{ ...viewer, id: viewer.user_id }}
                  avatarSize="w-8 h-8"
                  avatarShape="rounded-full"
                  textSize="text-sm"
                />
                <div className="ml-10 mt-1 text-white text-sm">
                  Viewed ×{viewer.count}
                  {viewer.reaction && (
                    <span className="ml-2">
                      Reacted with: {viewer.reaction}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

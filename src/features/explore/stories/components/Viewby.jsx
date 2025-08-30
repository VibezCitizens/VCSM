// src/features/explore/stories/components/Viewby.jsx
import React, { useState } from 'react';
import { db } from '@/data/data';                 // ✅ use centralized DAL
import { useStoryViewData } from '@/hooks/useStoryViewData';
import UserLink from '@/components/UserLink';

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
    storyOwnerId,
    isVportStory = false,       // ✅ add this in your hook; defaults to user story
  } = useStoryViewData(storyId);

  const handleReact = async (emoji) => {
    if (!userId || !storyId || isOwner || cooldown) return;

    // what the viewer has on this story right now (if anything)
    const currentReaction = viewers.find(v => v.user_id === userId)?.reaction || null;

    setCooldown(true);
    setTimeout(() => setCooldown(false), 1000);

    try {
      // Toggle logic lives in DAL:
      // - if same emoji -> toggle off
      // - if different -> replace
      const nextEmoji = currentReaction === emoji ? null : emoji;

      await db.stories.setStoryReaction({
        isVport: isVportStory,
        storyId,
        userId,
        emoji: nextEmoji,
      });

      // Fire a notification only when adding (not removing) and not self
      if (nextEmoji && storyOwnerId && storyOwnerId !== userId) {
        await db.stories.notifyStoryReaction({
          isVport: isVportStory,
          storyId,
          actorUserId: userId,
          emoji: nextEmoji,
        });
      }
    } catch (e) {
      console.error('Reaction failed:', e?.message || e);
    }
  };

  if (loading) return null;

  return (
    <>
      {/* 👁️ Eye Icon */}
      {isOwner && viewers.length > 0 && (
        <div
          className="fixed top-1/2 right-2 -translate-y-1/2 z-50 bg-black/60 px-3 py-1 rounded-full cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">👁️</span>
            <span className="text-white text-sm">{viewers.length}</span>
          </div>
        </div>
      )}

      {/* 🧡 Emoji Reaction Bar */}
      {!isOwner && (
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
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 📊 Viewer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center p-6 overflow-y-auto">
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
              <div key={viewer.user_id} className="bg-zinc-800 p-2 rounded-lg">
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

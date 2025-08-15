// src/components/NotificationItem.jsx
import React, { useEffect, useMemo } from 'react';
import UserLink from '@/components/UserLink';
import useProfile from '@/hooks/useProfile';

const emojiMap = {
  rose: '🌹',
  like: '❤️',
  dislike: '👎',
  laugh: '😂',
  fire: '🔥',
};

function NewBadge() {
  return (
    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
      New
    </span>
  );
}

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return '';
  }
}

export default function NotificationItem({ notif, onClick }) {
  // Prefer column-based actor_id; fall back to legacy metadata keys
  const actorId = useMemo(() => {
    const m = notif?.metadata || {};
    return (
      notif?.actor_id ||
      m.reactor_id ||
      m.purchaser ||
      m.sender_id ||
      m.follower_id ||
      null
    );
  }, [notif]);

  // Load actor's profile
  const { profile: actor, isLoading, error } = useProfile(actorId);

  useEffect(() => {
    // Helpful for debugging mismatches
    console.debug('NotificationItem render:', {
      notifId: notif?.id,
      type: notif?.type,
      actorId,
      hasActorFromColumn: Boolean(notif?.actor_id),
      isLoading,
      profileLoaded: Boolean(actor),
      profileError: error?.message,
    });
  }, [notif?.id, notif?.type, actorId, actor, isLoading, error]);

  const ActorLink = () => {
    if (isLoading) {
      return (
        <span className="inline-block w-5 h-5 bg-neutral-700 rounded-full animate-pulse" />
      );
    }
    if (!actor) {
      return <span className="text-neutral-400 italic">Someone</span>;
    }
    return <UserLink user={actor} avatarSize="w-5 h-5" textSize="text-sm" />;
  };

  let message;
  const meta = notif?.metadata || {};

  switch (notif?.type) {
    // POSTS
    case 'post_rose':
      message = (
        <>
          🌹 <ActorLink /> sent you a rose
        </>
      );
      break;

    case 'post_reaction':
      message = (
        <>
          {emojiMap[meta.reaction_type] || '🔔'} <ActorLink /> reacted to your post
        </>
      );
      break;

    case 'post_like':
      message = (
        <>
          ❤️ <ActorLink /> liked your post
        </>
      );
      break;

    case 'post_dislike':
      message = (
        <>
          👎 <ActorLink /> disliked your post
        </>
      );
      break;

    case 'comment_like':
      message = (
        <>
          ❤️ <ActorLink /> liked your comment
        </>
      );
      break;

    // STORIES
    case 'story_reaction':
      message = (
        <>
          {emojiMap[meta.reaction_type] || '🔔'} <ActorLink /> reacted to your story
        </>
      );
      break;

    // FOLLOW
    case 'follow':
      message = (
        <>
          👤 <ActorLink /> followed you
        </>
      );
      break;

    // MESSAGES
    case 'message': {
      const preview = meta.message_preview || 'Sent you a message';
      message = (
        <>
          📨 <ActorLink /> {preview}
        </>
      );
      break;
    }

    default:
      message = '🔔 You have a new notification';
  }

  return (
    <li
      onClick={onClick}
      className="bg-neutral-800 p-3 rounded-lg shadow hover:bg-neutral-700 cursor-pointer flex justify-between items-center"
    >
      <div>
        <div className="text-sm">{message}</div>
        <div className="text-xs text-neutral-400">
          {formatTimestamp(notif?.created_at)}
        </div>
      </div>
      {!notif?.read && <NewBadge />}
    </li>
  );
}

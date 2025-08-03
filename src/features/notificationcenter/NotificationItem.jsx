// src/components/NotificationItem.jsx
import React, { useEffect } from 'react';
import UserLink from '@/components/UserLink';
import useProfile from '@/hooks/useProfile';

const emojiMap = {
  rose:  '🌹',
  like:  '❤️',
  laugh: '😂',
  fire:  '🔥',
};

function NewBadge() {
  return (
    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
      New
    </span>
  );
}

export default function NotificationItem({ notif, onClick }) {
  // figure out who the actor is (for roses we used `purchaser`, for reactions `reactor_id`, etc.)
  const reactorId =
    notif.metadata?.reactor_id ||
    notif.metadata?.purchaser   ||  // <-- fallback for "post_rose"
    notif.metadata?.sender_id   ||
    notif.metadata?.follower_id;

  // fetch that user's profile
  const { profile: sender, isLoading, error } = useProfile(reactorId);

  // debug log on every render
  useEffect(() => {
    console.debug('NotificationItem render:', {
      notifId: notif.id,
      type: notif.type,
      reactorId,
      sender,
      isLoading,
      profileError: error,
    });
  }, [notif.id, notif.type, reactorId, sender, isLoading, error]);

  // helper to render either a loading placeholder, "Someone", or the real UserLink
  const ActorLink = () => {
    if (isLoading) {
      return (
        <span className="inline-block w-5 h-5 bg-neutral-700 rounded-full animate-pulse" />
      );
    }
    if (!sender) {
      return <span className="text-neutral-400 italic">Someone</span>;
    }
    return <UserLink user={sender} avatarSize="w-5 h-5" textSize="text-sm" />;
  };

  // build the line of text and emoji
  let message;
  switch (notif.type) {
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
          {emojiMap[notif.metadata?.reaction_type] || '🔔'}{' '}
          <ActorLink /> reacted to your post
        </>
      );
      break;

    case 'story_reaction':
      message = (
        <>
          {emojiMap[notif.metadata?.reaction_type] || '🔔'}{' '}
          <ActorLink /> reacted to your story
        </>
      );
      break;

    case 'follow':
      message = (
        <>
          👤 <ActorLink /> followed you
        </>
      );
      break;

    case 'message': {
      const preview = notif.metadata?.message_preview || 'Sent you a message';
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
          {new Date(notif.created_at).toLocaleString()}
        </div>
      </div>
      {!notif.read && <NewBadge />}
    </li>
  );
}

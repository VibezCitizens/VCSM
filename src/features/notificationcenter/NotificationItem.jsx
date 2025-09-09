// src/components/NotificationItem.jsx
import React, { useEffect } from 'react';
import UserLink from '@/components/UserLink';
import useProfile from '@/hooks/useProfile';

const emojiMap = {
  rose:     '🌹',
  like:     '❤️',
  dislike:  '👎',
  laugh:    '😂',
  fire:     '🔥',
};

function NewBadge() {
  return (
    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
      New
    </span>
  );
}

export default function NotificationItem({ notif, onClick }) {
  // Try to standardize the “actor” (who triggered the notif)
  const reactorId =
    notif?.metadata?.actor_user_id ??
    notif?.metadata?.reactor_id ??
    notif?.metadata?.liker_id ??
    notif?.metadata?.disliker_id ??
    notif?.metadata?.purchaser ??          // for post_rose fallback
    notif?.metadata?.sender_id ??
    notif?.metadata?.follower_id ??
    notif?.metadata?.reporter_id ??        // for post_reported
    null;

  // fetch that user's profile (if any)
  const { profile: sender, isLoading, error } = useProfile(reactorId);

  // debug
  useEffect(() => {
    console.debug('NotificationItem render:', {
      notifId: notif.id,
      type: notif.type,
      reactorId,
      sender,
      isLoading,
      profileError: error,
      metadata: notif?.metadata,
    });
  }, [notif?.id, notif?.type, reactorId, sender, isLoading, error, notif?.metadata]);

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
    case 'post_like':
      message = (
        <>
          {emojiMap.like} <ActorLink /> liked your post
        </>
      );
      break;

    case 'post_dislike':
      message = (
        <>
          {emojiMap.dislike} <ActorLink /> disliked your post
        </>
      );
      break;

    case 'post_rose':
      message = (
        <>
          {emojiMap.rose} <ActorLink /> sent you a rose
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

    case 'friend_request':
      message = (
        <>
          👥 <ActorLink /> sent you a friend request
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

    // support a couple of possible strings for the “reported” event
    case 'post_reported':
    case 'post_report':
    case 'report_post': {
      const reason =
        notif.metadata?.reason ||
        notif.metadata?.report_reason ||
        null;

      // Only show "by <actor>" if we have an actor id
      const byActor = reactorId ? (<><ActorLink /> reported your post</>) : (<>Your post was reported</>);

      message = (
        <>
          🚩 {byActor}
          {reason ? (
            <>
              {': '}
              <span className="italic text-white/80">“{reason}”</span>
            </>
          ) : null}
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

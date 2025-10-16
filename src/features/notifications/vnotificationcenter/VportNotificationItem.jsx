// src/features/notifications/vnotificationcenter/VportNotificationItem.jsx
import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLink from '@/components/UserLink';
import useProfile from '@/features/notifications/notificationcenter/hooks/useProfile';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const DEBUG = true;

const emojiMap = {
  rose: '🌹',
  like: '👍',
  dislike: '👎',
  laugh: '😂',
  fire: '🔥',
  comment_like: '❤️',
};
const fallbackIcon = '🔔';

function NewBadge() {
  return (
    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
      New
    </span>
  );
}

function ensureContext(ctx) {
  if (!ctx) return {};
  if (typeof ctx === 'object') return ctx;
  try {
    return JSON.parse(ctx);
  } catch {
    return {};
  }
}

export default function VportNotificationItem({ notif, onClick, onResolved }) {
  const navigate = useNavigate();

  const kind = (notif?.kind || notif?.type || '').toLowerCase();
  const objectType = (notif?.object_type || '').toLowerCase();

  const [busy, setBusy] = useState(false);
  const [seenLocal, setSeenLocal] = useState(false);

  const ctx = useMemo(
    () => ensureContext(notif?.context ?? notif?.metadata ?? {}),
    [notif]
  );

  // actor/sender
  const actorId = useMemo(
    () =>
      notif?.actor_id ??
      ctx.actor_user_id ??
      ctx.reactor_id ??
      ctx.liker_id ??
      ctx.disliker_id ??
      ctx.purchaser ??
      ctx.sender_id ??
      ctx.follower_id ??
      ctx.reporter_id ??
      null,
    [notif, ctx]
  );

  const preloadedSender = notif?.sender || null;
  const { profile: fetchedSender, isLoading } = useProfile(
    preloadedSender ? null : actorId
  );
  const sender = preloadedSender || fetchedSender || null;

  const ActorInline = useCallback(() => {
    if (isLoading)
      return (
        <span className="inline-block w-5 h-5 bg-neutral-700 rounded-full animate-pulse" />
      );
    if (!sender)
      return <span className="text-neutral-400 italic">Someone</span>;
    return (
      <span className="[&_*]:pointer-events-none">
        <UserLink user={sender} avatarSize="w-5 h-5" textSize="text-sm" />
      </span>
    );
  }, [isLoading, sender]);

  const qty = Number(ctx?.qty ?? ctx?.amount ?? 1);
  const preview = ctx?.preview ? String(ctx.preview).slice(0, 80) : null;

  const isCommentLike =
    kind === 'comment_like' ||
    kind === 'like_comment' ||
    (objectType === 'post_comment' &&
      (kind === 'like' ||
        kind === 'post_like' ||
        ctx.action === 'like' ||
        ctx.event === 'like'));

  const markRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_read: true, is_seen: true })
        .eq('id', notif.id);
      if (DEBUG) {
        if (error) console.error('[vport-noti][markRead] error', error);
        else console.log('[vport-noti][markRead] ok', notif.id);
      }
    } catch (e) {
      if (DEBUG) console.error('[vport-noti][markRead] threw', e);
    }
    setSeenLocal(true);
  }, [notif?.id]);

  const showNew = !(notif?.is_seen ?? false) && !seenLocal;

  let message;
  if (isCommentLike) {
    message = (
      <>
        {emojiMap.comment_like} <ActorInline /> loved your comment
        {preview ? (
          <>
            : <span className="italic text-white/80">“{preview}”</span>
          </>
        ) : null}
      </>
    );
  } else {
    switch (kind) {
      case 'like':
      case 'post_like':
        message = (
          <>
            {emojiMap.like} <ActorInline /> liked your post
          </>
        );
        break;
      case 'dislike':
      case 'post_dislike':
        message = (
          <>
            {emojiMap.dislike} <ActorInline /> disliked your post
          </>
        );
        break;
      case 'rose':
      case 'post_rose': {
        const s = qty > 1 ? 'roses' : 'rose';
        message = (
          <>
            {emojiMap.rose} <ActorInline /> sent you {qty} {s}
          </>
        );
        break;
      }
      case 'post_reaction': {
        const ico = emojiMap[ctx?.reaction_type] || fallbackIcon;
        message = (
          <>
            {ico} <ActorInline /> reacted to your post
          </>
        );
        break;
      }
      case 'story_reaction': {
        const ico = emojiMap[ctx?.reaction_type] || fallbackIcon;
        message = (
          <>
            {ico} <ActorInline /> reacted to your story
          </>
        );
        break;
      }
      case 'comment': {
        const target =
          objectType === 'post_comment' ? 'your comment' : 'your post';
        message = (
          <>
            💬 <ActorInline /> commented on {target}
            {preview ? (
              <>
                : <span className="italic text-white/80">“{preview}”</span>
              </>
            ) : null}
          </>
        );
        break;
      }
      case 'reply':
        message = (
          <>
            💬 <ActorInline /> replied to your comment
            {preview ? (
              <>
                : <span className="italic text-white/80">“{preview}”</span>
              </>
            ) : null}
          </>
        );
        break;
      default:
        message = <>{fallbackIcon} You have a new notification</>;
    }
  }

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={async () => {
        await markRead();
        onClick?.(notif);
      }}
      onKeyDown={async (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          await markRead();
          onClick?.(notif);
        }
      }}
      className="bg-neutral-800 p-3 rounded-lg shadow hover:bg-neutral-700 cursor-pointer flex justify-between items-center"
    >
      <div>
        <div className="text-sm">{message}</div>
        <div className="text-xs text-neutral-400">
          {notif?.created_at ? new Date(notif.created_at).toLocaleString() : ''}
        </div>
      </div>
      {showNew && <NewBadge />}
    </li>
  );
}

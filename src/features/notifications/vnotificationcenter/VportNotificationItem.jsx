// src/features/notifications/vnotificationcenter/VportNotificationItem.jsx
import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLink from '@/components/UserLink';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import useProfile from '@/features/notifications/notificationcenter/hooks/useProfile';

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

function ensureObj(v) {
  if (!v) return {};
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return {}; }
}

/** Keep kinds consistent with your NotificationItem.jsx */
function normalizeKind(raw) {
  const k = String(raw || '').toLowerCase();
  if (!k) return '';
  const snake = k.replaceAll('.', '_');
  if (snake === 'reaction') return 'post_reaction';
  if (k === 'follow.request' || snake === 'follow_request') return 'follow_request';
  if (k === 'follow.accepted' || snake === 'follow_accepted' || snake === 'follow_accept') {
    return 'follow_request_accepted';
  }
  return snake;
}

export default function VportNotificationItem({
  notif,
  onClick,
  onResolved,          // kept for API parity
}) {
  const navigate = useNavigate();

  const kind = normalizeKind(notif?.kind || notif?.type);
  const objectType = (notif?.object_type || '').toLowerCase();

  const [busy, setBusy] = useState(false);
  const [seenLocal, setSeenLocal] = useState(false);

  /** Prefer hydrated sender injected upstream (can be user OR vport) */
  let preloadedSender = notif?.sender || null; // { type: 'user'|'vport', ... }

  // If missing but notif hints it's a vport actor, synthesize a vport sender
  if (!preloadedSender && notif?.actor_vport_id) {
    preloadedSender = {
      type: 'vport',
      id: notif.actor_vport_id,
      display_name: notif.actor_vport_name || 'VPORT',
      slug: notif.actor_vport_slug || null,
      avatar_url: notif.actor_vport_avatar_url || '/avatar.jpg',
      photo_url: notif.actor_vport_avatar_url || '/avatar.jpg',
    };
  }

  // If still no sender, try fetching a USER profile (vports don’t use this hook)
  const actorProfileId =
    notif?.actor_profile_id ||
    notif?.context?.actor_user_id ||
    notif?.context?.sender_id ||
    null;

  const { profile: fetchedSender, isLoading } = useProfile(
    preloadedSender || !actorProfileId ? null : actorProfileId
  );

  // Final sender normalized for <UserLink/>
  const sender = useMemo(() => {
    if (preloadedSender?.type === 'vport') {
      return {
        id: preloadedSender.id,
        display_name: preloadedSender.display_name || preloadedSender.name || 'VPORT',
        slug: preloadedSender.slug || preloadedSender.vport_slug || null,
        username: null,
        avatar_url: preloadedSender.avatar_url || preloadedSender.photo_url || '/avatar.jpg',
        photo_url: preloadedSender.photo_url || preloadedSender.avatar_url || '/avatar.jpg',
        type: 'vport',
      };
    }
    if (preloadedSender?.type === 'user') {
      return {
        id: preloadedSender.id,
        display_name: preloadedSender.display_name,
        username: preloadedSender.username,
        avatar_url: preloadedSender.avatar_url || preloadedSender.photo_url,
        photo_url: preloadedSender.photo_url || preloadedSender.avatar_url,
        type: 'user',
      };
    }
    if (fetchedSender) {
      return {
        id: fetchedSender.id,
        display_name: fetchedSender.display_name,
        username: fetchedSender.username,
        avatar_url: fetchedSender.photo_url,
        photo_url: fetchedSender.photo_url,
        type: 'user',
      };
    }
    return null;
  }, [preloadedSender, fetchedSender]);

  const ctx = useMemo(() => ensureObj(notif?.context ?? notif?.metadata), [notif]);

  // Persisted decision for follow requests
  const persistedDecision = useMemo(() => {
    const r = (ctx?.resolution || '').toLowerCase();
    return r === 'accepted' || r === 'declined' ? r : null;
  }, [ctx?.resolution]);

  const [localDecision, setLocalDecision] = useState(null);
  const decision = localDecision || persistedDecision;

  const ActorInline = useCallback(() => {
    if (isLoading && !sender) {
      return <span className="inline-block w-5 h-5 bg-neutral-700 rounded-full animate-pulse" />;
    }
    if (!sender) return <span className="text-neutral-400 italic">Someone</span>;

    const authorType = sender.type === 'vport' ? 'vport' : 'user';
    return (
      <span className="[&_*]:pointer-events-none">
        <UserLink
          user={sender}
          authorType={authorType}
          className="min-w-0 flex-1"
          avatarSize="w-10 h-10"
          avatarShape="rounded-md"
          textSize="text-base"
          withUsername
        />
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
       kind === 'post_reaction' ||
       ctx.action === 'like' ||
       ctx.event === 'like' ||
       ctx.reaction_type === 'like' ||
       ctx.reaction === 'like'));

  /** Mark read/seen with RLS guard */
  const markRead = useCallback(async () => {
    try {
      let q = supabase
        .schema('vc')
        .from('notifications')
        .update({ is_read: true, is_seen: true })
        .eq('id', notif.id);

      if (notif?.recipient_actor_id) {
        q = q.eq('recipient_actor_id', notif.recipient_actor_id);
      }
      const { error } = await q;
      if (DEBUG) {
        if (error) console.error('[vport-noti][markRead] error', error);
        else console.log('[vport-noti][markRead] ok', notif.id);
      }
    } catch (e) {
      if (DEBUG) console.error('[vport-noti][markRead] threw', e);
    }
    setSeenLocal(true);
  }, [notif?.id, notif?.recipient_actor_id]);

  const showNew = !(notif?.is_seen ?? false) && !seenLocal;

  /** Persist follow-request resolution into context */
  const persistResolution = useCallback(
    async (resolution) => {
      const newCtx = { ...ctx, resolution, resolved_at: new Date().toISOString() };

      if (DEBUG) console.log('[vport-noti][persistResolution]', { id: notif.id, newCtx });

      let q = supabase
        .schema('vc')
        .from('notifications')
        .update({ is_read: true, is_seen: true, context: newCtx })
        .eq('id', notif.id)
        .select('id, is_read, is_seen, context')
        .maybeSingle();

      if (notif?.recipient_actor_id) {
        q = q.eq('recipient_actor_id', notif.recipient_actor_id);
      }

      const { data, error } = await q;
      if (error) {
        if (DEBUG) console.error('[vport-noti][persistResolution] error', error);
        throw error;
      }
      if (DEBUG) console.log('[vport-noti][persistResolution] updated', data);
      return data;
    },
    [ctx, notif?.id, notif?.recipient_actor_id]
  );

  // ───────────── FOLLOW REQUEST (to VPORT)
  if (kind === 'follow_request') {
    const requesterAuthId = ctx?.requester_auth_id || sender?.id || null;

    const goToRequesterProfile = () => {
      if (sender?.type === 'vport') {
        if (sender?.slug) navigate(`/vport/slug/${sender.slug}`);
        else navigate(`/vport/${sender.id}`);
      } else if (sender?.username) {
        navigate(`/u/${sender.username}`);
      } else if (sender?.id) {
        navigate(`/profile/${sender.id}`);
      }
    };

    const handleAccept = async (e) => {
      e?.stopPropagation?.();
      if (!requesterAuthId) return toast.error('Missing requester id.');
      setLocalDecision('accepted');
      setBusy(true);
      await markRead();
      try {
        // TODO: call your accept follow request action for vports here
        await persistResolution('accepted');
        toast.success('Request accepted');
      } catch (err) {
        setLocalDecision(null);
        toast.error(err?.message || 'Failed to accept.');
        if (DEBUG) console.error('[vport-noti] accept error', err);
      } finally {
        setBusy(false);
      }
    };

    const handleDecline = async (e) => {
      e?.stopPropagation?.();
      if (!requesterAuthId) return toast.error('Missing requester id.');
      setLocalDecision('declined');
      setBusy(true);
      await markRead();
      try {
        // TODO: call your decline follow request action for vports here
        await persistResolution('declined');
        toast('Declined');
      } catch (err) {
        setLocalDecision(null);
        toast.error(err?.message || 'Failed to decline.');
        if (DEBUG) console.error('[vport-noti] decline error', err);
      } finally {
        setBusy(false);
      }
    };

    if (decision === 'accepted') {
      return (
        <li className="bg-neutral-800 p-3 rounded-lg shadow">
          <div className="text-sm">✅ You’re connected! Let’s grow your VPORT audience.</div>
          <div className="text-xs text-neutral-400">
            {notif?.created_at ? new Date(notif.created_at).toLocaleString() : ''}
          </div>
        </li>
      );
    }
    if (decision === 'declined') {
      return (
        <li className="bg-neutral-800 p-3 rounded-lg shadow">
          <div className="text-sm">🚫 Follow request declined.</div>
          <div className="text-xs text-neutral-400">
            {notif?.created_at ? new Date(notif.created_at).toLocaleString() : ''}
          </div>
        </li>
      );
    }

    return (
      <li
        className="bg-neutral-800 p-3 rounded-lg shadow flex justify-between items-center"
        aria-label="Follow request"
      >
        <div>
          <div className="text-sm">👥 <ActorInline /> requested to follow this VPORT</div>
          <div className="text-xs text-neutral-400">
            {notif?.created_at ? new Date(notif.created_at).toLocaleString() : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={busy}
            onClick={handleAccept}
            className="px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:opacity-90 disabled:opacity-60"
          >
            Accept
          </button>
          <button
            disabled={busy}
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/60 disabled:opacity-60"
          >
            Decline
          </button>
          {showNew && <NewBadge />}
        </div>
      </li>
    );
  }

  // ───────────── FOLLOW REQUEST ACCEPTED
  if (kind === 'follow_request_accepted') {
    const goToProfile = async () => {
      await markRead();
      if (sender?.type === 'vport') {
        if (sender?.slug) navigate(`/vport/slug/${sender.slug}`);
        else navigate(`/vport/${sender.id}`);
      } else if (sender?.username) {
        navigate(`/u/${sender.username}`);
      } else if (sender?.id) {
        navigate(`/profile/${sender.id}`);
      }
    };

    return (
      <li
        role="button"
        tabIndex={0}
        onClick={goToProfile}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goToProfile();
          }
        }}
        className="bg-neutral-800 p-3 rounded-lg shadow hover:bg-neutral-700 cursor-pointer flex justify-between items-center"
      >
        <div>
          <div className="text-sm">✅ <ActorInline /> accepted your follow request</div>
          <div className="text-xs text-neutral-400">
            {notif?.created_at ? new Date(notif.created_at).toLocaleString() : ''}
          </div>
        </div>
        {showNew && <NewBadge />}
      </li>
    );
  }

  // ───────────── Other kinds
  const qty2 = qty;
  const preview2 = preview;

  let message;
  if (isCommentLike) {
    message = (
      <>
        {emojiMap.comment_like} <ActorInline /> loved your comment
        {preview2 ? <>: <span className="italic text-white/80">“{preview2}”</span></> : null}
      </>
    );
  } else {
    switch (kind) {
      case 'like':
      case 'post_like':
        message = <>{emojiMap.like} <ActorInline /> liked your post</>;
        break;
      case 'dislike':
      case 'post_dislike':
        message = <>{emojiMap.dislike} <ActorInline /> disliked your post</>;
        break;
      case 'rose':
      case 'post_rose': {
        const s = qty2 > 1 ? 'roses' : 'rose';
        message = <>{emojiMap.rose} <ActorInline /> sent you {qty2} {s}</>;
        break;
      }
      case 'post_reaction': {
        const reactionType =
          ctx?.reaction_type ?? ctx?.reaction ?? ctx?.type ?? ctx?.name ?? null;

        if (reactionType === 'like') {
          message = <>{emojiMap.like} <ActorInline /> liked your post</>;
        } else if (reactionType === 'dislike') {
          message = <>{emojiMap.dislike} <ActorInline /> disliked your post</>;
        } else {
          const ico = emojiMap[reactionType] || fallbackIcon;
          message = <>{ico} <ActorInline /> reacted to your post</>;
        }
        break;
      }
      case 'story_reaction': {
        const reactionType =
          ctx?.reaction_type ?? ctx?.reaction ?? ctx?.type ?? ctx?.name ?? null;

        if (reactionType === 'like') {
          message = <>{emojiMap.like} <ActorInline /> liked your story</>;
        } else if (reactionType === 'dislike') {
          message = <>{emojiMap.dislike} <ActorInline /> disliked your story</>;
        } else {
          const ico = emojiMap[reactionType] || fallbackIcon;
          message = <>{ico} <ActorInline /> reacted to your story</>;
        }
        break;
      }
      case 'follow':
        message = <>👤 <ActorInline /> followed this VPORT</>;
        break;
      case 'message': {
        const text = ctx?.message_preview || 'Sent a message';
        message = <>📨 <ActorInline /> {text}</>;
        break;
      }
      case 'comment': {
        const target = objectType === 'post_comment' ? 'your comment' : 'your post';
        message = (
          <>
            💬 <ActorInline /> commented on {target}
            {preview2 ? <>: <span className="italic text-white/80">“{preview2}”</span></> : null}
          </>
        );
        break;
      }
      case 'reply':
        message = (
          <>
            💬 <ActorInline /> replied to your comment
            {preview2 ? <>: <span className="italic text-white/80">“{preview2}”</span></> : null}
          </>
        );
        break;
      case 'post_reported':
      case 'post_report':
      case 'report_post': {
        const reason = ctx?.reason || ctx?.report_reason || null;
        message = (
          <>
            🚩 <ActorInline /> reported your post
            {reason ? <>: <span className="italic text-white/80">“{reason}”</span></> : null}
          </>
        );
        break;
      }
      default:
        message = <>{fallbackIcon} <ActorInline /> sent a notification</>;
    }
  }

  const handleActivate = async () => {
    // Optimistically hide "New"; the parent may also update / navigate.
    setSeenLocal(true);
    await markRead();
    onClick?.(notif);
  };

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
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

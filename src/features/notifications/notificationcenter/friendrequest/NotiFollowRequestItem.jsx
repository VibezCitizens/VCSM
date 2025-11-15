// src/features/notifications/notificationcenter/friendrequest/NotiFollowRequestItem.jsx
// (instrumented for debugging only — no behavior changes)

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext';
import vc from '@/lib/vcClient';
import {
  acceptFollowRequest,
  declineFollowRequest,
} from '@/features/profiles/lib/friendrequest/followRequests';

const DBG = true;
const dlog = (...a) => DBG && console.debug('[NotiFollowRequestItem]', ...a);

// Resolve a user’s “user-actor” (vc.actors.profile_id = userId)
async function resolveActorIdForUser(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await vc
      .from('actors')
      .select('id')
      .eq('profile_id', userId)
      .limit(1);
    if (error) {
      dlog('resolveActorIdForUser error', error);
      return null;
    }
    const out = Array.isArray(data) && data[0]?.id ? data[0].id : null;
    dlog('resolveActorIdForUser →', { userId, actorId: out });
    return out;
  } catch (e) {
    dlog('resolveActorIdForUser exception', e);
    return null;
  }
}

export default function NotiFollowRequestItem({ notification, onResolved /* unused but kept */ }) {
  const n = notification || {};
  const { id, created_at, context } = n;

  const requesterProfile = context?.requester || null; // profiles domain
  const requesterAuthId = context?.requester_auth_id || requesterProfile?.id || null;

  // Prefer actor id if your notification payload carries it
  const requesterActorIdFromContext = context?.requester_actor_id || null;

  const { identity } = useIdentity();
  const targetActorId = identity?.actorId || null; // approver (me) actor id

  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState(null); // 'accepted' | 'declined' | null
  const [requesterActorId, setRequesterActorId] = useState(
    requesterActorIdFromContext || null
  );

  // log mount state
  useEffect(() => {
    dlog('mount', {
      notificationId: id,
      created_at,
      requesterAuthId,
      requesterActorIdFromContext,
      targetActorId,
      context,
    });
  }, []); // eslint-disable-line

  // Resolve requester actor id if not provided in the context
  useEffect(() => {
    let alive = true;
    (async () => {
      dlog('resolve-actor effect', { requesterAuthId, requesterActorIdFromContext, targetActorId });
      if (requesterActorIdFromContext) {
        if (alive) setRequesterActorId(requesterActorIdFromContext);
        return;
      }
      if (!requesterActorId && requesterAuthId) {
        const aId = await resolveActorIdForUser(requesterAuthId);
        if (alive) setRequesterActorId(aId);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requesterActorIdFromContext, requesterAuthId]);

  const markSeen = useCallback(async () => {
    try {
      dlog('markSeen → notifications.update', { id });
      const { data, error } = await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_read: true, is_seen: true })
        .eq('id', id)
        .select('id,is_read,is_seen,recipient_actor_id');
      dlog('markSeen: result', { data, error });
      window.dispatchEvent?.(new Event('noti:refresh'));
    } catch (e) {
      dlog('markSeen error (non-blocking)', e);
    }
  }, [id]);

  const refreshCountersSoon = () => {
    dlog('dispatch refresh events');
    window.dispatchEvent?.(new Event('friendreq:changed'));
    window.dispatchEvent?.(new Event('follow:changed'));
    window.dispatchEvent?.(new Event('noti:refresh'));
  };

  const handleAccept = async () => {
    if (busy) return;
    if (!requesterAuthId) return toast.error('Missing requester id.');
    if (!targetActorId) return toast.error('Your actor isn’t ready yet.');
    if (!requesterActorId) return toast.error('Requester actor not resolved yet.');

    try {
      setBusy(true);
      dlog('ACCEPT click', { requesterAuthId, requesterActorId, targetActorId, notificationId: id });

      await acceptFollowRequest({
        requesterActorId,
        requesterId: requesterAuthId, // ignored by helper; here for traceability
        targetActorId,
      });

      setDecision('accepted'); // optimistic UI
      toast.success('Request accepted');

      await markSeen();
      refreshCountersSoon();
      dlog('ACCEPT done');
    } catch (e) {
      console.error(e);
      dlog('ACCEPT error', e);
      toast.error(e?.message || 'Failed to accept.');
      setDecision(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    if (busy) return;
    if (!requesterAuthId) return toast.error('Missing requester id.');
    if (!targetActorId) return toast.error('Your actor isn’t ready yet.');
    if (!requesterActorId) return toast.error('Requester actor not resolved yet.');

    try {
      setBusy(true);
      dlog('DECLINE click', { requesterAuthId, requesterActorId, targetActorId, notificationId: id });

      await declineFollowRequest({
        requesterActorId,
        requesterId: requesterAuthId, // ignored by helper; here for traceability
        targetActorId,
      });

      setDecision('declined'); // optimistic UI
      toast('Request declined');
      await markSeen();
      refreshCountersSoon();
      dlog('DECLINE done');
    } catch (e) {
      console.error(e);
      dlog('DECLINE error', e);
      toast.error(e?.message || 'Failed to decline.');
      setDecision(null);
    } finally {
      setBusy(false);
    }
  };

  // After-action neutral messages (persist during this mount)
  if (decision === 'accepted') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="text-sm">
          ✅ You’re connected! Now’s a great time to start making memories together.
        </div>
        <div className="text-xs text-neutral-400">
          {created_at ? new Date(created_at).toLocaleString() : ''}
        </div>
      </div>
    );
  }

  if (decision === 'declined') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="text-sm">
          🚫 Friendship declined. You can always create new memories with new friends.
        </div>
        <div className="text-xs text-neutral-400">
          {created_at ? new Date(created_at).toLocaleString() : ''}
        </div>
      </div>
    );
  }

  // Default (pending) view
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={requesterProfile?.photo_url || '/avatar.jpg'}
          alt=""
          className="w-10 h-10 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <div className="text-sm">
            <span className="font-medium">
              {requesterProfile?.display_name || requesterProfile?.username || 'User'}
            </span>{' '}
            requested to follow you
          </div>
          <div className="text-xs text-neutral-400">
            {created_at ? new Date(created_at).toLocaleString() : ''}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          disabled={busy || !requesterActorId}
          onClick={handleAccept}
          className="px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:opacity-90 disabled:opacity-60"
          title="Accept follow request"
        >
          Accept
        </button>
        <button
          disabled={busy || !requesterActorId}
          onClick={handleDecline}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/60 disabled:opacity-60"
          title="Decline follow request"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

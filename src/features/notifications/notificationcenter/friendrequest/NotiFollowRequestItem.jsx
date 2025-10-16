// src/features/notifications/notificationcenter/friendrequest/NotiFollowRequestItem.jsx
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  acceptFollowRequest,
  declineFollowRequest,
} from '@/features/profiles/lib/friendrequest/followRequests';

export default function NotiFollowRequestItem({ notification, onResolved /* keep prop but don't use */ }) {
  const n = notification || {};
  const { id, created_at, context } = n;

  const requesterProfile = context?.requester || null;         // profiles domain
  // If your app uses the same UUID for profiles & auth, this fallback helps
  const requesterAuthId = context?.requester_auth_id || requesterProfile?.id || null;

  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState(null); // 'accepted' | 'declined' | null

  const markSeen = useCallback(async () => {
    try {
      await supabase
        .schema('vc')
        .from('notifications')
        .update({ is_read: true, is_seen: true })
        .eq('id', id);
      window.dispatchEvent?.(new Event('noti:refresh'));
    } catch {/* non-blocking */}
  }, [id]);

  const handleAccept = async () => {
    if (busy) return;
    if (!requesterAuthId) return toast.error('Missing requester id.');
    try {
      setBusy(true);
      await acceptFollowRequest({ requesterId: requesterAuthId });
      setDecision('accepted');              // optimistic UI
      toast.success('Request accepted');
      await markSeen();
      // Keep card visible
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Failed to accept.');
      setDecision(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    if (busy) return;
    if (!requesterAuthId) return toast.error('Missing requester id.');
    try {
      setBusy(true);
      await declineFollowRequest({ requesterId: requesterAuthId });
      setDecision('declined');              // optimistic UI
      toast('Request declined');
      await markSeen();
      // Keep card visible
    } catch (e) {
      console.error(e);
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
          disabled={busy}
          onClick={handleAccept}
          className="px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:opacity-90 disabled:opacity-60"
          title="Accept follow request"
        >
          Accept
        </button>
        <button
          disabled={busy}
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

// src/features/settings/components/pendingrequest/PendingRequestItem.jsx
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  acceptFollowRequest,
  declineFollowRequest,
} from '@/features/profiles/lib/friendrequest/followRequests';
import UserLink from '@/components/UserLink';

export default function PendingRequestItem({ item, onChanged }) {
  const [busy, setBusy] = useState(false);
  const p = item?.requesterProfile;

  const onAccept = useCallback(async () => {
    try {
      setBusy(true);
      await acceptFollowRequest({ requesterId: item.requesterAuthId });
      toast.success('Request accepted');
      onChanged?.();
    } catch (e) {
      toast.error(e?.message || 'Failed to accept.');
    } finally {
      setBusy(false);
    }
  }, [item?.requesterAuthId, onChanged]);

  const onDecline = useCallback(async () => {
    try {
      setBusy(true);
      await declineFollowRequest({ requesterId: item.requesterAuthId });
      toast('Declined');
      onChanged?.();
    } catch (e) {
      toast.error(e?.message || 'Failed to decline.');
    } finally {
      setBusy(false);
    }
  }, [item?.requesterAuthId, onChanged]);

  return (
    <li className="flex items-center justify-between px-3 py-2 bg-neutral-900/40 hover:bg-neutral-900/70">
      <div className="min-w-0">
        <UserLink user={p || { id: item.requesterAuthId }} avatarSize="w-8 h-8" textSize="text-sm" />
        <div className="text-xs text-zinc-400">
          Requested {new Date(item.createdAt).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:opacity-90 disabled:opacity-60"
          title="Accept follow request"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/60 disabled:opacity-60"
          title="Decline follow request"
        >
          Decline
        </button>
      </div>
    </li>
  );
}

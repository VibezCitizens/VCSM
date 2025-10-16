// src/features/notificationcenter/FriendRequestNotifications.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  listMyFriendRequests,
  respondFriendRequest, // 'accept' | 'decline'
  cancelFriendRequest,  // cancel a pending request I sent
} from '@/utils/social';
import { supabase } from '@/lib/supabaseClient';

export default function FriendRequestNotifications({ onCountChange }) {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  // whoami
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMe(data?.user?.id || null);
    })();
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const raw = await listMyFriendRequests();

      // fetch display for both sides
      const userIds = Array.from(
        new Set(raw.flatMap(r => [r.requester_id, r.addressee_id]).filter(Boolean))
      );

      let profilesById = {};
      if (userIds.length) {
        const { data: profs, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, photo_url')
          .in('id', userIds);

        if (!error && profs) {
          profilesById = profs.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      // decorate for UI
      const data = raw.map(r => {
        const requester = profilesById[r.requester_id] || null;
        const addressee = profilesById[r.addressee_id] || null;
        const incoming = me && r.addressee_id === me; // someone sent to me
        const outgoing = me && r.requester_id === me; // I sent to someone
        return { ...r, _requester: requester, _addressee: addressee, _incoming: !!incoming, _outgoing: !!outgoing };
      });

      setItems(data);

      // update badge count
      const pendingCount = data.filter(d => d.status === 'pending').length;
      onCountChange?.(pendingCount);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  }, [me, onCountChange]);

  useEffect(() => {
    if (me !== null) load();
  }, [me, load]);

  async function handleAccept(req) {
    setBusyId(req.id);
    try {
      await respondFriendRequest(req.id, 'accept');
      toast.success('Friend request accepted');
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to accept');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(req) {
    setBusyId(req.id);
    try {
      await respondFriendRequest(req.id, 'decline');
      toast('Declined', { icon: '🫥' });
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to decline');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(req) {
    setBusyId(req.id);
    try {
      await cancelFriendRequest(req.addressee_id);
      toast('Canceled', { icon: '🗑️' });
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to cancel');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="text-neutral-400 text-xs">Loading…</div>;
  }

  if (!items.length) {
    return (
      <div className="text-neutral-500 text-xs">
        No friend requests.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((r) => {
        const isPending = r.status === 'pending';
        const isBusy = busyId === r.id;

        // choose who to show on the left
        const actor = r._incoming ? r._requester : r._addressee;
        const actorName =
          actor?.display_name || actor?.username || (r._incoming ? r.requester_id : r.addressee_id);
        const actorHref = actor?.username ? `/u/${actor.username}` : (actor?.id ? `/profile/${actor.id}` : '#');

        const line =
          r._incoming
            ? 'sent you a friend request'
            : r._outgoing
              ? 'you sent a friend request'
              : 'friend request';

        return (
          <li key={r.id} className="rounded-xl bg-neutral-800 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              {/* Left: avatar + text */}
              <div className="flex items-start gap-2">
                <Link
                  to={actorHref}
                  className="shrink-0"
                  onClick={(e) => actorHref === '#' && e.preventDefault()}
                >
                  <img
                    src={actor?.photo_url || '/avatar.jpg'}
                    alt={actorName}
                    className="w-7 h-7 rounded object-cover border border-neutral-700"
                  />
                </Link>

                <div className="text-xs">
                  <div className="text-white"> {/* ← always white */}
                    <Link
                      to={actorHref}
                      className="hover:underline text-white"
                      onClick={(e) => actorHref === '#' && e.preventDefault()}
                    >
                      {actorName}
                    </Link>{' '}
                    {line}
                  </div>

                  {r.message && (
                    <div className="text-neutral-400 mt-0.5 break-words">“{r.message}”</div>
                  )}

                  {!isPending && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-200">
                      {r.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1 shrink-0">
                {isPending && (
                  r._incoming ? (
                    <>
                      <button
                        disabled={isBusy}
                        onClick={() => handleAccept(r)}
                        className={`px-2 py-0.5 rounded text-xs bg-purple-600 text-white hover:bg-purple-700 ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        Accept
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => handleDecline(r)}
                        className={`px-2 py-0.5 rounded text-xs bg-neutral-700 text-white hover:bg-neutral-600 ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        Decline
                      </button>
                    </>
                  ) : r._outgoing && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleCancel(r)}
                      className={`px-2 py-0.5 rounded text-xs bg-neutral-700 text-white hover:bg-neutral-600 ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                      title="Cancel request I sent"
                    >
                      Cancel
                    </button>
                  )
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

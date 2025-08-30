import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  listMyFriendRequests,
  respondFriendRequest, // action: 'accept' | 'decline'
  cancelFriendRequest, // cancel a pending request I sent
} from '@/utils/social';

export default function FriendRequestInbox() {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listMyFriendRequests(); // now narrowed to "mine"
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    // cancel a request I sent to someone else
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

  if (loading) return <div className="text-neutral-400 text-sm">Loading requests…</div>;

  if (!items.length) {
    return (
      <div className="text-neutral-500 text-sm">
        No friend requests.
        <button onClick={load} className="ml-2 text-purple-400 hover:underline" type="button">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((r) => {
        const isPending = r.status === 'pending';
        const isBusy = busyId === r.id;

        return (
          <div key={r.id} className="border border-neutral-800 rounded-xl p-3 bg-neutral-900">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">
                <div className="text-neutral-200">
                  <span className="opacity-70">From:</span> {r.requester_id}
                </div>
                <div className="text-neutral-200">
                  <span className="opacity-70">To:</span> {r.addressee_id}
                </div>
                {r.message && (
                  <div className="text-neutral-400 text-xs mt-1 break-words">
                    “{r.message}”
                  </div>
                )}
                <div className="text-xs mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                    {r.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isPending ? (
                  <>
                    <button
                      disabled={isBusy}
                      onClick={() => handleAccept(r)}
                      className={`px-3 py-1 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700 ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      Accept
                    </button>
                    <button
                      disabled={isBusy}
                      onClick={() => handleDecline(r)}
                      className={`px-3 py-1 rounded-lg text-sm bg-neutral-800 text-white hover:bg-neutral-700 ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      Decline
                    </button>
                    <button
                      disabled={isBusy}
                      onClick={() => handleCancel(r)}
                      className={`px-3 py-1 rounded-lg text-sm bg-neutral-800 text-white hover:bg-neutral-700 ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                      title="Cancel request I sent"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={load}
                    className="px-3 py-1 rounded-lg text-sm bg-neutral-800 text-white hover:bg-neutral-700"
                  >
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

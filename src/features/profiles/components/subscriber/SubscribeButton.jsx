// C:\Users\vibez\OneDrive\Desktop\no src\src\features\profiles\components\subscriber\SubscribeButton.jsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useBlockStatus } from '@/features/profiles/hooks/useBlockStatus';
import toast from 'react-hot-toast';
import {
  getFollowRequestStatus,
  createFollowRequest,
  cancelFollowRequest,
} from '@/features/profiles/lib/friendrequest/followRequests';

/**
 * SubscribeButton (unified)
 *
 * Public profile:
 *  - "Subscribe"  -> upsert into vc.followers (instant)
 *  - "Subscribed" -> delete from vc.followers
 *
 * Private profile:
 *  - Not following & no pending -> "Follow" (creates follow_requests row status='pending')
 *  - Pending -> "Requested" (tap to cancel)
 *  - Once owner accepts (followers row exists) -> button shows "Subscribed"
 */
// C:\Users\vibez\OneDrive\Desktop\no src\src\features\profiles\components\subscriber\SubscribeButton.jsx

// ...imports stay the same...

export default function SubscribeButton({
  targetId,
  initialSubscribed,
  onToggle,
  size = 'md',
  className = '',
  profileIsPrivate = false,
}) {
  const { user } = useAuth();
  const me = user?.id || null;

  const { anyBlock, loading: blockLoading } = useBlockStatus(targetId);

  const [subscribed, setSubscribed] = useState(!!initialSubscribed);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!!initialSubscribed);

  // Only used for private profiles
  const [pending, setPending] = useState(false);

  // reflect prop changes
  useEffect(() => {
    setSubscribed(!!initialSubscribed);
    setLoaded(!!initialSubscribed);
  }, [initialSubscribed]);

  // size styles
  const sizeClass = useMemo(() => {
    switch (size) {
      case 'xs': return 'px-2 py-1 text-xs rounded-md';
      case 'sm': return 'px-3 py-1.5 text-sm rounded-lg';
      default:   return 'px-4 py-2 text-sm rounded-lg';
    }
  }, [size]);

  // Check current follow state
  useEffect(() => {
    if (!me || !targetId || me === targetId || loaded) return;
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .schema('vc')
          .from('followers')
          .select('is_active')
          .eq('follower_id', me)
          .eq('followed_id', targetId)
          .maybeSingle();
        if (!alive) return;
        if (error && error.code !== 'PGRST116') throw error;
        setSubscribed(!!data?.is_active);
      } catch {
        // ignore
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, [me, targetId, loaded]);

  // For private profiles, check pending request status
  useEffect(() => {
    if (!profileIsPrivate || !me || !targetId || me === targetId) {
      setPending(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const status = await getFollowRequestStatus({ requesterId: me, targetId });
        if (!alive) return;
        setPending(status === 'pending');
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, [profileIsPrivate, me, targetId]);

  const disabled = !me || !targetId || me === targetId || blockLoading || anyBlock || busy;

  // === Direct subscribe/unsubscribe ===
  const doDirectSubscribe = useCallback(async () => {
    if (disabled || subscribed || profileIsPrivate) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .schema('vc')
        .from('followers')
        .upsert(
          { follower_id: me, followed_id: targetId, is_active: true },
          { onConflict: 'followed_id,follower_id' }
        );
      if (error) throw error;
      setSubscribed(true);
      onToggle?.(true);
      toast.success('Subscribed');
    } catch (e) {
      const msg = e?.message || 'Subscribe failed';
      if (/row-level security|RLS|permission/i.test(msg)) {
        toast.error('This profile is private — request follow first.');
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }, [disabled, subscribed, profileIsPrivate, me, targetId, onToggle]);

  const doDirectUnsubscribe = useCallback(async () => {
    if (disabled || !subscribed) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .schema('vc')
        .from('followers')
        .delete()
        .match({ follower_id: me, followed_id: targetId });
      if (error) throw error;
      setSubscribed(false);
      onToggle?.(false);
      toast.success('Unsubscribed');
    } catch (e) {
      toast.error(e?.message || 'Unsubscribe failed');
    } finally {
      setBusy(false);
    }
  }, [disabled, subscribed, me, targetId, onToggle]);

  // === Private profile request flow ===
  const sendRequest = useCallback(async () => {
    if (disabled || subscribed || pending || !profileIsPrivate) return;
    setBusy(true);
    try {
      await createFollowRequest({ targetId });
      setPending(true);
      toast.success('Follow request sent.');
    } catch (e) {
      console.error(e);
      const msg = /foreign key|violates foreign/i.test(e?.message || '')
        ? 'Request failed: wrong target id domain (needs auth.users.id).'
        : (e?.message || 'Failed to send request.');
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [disabled, subscribed, pending, profileIsPrivate, targetId]);

  const cancelRequest = useCallback(async () => {
    if (disabled || !pending) return;
    setBusy(true);
    try {
      await cancelFollowRequest({ targetId });
      setPending(false);
      toast('Request cancelled.');
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Failed to cancel.');
    } finally {
      setBusy(false);
    }
  }, [disabled, pending, targetId]);

  // === Label logic ===
  let label = '...';
  if (!loaded || blockLoading) label = '...';
  else if (anyBlock) label = 'Unavailable';
  else if (subscribed) label = 'Subscribed';
  else if (profileIsPrivate) label = pending ? 'Pending' : 'Subscribe'; // 👈 updated
  else label = 'Subscribe';

  // === Styles remain unchanged ===
  const intentClass = anyBlock
    ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
    : subscribed
      ? 'bg-zinc-200 text-black hover:bg-zinc-100'
      : profileIsPrivate
        ? (pending
            ? 'bg-black/40 text-white border border-white/10 hover:bg-black/60'
            : 'bg-white text-black hover:opacity-90')
        : 'bg-white text-black hover:opacity-90';

  const onClick = () => {
    if (disabled) return;
    if (anyBlock) return;

    if (subscribed) return doDirectUnsubscribe();

    if (profileIsPrivate) {
      return pending ? cancelRequest() : sendRequest();
    }

    return doDirectSubscribe();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${sizeClass} ${intentClass} transition ${className}`}
      title={
        anyBlock
          ? 'Unavailable due to block'
          : me === targetId
            ? 'This is you'
            : subscribed
              ? 'Unsubscribe'
              : profileIsPrivate
                ? (pending ? 'Cancel follow request' : 'Send follow request')
                : 'Subscribe'
      }
    >
      {busy ? (profileIsPrivate && pending ? 'Cancelling…' : 'Working…') : label}
    </button>
  );
}

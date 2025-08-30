// src/components/SocialButtons.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  followUser,
  unfollowUser,
  isFollowing,
  sendFriendRequest,
  cancelFriendRequest,
  respondFriendRequest,
} from '@/utils/social';
import { supabase } from '@/lib/supabaseClient';

export default function SocialButtons({
  targetUserId,
  className = '',
  showFriendRequest = true,
  followLabels = { on: 'Unfollow', off: 'Follow' },
  friendLabel = 'Add Friend',
  onChange,
}) {
  const { user } = useAuth();
  const me = user?.id ?? null;

  const [authReady, setAuthReady] = useState(false);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  // friend request state: none | outgoing | incoming | friends
  const [frState, setFrState] = useState('none');
  const [incomingId, setIncomingId] = useState(null);
  const [outgoingId, setOutgoingId] = useState(null);

  useEffect(() => {
    setAuthReady(user !== undefined);
  }, [user]);

  const disabledReason = useMemo(() => {
    if (!authReady) return 'Loading session…';
    if (!targetUserId) return 'No target user id';
    if (!me) return 'You must be logged in';
    if (me === targetUserId) return 'Cannot follow yourself';
    return '';
  }, [authReady, me, targetUserId]);

  const disabled = !!disabledReason || busy;

  // ---------- helpers ----------
  const loadFollowState = useCallback(async () => {
    if (!authReady || !targetUserId || !me || me === targetUserId) {
      setFollowing(false);
      return;
    }
    try {
      const f = await isFollowing(targetUserId);
      setFollowing(!!f);
    } catch (err) {
      console.warn('isFollowing error:', err);
    }
  }, [authReady, targetUserId, me]);

  const loadFriendState = useCallback(async () => {
    if (!authReady || !me || !targetUserId || me === targetUserId) {
      setFrState('none');
      setIncomingId(null);
      setOutgoingId(null);
      return;
    }
    try {
      // ordered pair lookup
      const a = me < targetUserId ? me : targetUserId;
      const b = me < targetUserId ? targetUserId : me;

      const f = await supabase
        .from('friends')
        .select('user_a, user_b')
        .eq('user_a', a)
        .eq('user_b', b)
        .maybeSingle();

      if (f.data) {
        setFrState('friends');
        setIncomingId(null);
        setOutgoingId(null);
        return;
      }

      const out = await supabase
        .from('friend_requests')
        .select('id')
        .eq('requester_id', me)
        .eq('addressee_id', targetUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (out.data?.id) {
        setFrState('outgoing');
        setOutgoingId(out.data.id);
        setIncomingId(null);
        return;
      }

      const inc = await supabase
        .from('friend_requests')
        .select('id')
        .eq('requester_id', targetUserId)
        .eq('addressee_id', me)
        .eq('status', 'pending')
        .maybeSingle();

      if (inc.data?.id) {
        setFrState('incoming');
        setIncomingId(inc.data.id);
        setOutgoingId(null);
        return;
      }

      setFrState('none');
      setIncomingId(null);
      setOutgoingId(null);
    } catch (e) {
      console.warn('loadFriendState error:', e);
      setFrState('none');
      setIncomingId(null);
      setOutgoingId(null);
    }
  }, [authReady, me, targetUserId]);

  useEffect(() => {
    loadFollowState();
    loadFriendState();
  }, [loadFollowState, loadFriendState]);

  // ---------- follow toggle ----------
  const toggleFollow = useCallback(async () => {
    if (disabled) {
      if (disabledReason) toast.error(disabledReason);
      return;
    }
    setBusy(true);
    const prev = following;
    const next = !prev;

    // optimistic flip + bubble to parent for +1/-1
    setFollowing(next);
    onChange?.(next);

    try {
      if (prev) {
        const ok = await unfollowUser(targetUserId);
        if (!ok) throw new Error('Unfollow failed');
        toast.success('Unfollowed');
      } else {
        const ok = await followUser(targetUserId);
        if (!ok) throw new Error('Follow failed');
        toast.success('Following');
      }
    } catch (err) {
      console.error('toggleFollow error:', err);
      // rollback UI + parent counter
      setFollowing(prev);
      onChange?.(prev);

      const msg = err?.message || '';
      if (/policy|rls|permission|not allowed/i.test(msg)) {
        toast.error('Blocked by RLS policy. Check followers insert/delete policies.');
      } else {
        toast.error(msg || 'Action failed');
      }
    } finally {
      setBusy(false);
    }
  }, [disabled, disabledReason, following, targetUserId, onChange]);

  // ---------- friend button actions ----------
  const handleFriendAction = useCallback(async () => {
    if (!showFriendRequest) return;
    if (disabled) {
      if (disabledReason) toast.error(disabledReason);
      return;
    }

    setBusy(true);
    try {
      if (frState === 'none') {
        const id = await sendFriendRequest(targetUserId, null);
        if (id) {
          toast.success('Friend request sent');
          setFrState('outgoing');
          setOutgoingId(id);
          setIncomingId(null);
        } else {
          await loadFriendState();
          toast('Already requested or friends', { icon: '👋' });
        }
        return;
      }

      if (frState === 'outgoing') {
        await cancelFriendRequest(targetUserId);
        toast('Canceled', { icon: '🗑️' });
        setFrState('none');
        setOutgoingId(null);
        return;
      }

      if (frState === 'incoming' && incomingId) {
        await respondFriendRequest(incomingId, 'accept');
        toast.success('You are now friends');
        setFrState('friends');
        setIncomingId(null);
        setOutgoingId(null);
        return;
      }

      if (frState === 'friends') {
        toast('You are already friends', { icon: '😊' });
      }
    } catch (err) {
      console.error('friend action error:', err);
      toast.error(err?.message || 'Action failed');
      await loadFriendState();
    } finally {
      setBusy(false);
    }
  }, [showFriendRequest, disabled, disabledReason, frState, incomingId, targetUserId, loadFriendState]);

  if (!targetUserId) return null;

  let friendBtnText = friendLabel;
  if (frState === 'outgoing') friendBtnText = 'Cancel Request';
  if (frState === 'incoming') friendBtnText = 'Accept Request';
  if (frState === 'friends') friendBtnText = 'Friends';

  const friendBtnDisabled = disabled || frState === 'friends';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Follow / Unfollow */}
      <button
        type="button"
        onClick={toggleFollow}
        disabled={disabled}
        title={disabledReason || ''}
        className={`px-4 py-1 rounded-xl text-sm transition-colors
          ${following
            ? 'bg-neutral-800 text-white hover:bg-neutral-700'
            : 'bg-purple-600 text-white hover:bg-purple-700'}
          ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
        `}
        aria-pressed={following}
        aria-label={following ? 'Unfollow user' : 'Follow user'}
      >
        {following ? followLabels.on : followLabels.off}
      </button>

      {/* Friend / Cancel / Accept */}
      {showFriendRequest && (
        <button
          type="button"
          onClick={handleFriendAction}
          disabled={friendBtnDisabled}
          title={disabledReason || ''}
          className={`px-4 py-1 rounded-xl text-sm transition-colors
            ${frState === 'outgoing'
              ? 'bg-neutral-800 text-white hover:bg-neutral-700'
              : frState === 'incoming'
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : frState === 'friends'
              ? 'bg-neutral-800 text-white'
              : 'bg-neutral-800 text-white hover:bg-neutral-700'}
            ${friendBtnDisabled ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {friendBtnText}
        </button>
      )}
    </div>
  );
}

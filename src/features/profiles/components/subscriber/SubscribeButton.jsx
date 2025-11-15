// src/features/profiles/components/subscriber/SubscribeButton.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useBlockStatus } from '@/features/profiles/hooks/useBlockStatus';
import toast from 'react-hot-toast';
import { useIdentity } from '@/state/identityContext';
import SubscribeButtonUI from '@/ui/Profile/Subscribebutton'; // 👈 NEW

const DEBUG = true;
const dlog = (...a) => DEBUG && console.debug('[SubscribeButton]', ...a);

/* ───────────────────────── Owner resolvers ─────────────────────────
   Works for both user-actors and vport-actors.
   Falls back in this order:
   1) vc.actor_owners
   2) vc.actors.profile_id (user actor → profiles.id)
   3) vc.vports.owner_user_id (vport actor)
---------------------------------------------------------------------*/
async function getOwnerUserIdForActor(actorId) {
  dlog('getOwnerUserIdForActor: start', { actorId });
  if (!actorId) return null;

  // 1) direct owners map
  try {
    const { data, error } = await supabase
      .schema('vc')
      .from('actor_owners')
      .select('user_id')
      .eq('actor_id', actorId)
      .limit(1);
    if (error) dlog('getOwnerUserIdForActor: actor_owners error (non-fatal)', error);
    const viaOwners = Array.isArray(data) && data[0]?.user_id ? data[0].user_id : null;
    if (viaOwners) {
      dlog('getOwnerUserIdForActor: via actor_owners', { userId: viaOwners });
      return viaOwners;
    }
  } catch (e) {
    dlog('getOwnerUserIdForActor: actor_owners exception (non-fatal)', e);
  }

  // 2) actor row (user actor has profile_id)
  let actorRow = null;
  try {
    const { data, error } = await supabase
      .schema('vc')
      .from('actors')
      .select('id, profile_id, vport_id')
      .eq('id', actorId)
      .limit(1);
    if (error) dlog('getOwnerUserIdForActor: actors error (non-fatal)', error);
    actorRow = Array.isArray(data) && data[0] ? data[0] : null;
  } catch (e) {
    dlog('getOwnerUserIdForActor: actors exception (non-fatal)', e);
  }

  if (actorRow?.profile_id) {
    dlog('getOwnerUserIdForActor: via actors.profile_id (user actor)', {
      userId: actorRow.profile_id,
    });
    return actorRow.profile_id;
  }

  // 3) vport fallback
  if (actorRow?.vport_id) {
    try {
      const { data, error } = await supabase
        .schema('vc')
        .from('vports')
        .select('owner_user_id')
        .eq('id', actorRow.vport_id)
        .limit(1);
      if (error) dlog('getOwnerUserIdForActor: vports error (non-fatal)', error);
      const ownerUserId = Array.isArray(data) && data[0]?.owner_user_id ? data[0].owner_user_id : null;
      if (ownerUserId) {
        dlog('getOwnerUserIdForActor: via vports.owner_user_id (vport actor)', { userId: ownerUserId });
        return ownerUserId;
      }
    } catch (e) {
      dlog('getOwnerUserIdForActor: vports exception (non-fatal)', e);
    }
  }

  dlog('getOwnerUserIdForActor: result', { userId: null });
  return null;
}

async function hasPendingFollowRequest(requesterActorId, targetActorId) {
  dlog('hasPendingFollowRequest: start', { requesterActorId, targetActorId });
  if (!requesterActorId || !targetActorId) return false;
  const { data, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .select('requester_actor_id, status')
    .eq('requester_actor_id', requesterActorId)
    .eq('target_actor_id', targetActorId)
    .in('status', ['pending'])
    .limit(1);
  if (error) {
    dlog('hasPendingFollowRequest: error', error);
    throw error;
  }
  const pending = Array.isArray(data) && !!data[0];
  dlog('hasPendingFollowRequest: result', { pending });
  return pending;
}

async function createFollowRequestActor(requesterActorId, targetActorId) {
  dlog('createFollowRequestActor: start', { requesterActorId, targetActorId });
  if (!requesterActorId || !targetActorId) throw new Error('Missing actor ids');

  const [requesterUserId, targetUserId] = await Promise.all([
    getOwnerUserIdForActor(requesterActorId),
    getOwnerUserIdForActor(targetActorId),
  ]);
  dlog('createFollowRequestActor: owner resolution', { requesterUserId, targetUserId });

  if (!requesterUserId || !targetUserId) {
    throw new Error('Could not resolve owners for actors to fill requester_id/target_id.');
  }

  const payload = {
    requester_id: requesterUserId,
    target_id: targetUserId,
    requester_actor_id: requesterActorId,
    target_actor_id: targetActorId,
    status: 'pending',
  };
  dlog('createFollowRequestActor: upsert payload', payload);

  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .upsert(payload, { onConflict: 'requester_id,target_id' });
  if (error) {
    dlog('createFollowRequestActor: error', error);
    throw error;
  }
  dlog('createFollowRequestActor: success');
}

async function cancelFollowRequestActor(requesterActorId, targetActorId) {
  dlog('cancelFollowRequestActor: start', { requesterActorId, targetActorId });
  if (!requesterActorId || !targetActorId) throw new Error('Missing actor ids');

  const [requesterUserId, targetUserId] = await Promise.all([
    getOwnerUserIdForActor(requesterActorId),
    getOwnerUserIdForActor(targetActorId),
  ]);
  dlog('cancelFollowRequestActor: owner resolution', { requesterUserId, targetUserId });

  if (!requesterUserId || !targetUserId) {
    dlog('cancelFollowRequestActor: skip (no owners)');
    return;
  }

  const match = {
    requester_id: requesterUserId,
    target_id: targetUserId,
    status: 'pending',
  };
  dlog('cancelFollowRequestActor: update match', match);

  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({ status: 'cancelled' })
    .match(match);
  if (error) {
    dlog('cancelFollowRequestActor: error', error);
    throw error;
  }
  dlog('cancelFollowRequestActor: success');
}

/* ─────────────────────────── Component ──────────────────────────── */
export default function SubscribeButton({
  targetId,            // public.profiles.id (for user actors)
  targetActorId,       // vc.actors.id (preferred if available)
  initialSubscribed,
  onToggle,
  size = 'md',
  className = '',
  profileIsPrivate = false,
}) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const myActorId = identity?.actorId || null;

  const { anyBlock, loading: blockLoading } = useBlockStatus(targetId);

  const [resolvedTargetActorId, setResolvedTargetActorId] = useState(targetActorId || null);
  const [targetIsUserActor, setTargetIsUserActor] = useState(true);
  const [subscribed, setSubscribed] = useState(!!initialSubscribed);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!!initialSubscribed);
  const [pending, setPending] = useState(false);

  const pollRef = useRef(null); // interval id while Pending

  // snapshot
  useEffect(() => {
    dlog('mount/props', {
      targetId,
      targetActorIdFromProp: targetActorId ?? null,
      initialSubscribed: !!initialSubscribed,
      profileIsPrivate,
      userId: user?.id ?? null,
      myActorId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dlog('identity update', { identity, myActorId });
  }, [identity, myActorId]);

  useEffect(() => {
    setSubscribed(!!initialSubscribed);
    setLoaded(!!initialSubscribed);
    dlog('effect: initialSubscribed applied', {
      initialSubscribed: !!initialSubscribed,
      subscribed: !!initialSubscribed,
      loaded: !!initialSubscribed,
    });
  }, [initialSubscribed]);

  // Resolve target actor
  useEffect(() => {
    let alive = true;
    (async () => {
      if (targetActorId) {
        dlog('resolve target actor: validating provided actorId', { targetActorId });
        try {
          const { data } = await supabase
            .schema('vc')
            .from('actors')
            .select('id, profile_id, vport_id')
            .eq('id', targetActorId)
            .limit(1);
          if (!alive) return;
          const row = Array.isArray(data) && data[0] ? data[0] : null;
          setResolvedTargetActorId(row?.id || targetActorId);
          setTargetIsUserActor(!!row?.profile_id && !row?.vport_id);
          dlog('resolve target actor: validated', {
            id: row?.id || targetActorId,
            isUserActor: !!row?.profile_id && !row?.vport_id,
          });
        } catch (e) {
          if (!alive) return;
          setResolvedTargetActorId(targetActorId);
          setTargetIsUserActor(true);
          dlog('resolve target actor: validation error → fallback accept', e);
        }
        return;
      }

      if (!targetId) {
        dlog('resolve target actor: skip (no targetId and no targetActorId)');
        return;
      }

      dlog('resolve target actor: querying by profile_id', { targetId });
      try {
        const { data } = await supabase
          .schema('vc')
          .from('actors')
          .select('id, profile_id, vport_id')
          .eq('profile_id', targetId)
          .limit(1);
        if (!alive) return;
        const row = Array.isArray(data) && data[0] ? data[0] : null;
        setResolvedTargetActorId(row?.id || null);
        setTargetIsUserActor(!!row?.profile_id && !row?.vport_id);
        dlog('resolve target actor: found', {
          id: row?.id || null,
          isUserActor: !!row?.profile_id && !row?.vport_id,
        });
      } catch (e) {
        if (!alive) return;
        setResolvedTargetActorId(null);
        setTargetIsUserActor(true);
        dlog('resolve target actor: error', e);
      }
    })();
    return () => { alive = false; };
  }, [targetId, targetActorId]);

  // helper: (re)load both subscription + pending
  const refreshStates = useCallback(async () => {
    if (!myActorId || !resolvedTargetActorId) return;

    // subscribed?
    try {
      const { count } = await supabase
        .schema('vc')
        .from('actor_follows')
        .select('follower_actor_id', { head: true, count: 'exact' })
        .eq('follower_actor_id', myActorId)
        .eq('followed_actor_id', resolvedTargetActorId)
        .eq('is_active', true);
      const nextSub = (count ?? 0) > 0;
      if (nextSub !== subscribed) {
        setSubscribed(nextSub);
        dlog('refreshStates: subscribed=', nextSub, 'rawCount=', count ?? 0);
        if (nextSub) onToggle?.(true);
      }
    } catch (e) {
      dlog('refreshStates: actor_follows error (ignored)', e);
    }

    // pending?
    try {
      const p = await hasPendingFollowRequest(myActorId, resolvedTargetActorId);
      setPending(p);
      dlog('refreshStates: pending=', p);
    } catch (e) {
      dlog('refreshStates: pending error (ignored)', e);
      setPending(false);
    }

    setLoaded(true);
  }, [myActorId, resolvedTargetActorId, subscribed, onToggle]);

  // initial state load
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!myActorId || !resolvedTargetActorId || loaded) {
        dlog('load follow state: skip', { myActorId, resolvedTargetActorId, loaded });
        return;
      }
      if (myActorId === resolvedTargetActorId) {
        setSubscribed(false);
        setLoaded(true);
        dlog('load follow state: self-profile, force subscribed=false');
        return;
      }
      await refreshStates();
      if (alive) dlog('load follow state: loaded=true');
    })();
    return () => { alive = false; };
  }, [myActorId, resolvedTargetActorId, loaded, refreshStates]);

  // 🔄 focus/visibility refresh (no realtime)
  useEffect(() => {
    if (!myActorId || !resolvedTargetActorId) return;
    const onFocus = () => {
      dlog('focus/visibility refresh trigger');
      refreshStates();
    };
    window.addEventListener('focus', onFocus);
    const onVis = () => { if (!document.hidden) onFocus(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [myActorId, resolvedTargetActorId, refreshStates]);

  // ⏳ lightweight polling ONLY while Pending
  useEffect(() => {
    // clear any previous poll
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!myActorId || !resolvedTargetActorId) return;

    if (pending && !subscribed) {
      dlog('pending-poll: start');
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        dlog('pending-poll: tick', { attempts });
        await refreshStates();
        // stop conditions
        if (!pending || subscribed || attempts >= 40) { // ~40 * 2s = ~80s max
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            dlog('pending-poll: stop', { pending, subscribed, attempts });
          }
        }
      }, 2000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [pending, subscribed, myActorId, resolvedTargetActorId, refreshStates]);

  // Pending bootstrap (for private targets)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!profileIsPrivate || !myActorId || !resolvedTargetActorId || myActorId === resolvedTargetActorId) {
        if (alive) setPending(false);
        dlog('pending request: skip', { profileIsPrivate, myActorId, resolvedTargetActorId });
        return;
      }
      try {
        const p = await hasPendingFollowRequest(myActorId, resolvedTargetActorId);
        if (alive) setPending(p);
        dlog('pending request: state', { pending: p });
      } catch (e) {
        if (alive) setPending(false);
        dlog('pending request: error (set pending=false)', e);
      }
    })();
    return () => { alive = false; };
  }, [profileIsPrivate, myActorId, resolvedTargetActorId]);

  const disabled =
    !user?.id ||
    !myActorId ||
    !resolvedTargetActorId ||
    myActorId === resolvedTargetActorId ||
    blockLoading ||
    anyBlock ||
    busy;

  useEffect(() => {
    dlog('computed: disabled or guards', {
      disabled,
      reasons: {
        noUserId: !user?.id,
        noMyActorId: !myActorId,
        noResolvedTargetActorId: !resolvedTargetActorId,
        selfView: myActorId === resolvedTargetActorId,
        blockLoading,
        anyBlock,
        busy,
      },
    });
  }, [disabled, user?.id, myActorId, resolvedTargetActorId, blockLoading, anyBlock, busy]);

  const doActorFollow = useCallback(async () => {
    dlog('doActorFollow: begin', {
      disabled, subscribed, profileIsPrivate, targetIsUserActor,
      myActorId, resolvedTargetActorId,
    });
    if (disabled || subscribed) return;
    setBusy(true);
    try {
      if (profileIsPrivate && targetIsUserActor) {
        dlog('doActorFollow: creating follow REQUEST (private target)');
        await createFollowRequestActor(myActorId, resolvedTargetActorId);
        setPending(true);
        toast.success('Follow request sent.');
        dlog('doActorFollow: request sent → pending=true');
      } else {
        dlog('doActorFollow: upserting vc.actor_follows', {
          follower_actor_id: myActorId,
          followed_actor_id: resolvedTargetActorId,
          is_active: true,
        });
        const { error } = await supabase
          .schema('vc')
          .from('actor_follows')
          .upsert(
            {
              follower_actor_id: myActorId,
              followed_actor_id: resolvedTargetActorId,
              is_active: true,
            },
            { onConflict: 'follower_actor_id,followed_actor_id' }
          );
        if (error) throw error;
        setSubscribed(true);
        dlog('doActorFollow: success → subscribed=true; calling onToggle(true)');
        onToggle?.(true);
        toast.success('Subscribed');
      }
    } catch (e) {
      console.error(e);
      dlog('doActorFollow: error', e);
      toast.error(e?.message || 'Subscribe failed');
    } finally {
      setBusy(false);
      dlog('doActorFollow: end (busy=false)');
    }
  }, [disabled, subscribed, profileIsPrivate, targetIsUserActor, myActorId, resolvedTargetActorId, onToggle]);

  const doActorUnfollow = useCallback(async () => {
    dlog('doActorUnfollow: begin', {
      disabled, subscribed, myActorId, resolvedTargetActorId,
    });
    if (disabled || !subscribed) return;
    setBusy(true);
    try {
      dlog('doActorUnfollow: deleting from vc.actor_follows', {
        follower_actor_id: myActorId,
        followed_actor_id: resolvedTargetActorId,
      });
      const { error } = await supabase
        .schema('vc')
        .from('actor_follows')
        .delete()
        .match({ follower_actor_id: myActorId, followed_actor_id: resolvedTargetActorId });
      if (error) throw error;
      setSubscribed(false);
      dlog('doActorUnfollow: success → subscribed=false; calling onToggle(false)');
      onToggle?.(false);
      toast.success('Unsubscribed');
    } catch (e) {
      console.error(e);
      dlog('doActorUnfollow: error', e);
      toast.error(e?.message || 'Unsubscribe failed');
    } finally {
      setBusy(false);
      dlog('doActorUnfollow: end (busy=false)');
    }
  }, [disabled, subscribed, myActorId, resolvedTargetActorId, onToggle]);

  const cancelRequest = useCallback(async () => {
    dlog('cancelRequest: begin', { disabled, pending, myActorId, resolvedTargetActorId });
    if (disabled || !pending) return;
    setBusy(true);
    try {
      await cancelFollowRequestActor(myActorId, resolvedTargetActorId);
      setPending(false);
      toast('Request cancelled.');
      dlog('cancelRequest: success → pending=false');
    } catch (e) {
      console.error(e);
      dlog('cancelRequest: error', e);
      toast.error(e?.message || 'Failed to cancel.');
    } finally {
      setBusy(false);
      dlog('cancelRequest: end (busy=false)');
    }
  }, [disabled, pending, myActorId, resolvedTargetActorId]);

  // Label
  let label = '...';
  if (!loaded || blockLoading) label = '...';
  else if (anyBlock) label = 'Unavailable';
  else if (subscribed) label = 'Subscribed';
  else if (profileIsPrivate && targetIsUserActor) label = pending ? 'Pending' : 'Subscribe';
  else label = 'Subscribe';

  useEffect(() => {
    dlog('render: label/visual state snapshot', {
      label,
      size,
      className,
      states: { loaded, blockLoading, anyBlock, subscribed, pending, busy },
      identity: { myActorId },
      target: { resolvedTargetActorId, targetIsUserActor, profileIsPrivate },
    });
  }, [label, size, className, loaded, blockLoading, anyBlock, subscribed, pending, busy, myActorId, resolvedTargetActorId, targetIsUserActor, profileIsPrivate]);

  const onClick = () => {
    dlog('onClick: received', {
      disabled, anyBlock, profileIsPrivate, targetIsUserActor, pending, subscribed,
    });
    if (disabled) return;
    if (anyBlock) return;

    if (profileIsPrivate && targetIsUserActor) {
      dlog('onClick: private-user flow', { pending });
      return pending ? cancelRequest() : doActorFollow();
    }
    dlog('onClick: public flow', { subscribed });
    return subscribed ? doActorUnfollow() : doActorFollow();
  };

  // 🔁 Use the new UI button, keep all logic & labels
  const effectiveLabel =
    busy
      ? (profileIsPrivate && targetIsUserActor && pending ? 'Cancelling…' : 'Working…')
      : label;

  return (
    <SubscribeButtonUI
      isSubscribed={subscribed}
      disabled={disabled}
      onClick={onClick}
      label={effectiveLabel}
    />
  );
}

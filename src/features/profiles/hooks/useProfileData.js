// src/features/profile/useProfileData.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext';

/* ---------------- utils ---------------- */

function computeIsAdultFromBirthdate(birthdate) {
  try {
    if (!birthdate) return false;
    const b = new Date(birthdate);
    if (Number.isNaN(+b)) return false;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age >= 18;
  } catch {
    return false;
  }
}

const mapUserProfile = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username ?? null,
    display_name: row.display_name ?? row.username ?? 'Unnamed',
    bio: row.bio ?? '',
    photo_url: row.photo_url ?? null,
    private: !!row.private,
    kind: 'user',
  };
};

const mapVportProfile = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.slug ?? null,
    display_name: row.name ?? 'Untitled VPORT',
    bio: row.bio ?? row.description ?? '',
    photo_url: row.avatar_url ?? null,
    kind: 'vport',
  };
};

/* ---------------- helper: resolve actor ids ---------------- */

async function getActorIdForUser(userProfileId) {
  if (!userProfileId) return null;
  const { data } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', userProfileId)
    .maybeSingle();
  return data?.id ?? null;
}

async function getActorIdForVport(vportId) {
  if (!vportId) return null;
  const { data } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('vport_id', vportId)
    .maybeSingle();
  return data?.id ?? null;
}

/* ---------------- hook ---------------- */

export function useProfileData({
  urlUsername,
  urlUserId,
  vportSlug,
  vportId,
  mode = 'user',
} = {}) {
  const { identity } = useIdentity();

  const [currentUser, setCurrentUser] = useState(undefined);
  const [currentUserActorId, setCurrentUserActorId] = useState(null);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------- auth ---------------- */

  const fetchAuth = useCallback(async () => {
    const { data, error: authErr } = await supabase.auth.getUser();
    if (authErr) { setCurrentUser(null); return; }
    setCurrentUser(data?.user ?? null);

    // derive current user's actor_id via vc.actors
    const uid = data?.user?.id || null;
    if (uid) {
      const actorId = await getActorIdForUser(uid);
      setCurrentUserActorId(actorId);
    } else {
      setCurrentUserActorId(null);
    }
  }, []);

  const ensureProfileRow = useCallback(async (userId) => {
    if (!userId) return;
    const { data: existing, error: selErr } = await supabase
      .from('profiles')
      .select('id, birthdate, is_adult')
      .eq('id', userId)
      .maybeSingle();

    if (selErr && selErr.code !== 'PGRST116') throw selErr;
    if (existing?.id) return;

    let birthdate = null;
    try {
      const { data } = await supabase.auth.getUser();
      birthdate = data?.user?.user_metadata?.birthdate ?? null;
    } catch {}
    const isAdult = computeIsAdultFromBirthdate(birthdate);

    const { error: insErr } = await supabase.from('profiles').insert({
      id: userId,
      is_adult: isAdult,
    });
    if (insErr) throw insErr;
  }, []);

  /* -------- minimal private-profile fallback via RPC (unchanged) -------- */

  async function fetchMinimalUser({ username, userId }) {
    if (userId) {
      const { data } = await supabase.rpc('get_profile_min_by_id', { p_id: userId });
      const r = Array.isArray(data) ? data[0] : data;
      return r ? mapUserProfile(r) : null;
    }
    if (username) {
      const { data } = await supabase.rpc('get_profile_min_by_username', { p_username: username });
      const r = Array.isArray(data) ? data[0] : data;
      return r ? mapUserProfile(r) : null;
    }
    return null;
  }

  /* ---------------- fetchers: USER ---------------- */

  const fetchUserBundle = useCallback(
    async ({ username, userId }) => {
      const viewerId = currentUser?.id || identity?.userId || null;

      if (currentUser?.id) {
        await ensureProfileRow(currentUser.id);
      }

      if (!username && !userId && !viewerId) {
        return {
          profile: null, posts: [], subscriberCount: 0, isSubscribed: false, isOwnProfile: false,
        };
      }

      // 1) profile (public.profiles)
      let userRow = null;
      {
        let q = supabase
          .from('profiles')
          .select('id,username,display_name,photo_url,private');

        if (username) q = q.eq('username', username);
        else q = q.eq('id', userId ?? viewerId);

        const { data, error } = await q.maybeSingle();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        userRow = data ?? null;
      }

      // 2) map or fallback
      let mapped = userRow ? mapUserProfile(userRow) : null;
      if (!mapped) {
        mapped = await fetchMinimalUser({ username, userId: userId ?? null });
      }
      if (!mapped) {
        return {
          profile: null, posts: [], subscriberCount: 0, isSubscribed: false, isOwnProfile: false,
        };
      }

      const mine = !!(currentUser?.id && currentUser.id === mapped.id);

      // resolve ACTORs
      const targetActorId = await getActorIdForUser(mapped.id);
      const viewerActorId = currentUserActorId;

      // 3) am I following them? (vc.actor_follows)
      let amSubscribed = false;
      if (viewerActorId && targetActorId && !mine) {
        const { data: subData } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id')
          .eq('follower_actor_id', viewerActorId)
          .eq('followed_actor_id', targetActorId)
          .maybeSingle();
        amSubscribed = !!subData;
      }

      // 4) posts (vc.posts by user_id)
      let postRows = [];
      if (!mapped.private || mine || amSubscribed) {
        const { data, error } = await supabase
          .schema('vc')
          .from('posts')
          .select('id,text,title,media_type,media_url,post_type,tags,created_at,user_id,actor_id,vport_id')
          .eq('user_id', mapped.id)
          .order('created_at', { ascending: false });
        if (!error) postRows = data ?? [];
      }

      // 5) follower count (vc.actor_follows where followed_actor_id = targetActorId)
      let followerCount = 0;
      if (targetActorId) {
        const { count } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('followed_actor_id', { count: 'exact', head: true })
          .eq('followed_actor_id', targetActorId)
          .eq('is_active', true);
        if (typeof count === 'number') followerCount = count;
      }

      return {
        profile: mapped,
        posts: postRows,
        subscriberCount: followerCount,
        isSubscribed: amSubscribed,
        isOwnProfile: mine,
      };
    },
    [currentUser?.id, identity?.userId, ensureProfileRow, currentUserActorId]
  );

  /* ---------------- fetchers: VPORT ---------------- */

  const fetchVportBundle = useCallback(
    async ({ slug, id }) => {
      let vportRow = null;
      if (id) {
        const { data, error } = await supabase
          .schema('vc')
          .from('vports')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        vportRow = data ?? null;
      } else if (slug) {
        const { data, error } = await supabase
          .schema('vc')
          .from('vports')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        vportRow = data ?? null;
      } else {
        throw new Error('VPORT id (or slug) required.');
      }

      if (!vportRow) {
        return {
          profile: null, posts: [], subscriberCount: 0, isSubscribed: false, isOwnProfile: false,
        };
      }

      const mapped = mapVportProfile(vportRow);

      // resolve actor ids
      const targetActorId = await getActorIdForVport(mapped.id);
      const viewerActorId = currentUserActorId;

      // posts (vc.posts by vport_id)
      let postRows = [];
      {
        const { data, error } = await supabase
          .schema('vc')
          .from('posts')
          .select('id,text,title,media_type,media_url,post_type,tags,created_at,user_id,actor_id,vport_id')
          .eq('vport_id', mapped.id)
          .order('created_at', { ascending: false });
        if (!error) postRows = data ?? [];
      }

      // follower count for VPORT actor
      let followerCount = 0;
      if (targetActorId) {
        const { count } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('followed_actor_id', { count: 'exact', head: true })
          .eq('followed_actor_id', targetActorId)
          .eq('is_active', true);
        if (typeof count === 'number') followerCount = count;
      }

      // isSubscribed (viewer follows vport actor)
      let amSubscribed = false;
      if (viewerActorId && targetActorId) {
        const { data: subData } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id')
          .eq('follower_actor_id', viewerActorId)
          .eq('followed_actor_id', targetActorId)
          .maybeSingle();
        amSubscribed = !!subData;
      }

      const mine =
        identity?.type === 'vport' &&
        identity?.vportId &&
        mapped.id &&
        identity.vportId === mapped.id;

      return {
        profile: mapped,
        posts: postRows,
        subscriberCount: followerCount,
        isSubscribed: amSubscribed,
        isOwnProfile: !!mine,
      };
    },
    [identity?.type, identity?.vportId, currentUserActorId]
  );

  /* ---------------- orchestrator ---------------- */

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (currentUser === undefined) await fetchAuth();

      if (mode === 'vport') {
        const bundle = await fetchVportBundle({ slug: vportSlug, id: vportId });
        if (!bundle.profile) throw new Error('VPORT not found.');
        setProfile(bundle.profile);
        setPosts(bundle.posts);
        setSubscriberCount(bundle.subscriberCount);
        setIsSubscribed(bundle.isSubscribed);
        setIsOwnProfile(bundle.isOwnProfile);
      } else {
        const bundle = await fetchUserBundle({ username: urlUsername, userId: urlUserId });
        if (!bundle.profile) throw new Error('Profile not found.');
        setProfile(bundle.profile);
        setPosts(bundle.posts);
        setSubscriberCount(bundle.subscriberCount);
        setIsSubscribed(bundle.isSubscribed);
        setIsOwnProfile(bundle.isOwnProfile);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('[useProfileData] fetch error:', e);
      setError(e?.message || 'Failed to load profile.');
      setProfile(null);
      setPosts([]);
      setSubscriberCount(0);
      setIsSubscribed(false);
      setIsOwnProfile(false);
    } finally {
      setLoading(false);
    }
  }, [
    currentUser, fetchAuth, fetchUserBundle, fetchVportBundle,
    mode, urlUsername, urlUserId, vportSlug, vportId
  ]);

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [
    mode, urlUsername, urlUserId, vportSlug, vportId, currentUser?.id, identity?.userId,
  ]);

  useEffect(() => {
    if (!profile) return;
    if (mode === 'vport') {
      setIsOwnProfile(
        !!(identity?.type === 'vport' && identity?.vportId && profile?.id && identity.vportId === profile.id)
      );
    } else {
      setIsOwnProfile(!!(currentUser?.id && profile?.id && currentUser.id === profile.id));
    }
  }, [identity?.type, identity?.vportId, currentUser?.id, profile?.id, mode, profile]);

  return {
    currentUser,
    profile,
    posts,
    subscriberCount,
    isSubscribed,
    isOwnProfile,
    loading,
    error,
    refresh,
  };
}

export default useProfileData;

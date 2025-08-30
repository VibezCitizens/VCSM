// src/features/profile/hooks/useProfileData.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext';

/**
 * Unified profile fetcher for:
 * - USER mode (profiles + posts)
 * - VPORT mode (vports + vport_posts or posts(vport_id))
 *
 * Hardened for your schema:
 * - profiles.is_adult is NOT NULL -> any insert/upsert includes a value.
 * - Never query profiles without target filter.
 * - Refresh re-runs when auth/identity resolves.
 */

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

export function useProfileData({
  urlUsername,
  urlUserId,
  vportSlug,
  vportId,
  mode = 'user',
} = {}) {
  const { identity } = useIdentity();

  // auth state
  const [currentUser, setCurrentUser] = useState(undefined);

  // subject
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  // relationships
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ------------------------------ auth ------------------------------ */

  const fetchAuth = useCallback(async () => {
    const { data, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      setCurrentUser(null);
      return;
    }
    setCurrentUser(data?.user ?? null);
  }, []);

  /**
   * Ensure a `profiles` row exists for this user id.
   * Your schema requires is_adult NOT NULL, so we:
   * 1) select the row first,
   * 2) if missing, insert with is_adult computed from birthdate (if available) or false.
   */
  const ensureProfileRow = useCallback(async (userId) => {
    if (!userId) return;

    // 1) Check if it exists
    const { data: existing, error: selErr } = await supabase
      .from('profiles')
      .select('id, birthdate, is_adult')
      .eq('id', userId)
      .maybeSingle();

    if (selErr && selErr.code !== 'PGRST116') throw selErr;
    if (existing?.id) return; // already there

    // 2) Try to glean birthdate from any existing auth/metadata if you store it there
    // (Supabase auth user metadata may hold it). We’ll look it up, but default to false.
    let birthdate = null;
    try {
      const { data } = await supabase.auth.getUser();
      birthdate = data?.user?.user_metadata?.birthdate ?? null;
    } catch {
      // ignore
    }

    const isAdult = computeIsAdultFromBirthdate(birthdate);

    // 3) Insert a minimal valid row with NOT NULL fields satisfied
    const { error: insErr } = await supabase.from('profiles').insert({
      id: userId,
      is_adult: isAdult, // REQUIRED by your schema
      // other columns will use defaults if any; username/display_name can be filled later
    });

    if (insErr) throw insErr;
  }, []);

  /* ------------------------------ mappers ------------------------------ */

  const mapUserProfile = (row) => {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username ?? null,
      display_name: row.display_name ?? row.username ?? 'Unnamed',
      bio: row.bio ?? '',
      photo_url: row.photo_url ?? null,
      kind: 'user',
    };
  };

  const mapVportProfile = (row) => {
    if (!row) return null;
    return {
      id: row.id,
      username: row.slug ?? null, // only if you actually have slug
      display_name: row.name ?? 'Untitled VPORT',
      bio: row.bio ?? row.description ?? '',
      photo_url: row.avatar_url ?? null,
      kind: 'vport',
    };
  };

  /* ------------------------------ fetchers ------------------------------ */

  const fetchUserBundle = useCallback(
    async ({ username, userId }) => {
      const viewerId = currentUser?.id || identity?.userId || null;
      const targetUserId = userId ?? viewerId ?? null;

      // Make sure our own row exists so later UPDATEs don't 400 on NOT NULL columns
      if (currentUser?.id) {
        await ensureProfileRow(currentUser.id);
      }

      // Don’t hit DB without a filter
      if (!username && !targetUserId) {
        return {
          profile: null,
          posts: [],
          subscriberCount: 0,
          isSubscribed: false,
          isOwnProfile: false,
        };
      }

      // 1) profile
      let q = supabase.from('profiles').select('*');
      if (username) q = q.eq('username', username);
      else if (targetUserId) q = q.eq('id', targetUserId);

      const { data: userRow, error: userErr } = await q.maybeSingle();
      if (userErr && userErr.code !== 'PGRST116') throw new Error(userErr.message);
      if (!userRow) {
        return {
          profile: null,
          posts: [],
          subscriberCount: 0,
          isSubscribed: false,
          isOwnProfile: false,
        };
      }
      const mapped = mapUserProfile(userRow);

      // 2) posts
      const { data: postRows, error: postErr } = await supabase
        .from('posts')
        .select('id,text,title,media_type,media_url,post_type,tags,created_at,user_id,vport_id')
        .eq('user_id', mapped.id)
        .order('created_at', { ascending: false });
      if (postErr) throw new Error(postErr.message);

      // 3) followers count
      let followerCount = 0;
      {
        const { count, error: countErr } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('followed_id', mapped.id);
        if (!countErr && typeof count === 'number') followerCount = count;
      }

      // 4) am I subscribed?
      let amSubscribed = false;
      if (currentUser?.id && currentUser.id !== mapped.id) {
        const { data: subData, error: subErr } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('followed_id', mapped.id)
          .maybeSingle();
        if (!subErr) amSubscribed = !!subData;
      }

      return {
        profile: mapped,
        posts: postRows ?? [],
        subscriberCount: followerCount ?? 0,
        isSubscribed: amSubscribed,
        isOwnProfile: !!(currentUser?.id && currentUser.id === mapped.id),
      };
    },
    [currentUser?.id, identity?.userId, ensureProfileRow]
  );

  const fetchVportBundle = useCallback(
    async ({ slug, id }) => {
      // Prefer id. Only use slug if you truly have that column.
      let vportRow = null;

      if (id) {
        const { data, error } = await supabase
          .from('vports')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        vportRow = data ?? null;
      } else if (slug) {
        try {
          const { data, error } = await supabase
            .from('vports')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
          if (error && error.code !== 'PGRST116') throw error;
          vportRow = data ?? null;
        } catch {
          throw new Error(
            'This project has no vports.slug column. Pass a vportId or add the slug column.'
          );
        }
      } else {
        throw new Error('VPORT id (or slug) required.');
      }

      if (!vportRow) {
        return {
          profile: null,
          posts: [],
          subscriberCount: 0,
          isSubscribed: false,
          isOwnProfile: false,
        };
      }

      const mapped = mapVportProfile(vportRow);

      // posts: prefer vport_posts; fallback to posts(vport_id)
      let postRows = [];
      try {
        const { data, error } = await supabase
          .from('vport_posts')
          .select('*')
          .eq('vport_id', mapped.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        postRows = data ?? [];
      } catch {
        const { data, error } = await supabase
          .from('posts')
          .select('id,text,title,media_type,media_url,post_type,tags,created_at,user_id,vport_id')
          .eq('vport_id', mapped.id)
          .order('created_at', { ascending: false });
        if (!error) postRows = data ?? [];
      }

      // subscriber count (vport_subscribers.user_id references auth.users in your schema)
      let vportSubs = 0;
      {
        const { count, error } = await supabase
          .from('vport_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('vport_id', mapped.id);
        if (!error && typeof count === 'number') vportSubs = count;
      }

      // are we subscribed? (implement if you add relation)
      const amSubscribed = false;

      // own vport?
      const mine =
        identity?.type === 'vport' &&
        identity?.vportId &&
        mapped.id &&
        identity.vportId === mapped.id;

      return {
        profile: mapped,
        posts: postRows ?? [],
        subscriberCount: vportSubs,
        isSubscribed: amSubscribed,
        isOwnProfile: !!mine,
      };
    },
    [identity?.type, identity?.vportId]
  );

  /* -------------------------- Orchestrated fetch -------------------------- */

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (currentUser === undefined) {
        await fetchAuth(); // populate currentUser on first run
      }

      if (mode === 'vport') {
        const bundle = await fetchVportBundle({ slug: vportSlug, id: vportId });
        if (!bundle.profile) {
          setError('VPORT not found.');
          setProfile(null);
          setPosts([]);
          setSubscriberCount(0);
          setIsSubscribed(false);
          setIsOwnProfile(false);
        } else {
          setProfile(bundle.profile);
          setPosts(bundle.posts);
          setSubscriberCount(bundle.subscriberCount);
          setIsSubscribed(bundle.isSubscribed);
          setIsOwnProfile(bundle.isOwnProfile);
        }
      } else {
        const bundle = await fetchUserBundle({ username: urlUsername, userId: urlUserId });
        if (!bundle.profile) {
          setError('Profile not found.');
          setProfile(null);
          setPosts([]);
          setSubscriberCount(0);
          setIsSubscribed(false);
          setIsOwnProfile(false);
        } else {
          setProfile(bundle.profile);
          setPosts(bundle.posts);
          setSubscriberCount(bundle.subscriberCount);
          setIsSubscribed(bundle.isSubscribed);
          setIsOwnProfile(bundle.isOwnProfile);
        }
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
    currentUser,
    fetchAuth,
    fetchUserBundle,
    fetchVportBundle,
    mode,
    urlUsername,
    urlUserId,
    vportSlug,
    vportId,
  ]);

  // Initial + whenever identifiers change (include auth/identity so refresh runs when they arrive)
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, urlUsername, urlUserId, vportSlug, vportId, currentUser?.id, identity?.userId]);

  // Recompute isOwnProfile when identity or viewer changes
  useEffect(() => {
    if (!profile) return;
    if (mode === 'vport') {
      setIsOwnProfile(
        !!(
          identity?.type === 'vport' &&
          identity?.vportId &&
          profile?.id &&
          identity.vportId === profile.id
        )
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

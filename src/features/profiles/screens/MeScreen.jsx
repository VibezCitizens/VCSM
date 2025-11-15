// src/features/profiles/screens/MeScreen.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ProfileHeader from '@/features/profiles/ProfileHeader';

import PhotoGrid from '@/features/profiles/tabs/PhotoGrid';
import VideoFeed from '@/features/profiles/tabs/VideoFeed';
import PostList from '@/features/profiles/tabs/PostList';
import FriendsList from '@/features/profiles/tabs/FriendsList';
import FriendsListEditor from '@/features/profiles/tabs/FriendsListEditor';
import RankedFriendsPublic from '@/features/profiles/tabs/RankedFriendsPublic'; // ⬅️ show only ranked top-10 to others

import PrivateProfileGate from '@/features/profiles/components/private/PrivateProfileGate';
import { isFollowing as fetchIsFollowing } from '@/data/user/profiles/profiles';

// 🔒 block-gate
import { useBlockStatus } from '@/features/profiles/hooks/useBlockStatus';

const TABS_OWN = [
  { key: 'photos',  label: 'Photos'  },
  { key: 'videos',  label: 'Videos'  },
  { key: 'posts',   label: 'Posts'   },
  { key: 'friends', label: 'Friends' },
];

const TABS_OTHER = [
  { key: 'photos',  label: 'Photos'  },
  { key: 'videos',  label: 'Videos'  },
  { key: 'posts',   label: 'Posts'   },
  { key: 'friends', label: 'Friends' },
];

export default function MeScreen() {
  const { user } = useAuth();
  const params = useParams(); // supports /u/:username or /profile/:id
  const routeUsername = params?.username || null;
  const routeId = params?.id || null;

  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  const [tab, setTab] = useState('photos');
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // follow state
  const [isFollowing, setIsFollowing] = useState(false);

  // ✅ NEW: actor id for the viewed profile (needed for vc.posts.actor_id)
  const [targetActorId, setTargetActorId] = useState(null);
  const [resolvingActor, setResolvingActor] = useState(false);

  const TABS = isOwnProfile ? TABS_OWN : TABS_OTHER;

  // Load target profile (me or by params)
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      // Reset actor when profile target changes
      setTargetActorId(null);

      // If route has a username or id, fetch that profile
      if (routeUsername || routeId) {
        setLoadingProfile(true);
        try {
          let q = supabase.from('profiles').select('*').limit(1);
          if (routeUsername) q = q.eq('username', routeUsername);
          else if (routeId)  q = q.eq('id', routeId);

          const { data, error } = await q;
          if (error) throw error;

          const row = data?.[0] || null;
          if (!cancelled) {
            setProfile(row);
            setIsOwnProfile(!!(row && user?.id && row.id === user.id));
          }
        } catch {
          if (!cancelled) {
            setProfile(null);
            setIsOwnProfile(false);
          }
        } finally {
          if (!cancelled) setLoadingProfile(false);
        }
        return;
      }

      // No params → load current user
      if (!user?.id) return;
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && !cancelled) {
          setProfile(data);
          setIsOwnProfile(true);
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [routeUsername, routeId, user?.id]);

  // ✅ Resolve vc.actors.id for the viewed profile (needed for vc.posts.actor_id)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!profile?.id) { if (alive) setTargetActorId(null); return; }
      setResolvingActor(true);
      try {
        const { data, error } = await supabase
          .schema('vc')
          .from('actors')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (!alive) return;
        if (error && error.code !== 'PGRST116') throw error;
        setTargetActorId(data?.id ?? null);
      } catch {
        if (alive) setTargetActorId(null);
      } finally {
        if (alive) setResolvingActor(false);
      }
    })();
    return () => { alive = false; };
  }, [profile?.id]);

  // ✅ load follow relationship (viewer → profile)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!profile?.id || !user?.id || profile.id === user.id) {
        if (alive) setIsFollowing(false);
        return;
      }
      try {
        const ok = await fetchIsFollowing(user.id, profile.id);
        if (alive) setIsFollowing(!!ok);
      } catch {
        if (alive) setIsFollowing(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id, profile?.id]);

  // 🔒 block-gate: derive block state for this profile
  const { loading: blockLoading, anyBlock } = useBlockStatus(profile?.id);
  const blocksReady = !blockLoading; // local gate

  // Allowed to see content?
  const canViewContent = useMemo(() => {
    if (!profile) return false;
    if (!isOwnProfile && anyBlock) return false; // 🔒 blocked either way
    if (isOwnProfile) return true;
    if (!profile.private) return true;
    return isFollowing; // private but viewer is an approved follower
  }, [profile, isOwnProfile, isFollowing, anyBlock]);

  // Load posts for the currently viewed profile (only when allowed and blocks resolved)
  const loadPosts = async (actorId) => {
    // 🔒 NEVER fetch if blocks not resolved or viewer is blocked (unless own profile)
    if (!actorId || !blocksReady || (!isOwnProfile && anyBlock)) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }
    if (!canViewContent) { setPosts([]); setLoadingPosts(false); return; }

    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .schema('vc')
        .from('posts')
        .select('id, text, media_url, media_type, post_type, user_id, created_at, title, actor_id')
        .eq('actor_id', actorId)
        .order('created_at', { ascending: false });

      if (!error) setPosts(data || []);
      else setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Kick off posts load whenever the actor id / visibility gate changes
  useEffect(() => {
    if (targetActorId) {
      loadPosts(targetActorId);
    } else {
      // If we’re still resolving or have no actor, clear the list but keep spinner logic correct
      setPosts([]);
      if (!resolvingActor) setLoadingPosts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetActorId, canViewContent, blocksReady]);

  // 🔒 hard gate: never render anything until profile + blocks are resolved
  if (loadingProfile || !blocksReady) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh] bg-neutral-950 text-white">
        Loading...
      </div>
    );
  }

  // If the profile doesn’t exist, show not found
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh] bg-neutral-950 text-neutral-400">
        Profile not found.
      </div>
    );
  }

  // 🔒 if blocked (and not my own), vanish entirely — no header, no tabs, no content
  if (!isOwnProfile && anyBlock) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-white">
      {/* Header (safe: we already gated on blocksReady/anyBlock above) */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        allowBannerUpload={false}
        onPhotoChange={
          isOwnProfile
            ? () => {
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single()
                  .then(({ data }) => setProfile(data));
              }
            : undefined
        }
      />

      {/* Tabs + Content are gated */}
      <PrivateProfileGate
        profile={profile}
        viewerId={user?.id || null}
        isFollowing={isFollowing}
        followButton={null}
        messageButton={null}
      >
        {/* Tabs */}
        <div className="mx-auto w-full max-w-5xl px-4 mt-4">
          <div
            role="tablist"
            aria-label={isOwnProfile ? 'My profile sections' : 'Profile sections'}
            className="grid grid-cols-4 gap-1 rounded-2xl bg-zinc-900/80 p-1 ring-1 ring-white/5"
          >
            {(isOwnProfile ? TABS_OWN : TABS_OTHER).map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={
                    active
                      ? 'h-9 rounded-xl text-xs font-semibold bg-white text-black'
                      : 'h-9 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white'
                  }
                >
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-4 pb-10 mt-3">
          <div className="rounded-2xl border border-white/5 bg-neutral-900/60">
            <div className="p-3 md:p-4">
              {tab === 'photos' && (loadingPosts
                ? <div className="text-center text-neutral-400 py-10">Loading photos…</div>
                : <PhotoGrid posts={posts} />
              )}

              {tab === 'videos' && (loadingPosts
                ? <div className="text-center text-neutral-400 py-10">Loading videos…</div>
                : <VideoFeed posts={posts} />
              )}

              {tab === 'posts' && (loadingPosts
                ? <div className="text-center text-neutral-400 py-10">Loading posts…</div>
                : <PostList posts={posts} user={{ id: profile.id }} />
              )}

              {tab === 'friends' && (
                isOwnProfile ? (
                  // Owner view: full breakdown + editor
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/5 bg-neutral-900/70 p-3">
                      <div className="text-sm font-semibold mb-2"> 
                        “Top 10 Friends”</div>
                      <FriendsListEditor userId={profile.id} />
                    </div>
                    <div className="rounded-xl border border-white/5 bg-neutral-900/70 p-3">
                      <div className="text-sm font-semibold mb-2">Circle</div>
                      <FriendsList userId={profile.id} isPrivate={false} />
                    </div>
                  </div>
                ) : (
                  // Public view: only ranked top-10 friends
                  <div className="rounded-xl border border-white/5 bg-neutral-900/70 p-3">
                    <div className="text-sm font-semibold mb-2">Friends</div>
                    <RankedFriendsPublic userId={profile.id} />
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={() => loadPosts(targetActorId)}
              className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 hover:bg-neutral-700"
              disabled={!canViewContent || !targetActorId}
            >
              Refresh
            </button>
          </div>
        </div>
      </PrivateProfileGate>
    </div>
  );
}

// src/features/profile/ProfileScreen.jsx
import { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileHeader from '@/features/profile/ProfileHeader';
import { getOrCreatePrivateConversation } from '@/utils/conversations';
import { useProfileData } from '@/features/profile/hooks/useProfileData';

// Lazy tabs
const PostList          = lazy(() => import('../tabs/PostList'));
const PhotoGrid         = lazy(() => import('../tabs/PhotoGrid'));
const VideoFeed         = lazy(() => import('../tabs/VideoFeed'));
const FriendsList       = lazy(() => import('../tabs/FriendsList'));
const FriendsListEditor = lazy(() => import('../tabs/FriendsListEditor'));

const USER_TABS  = ['POST', 'PHOTOS', 'VIDEOS', 'FRIENDS'];
const VPORT_TABS = ['POST', 'PHOTOS', 'VIDEOS'];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { username: urlUsername, userId: urlUserId } = useParams();

  // ✅ Hooks first, unconditional
  const [activeTab, setActiveTab] = useState('POST');

  const {
    currentUser,
    profile,
    posts,
    subscriberCount,
    isSubscribed,
    isOwnProfile,
    loading,
    error,
    refresh,
  } = useProfileData({ urlUsername, urlUserId });

  // Redirect to vanity URL when it becomes known
  useEffect(() => {
    if (currentUser && !urlUsername && !urlUserId && profile?.username) {
      navigate(`/u/${profile.username}`, { replace: true });
    }
  }, [currentUser, urlUsername, urlUserId, profile?.username, navigate]);

  const handleMessage = useCallback(async () => {
    if (!currentUser || !profile || currentUser.id === profile.id) return;
    const convoId = await getOrCreatePrivateConversation(currentUser.id, profile.id);
    if (convoId) navigate(`/chat/${convoId}`);
    else toast.error('Failed to start chat.');
  }, [currentUser, profile, navigate]);

  // ✅ From here down, NO new hooks — just branching/JSX

  // Guarded early returns (safe because no hooks appear below these lines in the hook list)
  if (loading || currentUser === undefined) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    // Optional: if you prefer to hard redirect, return <Navigate to="/login" replace />
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Please log in to view profiles.
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Profile not found.
      </div>
    );
  }

  const isVport = profile.kind === 'vport';
  const tabs = isVport ? VPORT_TABS : USER_TABS;

  let body = null;
  if (activeTab === 'POST') {
    body = <PostList posts={posts} user={profile} />;
  } else if (activeTab === 'PHOTOS') {
    body = <PhotoGrid posts={posts} />;
  } else if (activeTab === 'VIDEOS') {
    body = <VideoFeed posts={posts} />;
  } else {
    body = isOwnProfile
      ? <FriendsListEditor userId={profile.id} />
      : <FriendsList userId={profile.id} />;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <ProfileHeader
        profile={{ ...profile, subscriber_count: subscriberCount }}
        isOwnProfile={isOwnProfile}
        isSubscribed={isSubscribed}
        onPhotoChange={refresh}
        onMessage={handleMessage}
      />

      {/* Tabs */}
      <div
        className="sticky top-0 z-10 bg-black border-b border-neutral-800 flex justify-around text-xs font-semibold mt-4"
        role="tablist"
        aria-label="Profile sections"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab}`}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 ${selected ? 'text-white border-b-2 border-purple-500' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="mt-4 px-4 pb-24 space-y-4"
      >
        <Suspense fallback={<div className="text-center text-neutral-500 py-10">Loading…</div>}>
          {body}
        </Suspense>
      </div>
    </div>
  );
}

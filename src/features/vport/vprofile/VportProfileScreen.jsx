// C:\Users\vibez\OneDrive\Desktop\no src\src\features\vport\vprofile\VportProfileScreen.jsx

import { lazy, Suspense, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PullToRefresh from '@/components/PullToRefresh';
import { useProfileData } from '@/features/profiles/hooks/useProfileData';
import VprofileHeader from './VprofileHeader.jsx';

// Reuse user-profile PostList; VPORT-specific Photo/Video live locally
const PostList  = lazy(() => import('@/features/profiles/tabs/PostList.jsx'));
const PhotoGrid = lazy(() => import('./tabs/VportPhotoGrid.jsx'));
const VideoFeed = lazy(() => import('./tabs/VportVideoFeed.jsx'));

const VPORT_TABS = ['POST', 'PHOTOS', 'VIDEOS'];

export default function VportProfileScreen() {
  const { id: vportId, slug: vportSlug } = useParams();
  const [activeTab, setActiveTab] = useState('POST');

  const {
    currentUser,
    profile,
    posts,
    subscriberCount,
    isSubscribed,   // kept for parity; not used by VprofileHeader
    isOwnProfile,
    loading,
    error,
    refresh,
  } = useProfileData({ mode: 'vport', vportId, vportSlug });

  // Clamp the tab safely without loops
  const safeTab = useMemo(
    () => (VPORT_TABS.includes(activeTab) ? activeTab : 'POST'),
    [activeTab]
  );
  const selectTab = (tab) => setActiveTab(VPORT_TABS.includes(tab) ? tab : 'POST');

  if (currentUser === undefined || loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Please log in to view VPORT profiles.
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
        VPORT not found.
      </div>
    );
  }

  let body = null;
  if (safeTab === 'POST') body = <PostList user={profile} />;
  else if (safeTab === 'PHOTOS') body = <PhotoGrid posts={posts} />;
  else if (safeTab === 'VIDEOS') body = <VideoFeed posts={posts} />;

  return (
    <div className="bg-black text-white min-h-screen">
      <VprofileHeader
        profile={{ ...profile, subscriber_count: subscriberCount }}
        isOwnProfile={isOwnProfile}
        onPhotoChange={refresh}
        metricLabel="Subscribers"
        metricCount={subscriberCount}
      />

      {/* Tabs */}
      <div
        className="sticky top-0 z-10 bg-black border-b border-neutral-800 flex justify-around text-xs font-semibold mt-4"
        role="tablist"
        aria-label="VPORT sections"
      >
        {VPORT_TABS.map((tab) => {
          const selected = safeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab}`}
              id={`tab-${tab}`}
              onClick={() => selectTab(tab)}
              className={`flex-1 py-3 ${selected ? 'text-white border-b-2 border-purple-500' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Pull-to-refresh wraps the tab content; spacing controlled here */}
      <PullToRefresh
        onRefresh={refresh}
        threshold={70}
        maxPull={120}
        className="min-h-[60vh] px-3 pb-24 space-y-2"
      >
        <div
          id={`panel-${safeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${safeTab}`}
          className="contents"
        >
          <Suspense fallback={<div className="text-center text-neutral-500 py-10">Loading…</div>}>
            {body}
          </Suspense>
        </div>
      </PullToRefresh>
    </div>
  );
}

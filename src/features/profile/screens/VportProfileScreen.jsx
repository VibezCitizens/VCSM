import { lazy, Suspense, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProfileHeader from '@/features/profile/ProfileHeader';
import { useProfileData } from '@/features/profile/hooks/useProfileData';

const PostList  = lazy(() => import('../tabs/PostList'));
const PhotoGrid = lazy(() => import('../tabs/PhotoGrid'));
const VideoFeed = lazy(() => import('../tabs/VideoFeed'));

const VPORT_TABS = ['POST', 'PHOTOS', 'VIDEOS'];

export default function VportProfileScreen() {
  const { id: vportId, slug: vportSlug } = useParams();
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
  } = useProfileData({ mode: 'vport', vportId, vportSlug });

  // clamp the tab without causing an effect/render loop
  const safeTab = useMemo(
    () => (VPORT_TABS.includes(activeTab) ? activeTab : 'POST'),
    [activeTab]
  );
  const selectTab = (tab) => setActiveTab(VPORT_TABS.includes(tab) ? tab : 'POST');

  if (currentUser === undefined || loading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading…</div>;
  }
  if (!currentUser) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Please log in to view VPORT profiles.</div>;
  }
  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
  }
  if (!profile) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">VPORT not found.</div>;
  }

  let body = null;
  if (safeTab === 'POST') body = <PostList posts={posts} user={profile} />;
  else if (safeTab === 'PHOTOS') body = <PhotoGrid posts={posts} />;
  else if (safeTab === 'VIDEOS') body = <VideoFeed posts={posts} />;

  return (
    <div className="bg-black text-white min-h-screen">
      <ProfileHeader
        profile={{ ...profile, subscriber_count: subscriberCount }}
        isOwnProfile={isOwnProfile}
        isSubscribed={isSubscribed}
        onPhotoChange={refresh}
      />

      <div className="sticky top-0 z-10 bg-black border-b border-neutral-800 flex justify-around text-xs font-semibold mt-4" role="tablist" aria-label="VPORT sections">
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

      <div id={`panel-${safeTab}`} role="tabpanel" aria-labelledby={`tab-${safeTab}`} className="mt-4 px-4 pb-24 space-y-4">
        <Suspense fallback={<div className="text-center text-neutral-500 py-10">Loading…</div>}>
          {body}
        </Suspense>
      </div>
    </div>
  );
}

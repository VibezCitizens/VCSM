import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useProfileView } from '@/features/profiles/hooks/useProfileView'
import { useProfileGate } from '@/features/profiles/hooks/useProfileGate'
import { useBlockStatus } from '@/features/block/hooks/useBlockStatus'

import ActorProfileHeader from './ActorProfileHeader'
import ActorProfileTabs from './ActorProfileTabs'

import ActorProfilePostsView from './ActorProfilePostsView'
import ActorProfileFriendsView from './ActorProfileFriendsView'
import ActorProfilePhotosView from './ActorProfilePhotosView'

import PrivateProfileNotice from '@/features/social/components/PrivateProfileNotice'
export default function ActorProfileViewScreen({
  viewerActorId,
  profileActorId,
}) {
  const [tab, setTab] = useState('posts')
  const [gateVersion, setGateVersion] = useState(0)
  const navigate = useNavigate()

  const gate = useProfileGate({
    viewerActorId,
    targetActorId: profileActorId,
    version: gateVersion,
  })

  const canViewContent =
    gate.loading ? undefined : gate.canView

  const {
    loading,
    error,
    profile,
    posts,
    loadingPosts,
  } = useProfileView({
    viewerActorId,
    profileActorId,
    canViewContent,
  })

  const {
    loading: blockLoading,
    canViewProfile,
  } = useBlockStatus(viewerActorId, profileActorId)

  useEffect(() => {
    if (!blockLoading && canViewProfile === false) {
      navigate('/feed', { replace: true })
    }
  }, [blockLoading, canViewProfile, navigate])

  if (loading || blockLoading || gate.loading) {
    return (
      <div className="flex justify-center py-20 text-neutral-400">
        Loading…
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex justify-center py-20 text-red-400">
        Failed to load profile.
      </div>
    )
  }

  return (
    /* 🔑 SCROLL OWNER */
    <div
      className="
        h-full
        w-full
        overflow-y-auto
        touch-pan-y
        bg-black
        text-white
      "
    >
      <ActorProfileHeader
        profile={profile}
        viewerActorId={viewerActorId}
        profileIsPrivate={gate.isPrivate}
        onSubscriptionChanged={() =>
          setGateVersion(v => v + 1)
        }
      />

      <ActorProfileTabs
        tab={tab}
        setTab={setTab}
      />

      {!gate.canView && (
        <PrivateProfileNotice
          actor={profile.actor}
          onRequestFollow={gate.requestFollow}
          canMessage
        />
      )}

      {gate.canView && (
        <div className="px-4 pb-24 max-w-3xl mx-auto">
          {tab === 'posts' && (
            <ActorProfilePostsView
              profileActorId={profile.actorId}
            />
          )}

          {tab === 'photos' && (
            <ActorProfilePhotosView
              actorId={profile.actorId}
              posts={posts}
              loadingPosts={loadingPosts}
              canViewContent={gate.canView}
            />
          )}

          {tab === 'videos' && (
            <div className="flex items-center justify-center py-10 text-neutral-500">
              Videos — coming soon
            </div>
          )}

          {tab === 'friends' && (
            <ActorProfileFriendsView
              profileActorId={profile.actorId}
              canViewContent={gate.canView}
            />
          )}
        </div>
      )}
    </div>
  )
}

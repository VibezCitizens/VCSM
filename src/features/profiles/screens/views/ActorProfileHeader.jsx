// src/features/profiles/screens/views/profileheader/ActorProfileHeader.jsx

import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import ProfileHeaderQRCodeModal from '@/features/profiles/screens/views/profileheader/ProfileHeaderQRCodeModal'
import MessageButton from '@/features/profiles/ui/header/Messagebutton'
import SubscribeButton from '@/features/profiles/ui/header/Subscribebutton'
import { useProfileHeaderMessaging } from '@/features/profiles/hooks/header/useProfileHeaderMessaging'
import ActorActionsMenu from '@/shared/components/components/ActorActionsMenu'

import { useSubscribeAction } from '@/features/social/friend/request/hooks/useSubscribeAction'
import { useFollowerCount } from '@/features/social/friend/subscribe/hooks/useFollowerCount'

// ============================================================
// ActorProfileHeader
// ------------------------------------------------------------
// Mobile-first profile header (PHASE 1)
// ============================================================

export default function ActorProfileHeader({
  profile,
  viewerActorId,
  profileIsPrivate,
}) {
  if (!profile) return null

  const navigate = useNavigate()
  const isSelf = profile.actorId === viewerActorId
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    console.group('%c[ActorProfileHeader] PROFILE DEBUG', 'color:#22d3ee')
    console.log('actorId:', profile.actorId)
    console.groupEnd()
  }, [profile])

  const { handleMessage } = useProfileHeaderMessaging({
    profileId: profile.actorId,
  })

  const {
    count: followerCount,
    refresh: refreshFollowerCount,
  } = useFollowerCount(profile.actorId)

  // ✅ ONLY CHANGE IS HERE
  const {
  label: subscribeLabel,
  disabled: subscribeDisabled,
  onClick: onSubscribe,
  isSubscribed,
} = useSubscribeAction({
  viewerActorId,
  targetActorId: profile.actorId,
  profileIsPrivate,
  onAfterChange: () => {
    refreshFollowerCount()

    if (isSubscribed) {
      navigate('/feed', { replace: true })
    }
  },
})


  const qrValue = `${window.location.origin}/profile/${profile.actorId}`

  const logAction = useCallback(
    (name, fn) => async (...args) => {
      console.groupCollapsed(
        `%c[ActorProfileHeader] ${name}`,
        'color:#a855f7;font-weight:bold'
      )
      try {
        await fn?.(...args)
        console.log('✅ success')
      } catch (e) {
        console.error('❌ error', e)
      }
      console.groupEnd()
    },
    []
  )

  const safeHandleMessage = logAction('Message.click', handleMessage)
  const safeSubscribe = logAction('Subscribe.click', onSubscribe)
  const safeShowQR = logAction('ShowQR.click', () => setShowQR(true))

  return (
    <div className="relative">
      <div
        className="h-48 w-full"
        style={{
          backgroundImage: profile.bannerUrl
            ? `url(${profile.bannerUrl})`
            : 'linear-gradient(90deg, #7c3aed, #ec4899, #7c3aed)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="px-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="-mt-20 relative z-20 rounded-2xl bg-neutral-900/95 border border-neutral-800 shadow-2xl p-5">
            <div className="flex items-start gap-4">
              <img
                src={profile.avatarUrl || '/avatar.jpg'}
                alt={profile.displayName || 'Profile avatar'}
                className="w-24 h-24 rounded-2xl object-cover"
              />

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold truncate text-white">
                      {profile.displayName || 'Unnamed'}
                    </h2>
                    <div className="text-sm text-neutral-400 truncate">
                      @{profile.username || 'username'}
                    </div>
                  </div>

                  {isSelf ? (
                    <button
                      onClick={safeShowQR}
                      className="px-4 py-1.5 rounded-full text-xs font-medium bg-purple-600"
                    >
                      Show QR
                    </button>
                  ) : (
                    <ActorActionsMenu
                      viewerActorId={viewerActorId}
                      targetActorId={profile.actorId}
                      align="right"
                      onBlocked={() =>
                        navigate('/feed', { replace: true })
                      }
                    />
                  )}
                </div>

                <div className="mt-3 text-sm text-neutral-300">
                  {profile.bio || 'No bio provided.'}
                </div>

                <div className="mt-4 text-xs text-purple-400 uppercase">
                  {followerCount} Subscribers
                </div>
              </div>
            </div>

            {!isSelf && (
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <MessageButton onClick={safeHandleMessage} />
                <SubscribeButton
                  isSubscribed={isSubscribed}
                  label={subscribeLabel}
                  disabled={subscribeDisabled}
                  onClick={safeSubscribe}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileHeaderQRCodeModal
        open={showQR}
        onClose={() => setShowQR(false)}
        value={qrValue}
      />
    </div>
  )
}


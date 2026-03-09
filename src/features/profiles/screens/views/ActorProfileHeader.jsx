// src/features/profiles/screens/views/profileheader/ActorProfileHeader.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ProfileHeaderQRCodeModal from '@/features/profiles/screens/views/profileheader/ProfileHeaderQRCodeModal'
import MessageButton from '@/features/profiles/ui/header/Messagebutton'
import SubscribeButton from '@/features/profiles/ui/header/Subscribebutton'
import { useProfileHeaderMessaging } from '@/features/profiles/hooks/header/useProfileHeaderMessaging'
import ActorActionsMenu from '@/shared/components/components/ActorActionsMenu'

import { useSubscribeAction } from '@/features/social/adapters/friend/request/hooks/useSubscribeAction.adapter'
import { useFollowerCount } from '@/features/social/adapters/friend/subscribe/hooks/useFollowerCount.adapter'
import SubscribeDebugPanel from '@/features/social/adapters/friend/subscribe/components/SubscribeDebugPanel.adapter'

// ============================================================
// ActorProfileHeader
// ------------------------------------------------------------
// Mobile-first profile header
// ============================================================

export default function ActorProfileHeader({
  profile,
  viewerActorId,
  profileIsPrivate,
  loading = false,
}) {
  const navigate = useNavigate()
  const actorId = profile?.actorId ?? null
  const isSelf = actorId === viewerActorId
  const [showQR, setShowQR] = useState(false)

  const { handleMessage } = useProfileHeaderMessaging({
    profileId: actorId,
  })

  const {
    count: followerCount,
    refresh: refreshFollowerCount,
  } = useFollowerCount(actorId)

  const {
    label: subscribeLabel,
    disabled: subscribeDisabled,
    onClick: onSubscribe,
    isSubscribed,
    debugInfo: subscribeDebugInfo,
  } = useSubscribeAction({
    viewerActorId,
    targetActorId: actorId,
    profileIsPrivate,
    onAfterChange: () => {
      refreshFollowerCount()
      if (isSubscribed) {
        navigate('/feed', { replace: true })
      }
    },
  })

  const qrValue = actorId ? `${window.location.origin}/profile/${actorId}` : ''

  if (loading) {
    return (
      <div className="relative" aria-hidden="true">
        <div className="h-48 sm:h-56 w-full animate-pulse bg-slate-800/55" />

        <div className="px-4">
          <div className="profiles-shell w-full">
            <div className="-mt-20 relative z-20 profiles-card p-5">
              <div className="flex items-start gap-4">
                <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-slate-700/55" />

                <div className="flex-1 min-w-0 pt-1 space-y-3">
                  <div className="h-6 w-40 animate-pulse rounded bg-slate-700/60" />
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-700/45" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-slate-700/40" />
                  <div className="h-4 w-8/12 animate-pulse rounded bg-slate-700/35" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-700/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="relative">
      {/* ================= BANNER ================= */}
      <div
        className="h-48 sm:h-56 w-full"
        style={{
          backgroundImage: profile.bannerUrl
            ? `url(${profile.bannerUrl})`
            : 'linear-gradient(90deg, #7c3aed, #ec4899, #7c3aed)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center 35%',
          backgroundColor: '#07070f',
        }}
      />

      <div className="px-4">
        <div className="profiles-shell w-full">
          <div className="-mt-20 relative z-20 profiles-card p-5">
            {/* ================= HEADER CONTENT ================= */}
            <div className="flex items-start gap-4">
              <img
                src={profile.avatarUrl || '/avatar.jpg'}
                alt={profile.displayName || 'Profile avatar'}
                className="w-24 h-24 rounded-2xl object-cover border border-white/20 shadow-xl"
              />

              {/* reserve room for absolute buttons */}
              <div
                className={`flex-1 min-w-0 pt-1 ${
                  isSelf ? '' : 'sm:pr-36 sm:pb-6'
                }`}
              >
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate text-white">
                    {profile.displayName || 'Unnamed'}
                  </h2>
                  <div className="text-sm profiles-muted truncate">
                    @{profile.username || 'username'}
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-200">
                  {profile.bio || 'No bio provided.'}
                </div>

                <div className="mt-4 text-xs uppercase tracking-[0.12em] text-cyan-300">
                  {followerCount} Subscribers
                </div>
              </div>
            </div>

            {/* ================= TOP RIGHT CONTROL ================= */}
            {isSelf ? (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowQR(true)}
                  className="profiles-pill-btn px-4 py-1.5 text-xs font-medium"
                >
                  QR
                </button>
              </div>
            ) : (
              <div className="absolute top-4 right-4">
                <ActorActionsMenu
                  viewerActorId={viewerActorId}
                  targetActorId={actorId}
                  align="right"
                  onBlocked={() => navigate('/feed', { replace: true })}
                />
              </div>
            )}

            {/* ================= BOTTOM RIGHT ACTIONS ================= */}
            {!isSelf && (
              <div className="mt-4 flex w-full flex-col gap-2 sm:absolute sm:bottom-4 sm:right-4 sm:mt-0 sm:w-auto sm:items-end">
                <MessageButton onClick={handleMessage} />
                <SubscribeButton
                  isSubscribed={isSubscribed}
                  label={subscribeLabel}
                  disabled={subscribeDisabled}
                  onClick={onSubscribe}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <SubscribeDebugPanel debugInfo={subscribeDebugInfo} />

      {/* ================= QR MODAL ================= */}
      <ProfileHeaderQRCodeModal
        open={showQR}
        onClose={() => setShowQR(false)}
        value={qrValue}
      />
    </div>
  )
}

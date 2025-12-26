// ============================================================
//  FRIENDS SCREEN — UNIFIED ACTOR-BASED VIEW
// ------------------------------------------------------------
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Standalone friends page
//    • Username OR profileId based
//    • Actor-only identity
// ------------------------------------------------------------
//  RULES:
//   • NO profile / vport branching
//   • ActorId is the ONLY identity
//   • Data via existing hooks
// ============================================================

import { Navigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/AuthProvider'
import useProfileRouter from '@/features/profiles/shared/hooks/useProfileRouter'

// Core hook (already exists)
import { useProfileView } from '@/features/profiles/citizens/hooks/useProfileView'

// UI
import FriendsList from '@/features/profiles/shared/tabs/friends/components/FriendsList'
import ProfileHeaderArea from '@/features/profiles/citizens/ui/pHeader/ProfileHeaderArea'

export default function FriendsScreen() {
  const { user } = useAuth()
  const { routeUsername, routeId } = useProfileRouter()

  // We intentionally reuse profile resolution
  const {
    profile,
    actorId,
    isOwnProfile,
    loadingProfile,
    canViewContent,
  } = useProfileView(
    {
      username: routeUsername,
      id: routeId,
      tab: 'friends',
    },
    user
  )

  /* ============================================================
     GUARDS
     ============================================================ */
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh] text-neutral-400">
        Loading friends…
      </div>
    )
  }

  if (!profile || !actorId) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh] text-neutral-500">
        Profile not found.
      </div>
    )
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-white">

      {/* ---------- PROFILE HEADER ---------- */}
      <ProfileHeaderArea
        profile={profile}
        user={user}
        isOwnProfile={isOwnProfile}
      />

      {/* ---------- FRIENDS LIST ---------- */}
      <div className="mx-auto max-w-5xl px-4 pb-10 mt-4">
        <div className="rounded-2xl border border-white/5 bg-neutral-900/60 p-4">

          <h2 className="text-lg font-semibold text-white mb-4">
            Friends
          </h2>

          <FriendsList
            actorId={actorId}
            isPrivate={!canViewContent}
            isOwnProfile={isOwnProfile}
          />

        </div>
      </div>
    </div>
  )
}

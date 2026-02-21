// src/features/settings/privacy/ui/PrivacyTab.view.jsx
// ============================================================
// PrivacyTabView (ACTOR-FIRST / IDENTITY-SAFE)
// ------------------------------------------------------------
// Visibility + follow requests + blocking controls
// ============================================================

import { useMemo } from 'react'

import { useIdentity } from '@/state/identity/identityContext'

import ProfilePrivacyToggle from '@/features/settings/privacy/ui/ProfilePrivacyToggle'
import UserLookup from '@/features/settings/privacy/ui/UserLookup'
import BlockedUsersSimple from '@/features/settings/privacy/ui/BlockedUsersSimple'
import PendingFollowRequests from '@/features/settings/privacy/ui/PendingFollowRequests'

import { MyBlocksProvider } from '@/features/settings/privacy/hooks/useMyBlocks'

export default function PrivacyTabView() {
  const { identity } = useIdentity()

  const actorId = identity?.actorId || null
  const kind = identity?.kind || null // 'user' | 'vport'
  const isVport = kind === 'vport'

  // ✅ ACTOR-FIRST PROPS (NO userId / profileId / vportId)
  const actorProps = useMemo(() => {
    if (!actorId || !kind) return null
    return { actorId, scope: kind }
  }, [actorId, kind])

  if (!actorProps) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-neutral-900/60 p-4">
        <div className="text-sm text-zinc-300">Preparing your identity…</div>
        <div className="text-xs text-zinc-500">Privacy controls will load shortly.</div>
      </section>
    )
  }

  const lookupTitle = isVport ? 'Find a Citizen (VPORT scope)' : 'Find a Citizen'
  const blockedTitle = isVport ? 'Blocked Citizens (VPORT scope)' : 'Blocked Citizens'
  const visibilityTitle = isVport ? 'VPORT visibility' : 'Profile visibility'

  const visibilityHelp = isVport
    ? 'Control who can see this VPORT and its activity.'
    : 'Control who can see your profile and activity.'

  return (
    <MyBlocksProvider {...actorProps}>
      <div className="space-y-4">
        {/* ================= VISIBILITY ================= */}
        <section className="rounded-xl border border-zinc-800 bg-neutral-900/60 p-4">
          <div className="mb-3 text-sm text-zinc-300">{visibilityHelp}</div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{visibilityTitle}</h3>
              <div className="text-xs text-zinc-400">Public (default) or Private</div>
            </div>

            <ProfilePrivacyToggle actorId={actorId} />
          </div>
        </section>

        {/* ================= USER LOOKUP ================= */}
        <section className="rounded-xl border border-zinc-800 bg-neutral-900/60 p-4">
          <h3 className="text-sm font-semibold mb-1">{lookupTitle}</h3>
          <UserLookup />
        </section>

        {/* ================= PENDING FOLLOW REQUESTS ================= */}
        <PendingFollowRequests actorId={actorId} />

        {/* ================= BLOCKED USERS ================= */}
        <section className="rounded-xl border border-zinc-800 bg-neutral-900/60 p-4">
          <h3 className="text-sm font-semibold mb-1">{blockedTitle}</h3>
          <BlockedUsersSimple />
        </section>
      </div>
    </MyBlocksProvider>
  )
}
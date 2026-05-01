import { useMemo } from 'react'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'

import ProfilePrivacyToggle from '@/features/settings/privacy/ui/ProfilePrivacyToggle'
import UserLookup from '@/features/settings/privacy/ui/UserLookup'
import BlockedUsersSimple from '@/features/settings/privacy/ui/BlockedUsersSimple'
import PendingFollowRequests from '@/features/settings/privacy/ui/PendingFollowRequests'
import { MyBlocksProvider } from '@/features/settings/privacy/hooks/useMyBlocks'

export default function PrivacyTabView() {
  const { identity } = useIdentity()

  const actorId = identity?.actorId || null
  const kind = identity?.kind || null
  const isVport = kind === 'vport'

  const actorProps = useMemo(() => {
    if (!actorId || !kind) return null
    return { actorId, scope: kind }
  }, [actorId, kind])

  if (!actorProps) {
    return (
      <section className="settings-card-surface rounded-xl p-4">
        <div className="text-sm text-white/70">Preparing your identity...</div>
        <div className="text-xs text-white/40">Privacy controls will load shortly.</div>
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
        <section className="settings-card-surface rounded-xl p-4">
          <div className="mb-3 text-sm text-white/70">{visibilityHelp}</div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">{visibilityTitle}</h3>
              <div className="text-xs text-white/50">Public (default) or Private</div>
            </div>
            <ProfilePrivacyToggle actorId={actorId} />
          </div>
        </section>

        <section className="settings-card-surface rounded-xl p-4">
          <h3 className="mb-1 text-sm font-semibold text-white">{lookupTitle}</h3>
          <UserLookup />
        </section>

        <PendingFollowRequests actorId={actorId} />

        <section className="settings-card-surface rounded-xl p-4">
          <h3 className="mb-1 text-sm font-semibold text-white">{blockedTitle}</h3>
          <BlockedUsersSimple />
        </section>
      </div>
    </MyBlocksProvider>
  )
}

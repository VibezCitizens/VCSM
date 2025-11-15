// src/features/settings/tabs/PrivacyTab.jsx
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';

import ProfilePrivacyToggle from '../../profiles/components/private/ProfilePrivacyToggle';
import UserLookup from '../components/privacy/UserLookup';
import BlockedUsersSimple from '../components/privacy/BlockedUsersSimple';
import { MyBlocksProvider } from '../components/privacy/useMyBlocks';
import PendingRequestsList from '../components/pendingrequest/PendingRequestsList';

const DBG = true;
const dlog = (...a) => DBG && console.debug('[PrivacyTab]', ...a);

export default function PrivacyTab() {
  const { user } = useAuth();
  const { identity } = useIdentity();

  const isVport = identity?.type === 'vport' && !!identity?.vportId;
  const actorId = identity?.actorId || null;      // ✅ vc.actors.id (persona actor)
  const vportId = identity?.vportId || null;      // vports.id when acting as vport
  const userId  = user?.id || null;               // profiles.id (auth user)

  // persona-aware props for children:
  // - scope: 'user' | 'vport'
  // - actorId: ALWAYS vc.actors.id (critical for follow/blocks logic)
  // - userId / vportId: entity ids (only used by some widgets)
  const actorProps = useMemo(() => {
    const base = isVport
      ? { scope: 'vport', vportId, actorId }      // ✅ actorId is vc.actors.id
      : { scope: 'user',  userId,  actorId };     // ✅ actorId is vc.actors.id

    dlog('actorProps', base);
    return base;
  }, [isVport, vportId, userId, actorId]);

  const entityLabel = isVport ? 'VPORT' : 'profile';
  const visibilityTitle = isVport ? 'VPORT visibility' : 'Profile visibility';
  const visibilityHelp =
    isVport
      ? 'Control who can see this VPORT and its activity. New VPORTs start public.'
      : 'Control who can see your profile and activity. New accounts start public.';

  const pendingTitle = isVport ? 'Pending follow requests (VPORT)' : 'Pending follow requests';
  const pendingHelp =
    isVport
      ? 'Approve or decline followers who requested access to your private VPORT.'
      : 'Approve or decline followers who requested access to your private profile.';

  const blockedTitle = isVport ? 'Blocked users (VPORT scope)' : 'Blocked users';
  const lookupTitle = isVport ? 'Find a user (VPORT scope)' : 'Find a user';

  // If the persona actor hasn't resolved yet, avoid rendering lists that require it.
  if (!actorId) {
    dlog('actorId not ready; showing skeleton');
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-zinc-800 bg-neutral-900/60 p-4">
          <div className="text-sm text-zinc-300">Preparing your identity…</div>
          <div className="text-xs text-zinc-500">
            We’ll load privacy controls once your persona is ready.
          </div>
        </section>
      </div>
    );
  }

  return (
    <MyBlocksProvider {...actorProps}>
      <div className="space-y-4">
        {/* Visibility */}
        <section
          className="rounded-xl border border-zinc-800 bg-neutral-900/60"
          aria-labelledby="privacy-visibility-heading"
        >
          <div className="p-3 md:p-4">
            <div className="text-sm text-zinc-300 mb-3">{visibilityHelp}</div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h2 id="privacy-visibility-heading" className="text-sm font-semibold">
                  {visibilityTitle}
                </h2>
                <div className="text-xs text-zinc-400">Public (default) or Private</div>
              </div>

              {/* If ProfilePrivacyToggle supports scoping, it will use these. */}
              <ProfilePrivacyToggle {...actorProps} />
            </div>
          </div>
        </section>

        {/* Quick user lookup */}
        <section
          className="rounded-xl border border-zinc-800 bg-neutral-900/60"
          aria-labelledby="find-user-heading"
        >
          <div className="p-3 md:p-4">
            <div className="px-1 pb-2">
              <h3 id="find-user-heading" className="text-sm font-semibold">
                {lookupTitle}
              </h3>
              <p className="text-xs text-zinc-400">
                Search by <b>@username</b> or display name and block/unblock instantly —
                scoped to this {entityLabel.toLowerCase()}.
              </p>
            </div>

            <UserLookup {...actorProps} />
          </div>
        </section>

        {/* Pending follow requests */}
        <section
          className="rounded-xl border border-zinc-800 bg-neutral-900/60"
          aria-labelledby="pending-requests-heading"
        >
          <div className="p-3 md:p-4">
            <div className="px-1 pb-2">
              <h3 id="pending-requests-heading" className="text-sm font-semibold">
                {pendingTitle}
              </h3>
              <p className="text-xs text-zinc-400">{pendingHelp}</p>
            </div>

            <PendingRequestsList {...actorProps} />
          </div>
        </section>

        {/* Blocked users */}
        <section
          className="rounded-xl border border-zinc-800 bg-neutral-900/60"
          aria-labelledby="blocked-users-heading"
        >
          <div className="p-3 md:p-4">
            <div className="px-1 pb-2">
              <h3 id="blocked-users-heading" className="text-sm font-semibold">
                {blockedTitle}
              </h3>
              <p className="text-xs text-zinc-400">
                People you’ve blocked won’t be able to view or interact with this{' '}
                {entityLabel.toLowerCase()}.
              </p>
            </div>

            <BlockedUsersSimple {...actorProps} />
          </div>
        </section>
      </div>
    </MyBlocksProvider>
  );
}

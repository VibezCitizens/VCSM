// src/features/settings/tabs/PrivacyTab.jsx
import ProfilePrivacyToggle from '../../profiles/components/private/ProfilePrivacyToggle';
import UserLookup from '../components/privacy/UserLookup';
import BlockedUsersSimple from '../components/privacy/BlockedUsersSimple';
import { MyBlocksProvider } from '../components/privacy/useMyBlocks';
import PendingRequestsList from '../components/pendingrequest/PendingRequestsList'; // 👈 add

export default function PrivacyTab() {
  return (
    <MyBlocksProvider>
      <div className="space-y-4">
        {/* Profile visibility */}
        <section
          className="rounded-xl border border-zinc-800 bg-neutral-900/60"
          aria-labelledby="privacy-visibility-heading"
        >
          <div className="p-3 md:p-4">
            <div className="text-sm text-zinc-300 mb-3">
              Control who can see your profile and activity. New accounts start <b>public</b>.
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h2 id="privacy-visibility-heading" className="text-sm font-semibold">
                  Profile visibility
                </h2>
                <div className="text-xs text-zinc-400">Public (default) or Private</div>
              </div>
              <ProfilePrivacyToggle />
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
                Find a user
              </h3>
              <p className="text-xs text-zinc-400">
                Search by <b>@username</b> or display name and block/unblock instantly.
              </p>
            </div>
            <UserLookup />
          </div>
        </section>

        {/* Pending follow requests — NEW */}
        <section
          className="rounded-xl border border-zinc-800 bg-neutral-900/60"
          aria-labelledby="pending-requests-heading"
        >
          <div className="p-3 md:p-4">
            <div className="px-1 pb-2">
              <h3 id="pending-requests-heading" className="text-sm font-semibold">
                Pending follow requests
              </h3>
              <p className="text-xs text-zinc-400">
                Approve or decline followers who requested access to your private profile.
              </p>
            </div>
            <PendingRequestsList />
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
                Blocked users
              </h3>
              <p className="text-xs text-zinc-400">
                People you’ve blocked won’t be able to view or interact with you.
              </p>
            </div>
            <BlockedUsersSimple />
          </div>
        </section>
      </div>
    </MyBlocksProvider>
  );
}

// src/features/profiles/ui/PrivateProfileGate.jsx

import ActorLink from "@/shared/components/ActorLink";
import MessageButton from "@/features/profiles/ui/header/MessageButton";

/**
 * ============================================================
 * PrivateProfileGate
 * ------------------------------------------------------------
 * UI-only gate shown when profile is private and viewer
 * does NOT have access.
 *
 * Rules:
 * - Actor-based (SSOT)
 * - No data fetching
 * - No side effects
 * - Follow request is primary action
 * ============================================================
 */
export default function PrivateProfileGate({
  actor,
  onRequestFollow,
  canMessage = true,
}) {
  if (!actor) return null;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10">
      {/* ======================================================
          CARD
         ====================================================== */}
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl p-6 text-center">

        {/* Lock Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800">
          <span className="text-xl">🔒</span>
        </div>

        {/* Actor */}
        <div className="flex justify-center mb-3">
          <ActorLink
            actor={actor}
            avatarSize="w-12 h-12"
            showName
            showUsername
            centered
          />
        </div>

        {/* Copy */}
        <p className="text-sm text-neutral-300 mt-2 font-medium">
          This profile is private
        </p>

        <p className="text-xs text-neutral-500 mt-1">
          Only approved followers can see posts, photos, and friends.
        </p>

        {/* Primary CTA */}
        <button
          onClick={onRequestFollow}
          className="mt-5 w-full rounded-lg bg-white text-black font-medium py-2
                     hover:bg-neutral-200 active:scale-[0.98]
                     transition-all duration-150"
        >
          Request Follow
        </button>

        {/* Secondary CTA */}
        {canMessage && (
          <div className="mt-3">
            <MessageButton
              label="Send Message"
              onClick={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}

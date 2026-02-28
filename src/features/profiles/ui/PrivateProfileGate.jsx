// src/features/profiles/ui/PrivateProfileGate.jsx

/**
 * ============================================================
 * PrivateProfileGate
 * ------------------------------------------------------------
 * UI-only gate shown when profile is private and viewer
 * does NOT have access.
 * ============================================================
 */
export default function PrivateProfileGate({
  actor,
  onRequestFollow,
  canMessage = false,
}) {
  if (!actor) return null;

  const canRequest = typeof onRequestFollow === "function";

  return (
    <div className="flex justify-center px-4 py-8">
      <div className="profiles-card w-full max-w-md rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/10">
            <span className="text-sm text-amber-200">LOCK</span>
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Private Profile</div>
            <div className="text-xs text-slate-400">
              Only approved subscribers can view full content.
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <img
            src={actor?.avatar || "/avatar.jpg"}
            alt={actor?.displayName || "Profile"}
            className="h-10 w-10 rounded-lg border border-white/15 object-cover"
          />

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {actor?.displayName || "Citizen"}
            </div>
            {actor?.username ? (
              <div className="truncate text-xs text-slate-400">@{actor.username}</div>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Send a subscription request to unlock vibes, photos, videos, and friends.
        </p>

        <button
          onClick={onRequestFollow}
          disabled={!canRequest}
          className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Request Access
        </button>

        {canMessage && (
          <div className="mt-2 text-center text-[11px] text-slate-500">
            You can still send a message from the header.
          </div>
        )}
      </div>
    </div>
  );
}

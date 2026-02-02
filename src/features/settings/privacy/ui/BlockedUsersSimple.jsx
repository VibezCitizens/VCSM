import { useMemo } from "react";
import { useMyBlocks } from "@/features/settings/privacy/hooks/useMyBlocks";
import { useActorPresentation } from "@/state/actors/useActorPresentation";

export default function BlockedUsersSimple() {
  const { loading, error, blocks, unblock, refresh } = useMyBlocks();

  const empty = useMemo(
    () => !loading && (!blocks || blocks.length === 0),
    [loading, blocks]
  );

  return (
    <div className="space-y-4">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-400">
          {loading ? "Loading…" : `${blocks.length} blocked`}
        </div>

        <button
          onClick={refresh}
          className="rounded-lg border border-zinc-800
                     bg-neutral-900 px-3 py-1.5
                     text-xs text-zinc-200
                     hover:bg-neutral-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-400">
          {error}
        </div>
      )}

      {empty && (
        <div className="text-sm text-zinc-500 italic">
          You haven’t blocked any Citizens.
        </div>
      )}

      {/* ================= BLOCKED CARDS ================= */}
      <div className="grid gap-3">
        {blocks.map((b) => (
          <BlockedUserCard
            key={b.id}
            actorId={b.blockedActorId}
            onUnblock={() => unblock(b.blockedActorId)}
            busy={loading}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   BLOCKED USER CARD
   ============================================================ */
function BlockedUserCard({ actorId, onUnblock, busy }) {
  const actor = useActorPresentation(actorId);

  return (
    <div
      className="flex items-center justify-between gap-4
                 rounded-xl border border-zinc-800
                 bg-neutral-950/60
                 px-4 py-3"
    >
      {/* LEFT — ACTOR */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
          {actor?.photoUrl ? (
            <img
              src={actor.photoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
              N/A
            </div>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0">
          <div className="text-sm font-medium text-zinc-200 truncate">
            {actor?.displayName || "Unknown"}
          </div>

          {actor?.username && (
            <div className="text-xs text-zinc-500 truncate">
              @{actor.username}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — ACTION */}
      <button
        onClick={busy ? undefined : onUnblock}
        disabled={busy}
        className={`rounded-lg px-3 py-1.5 text-xs border
          ${
            busy
              ? "border-zinc-800 text-zinc-600"
              : "border-red-900/60 bg-red-950/30 text-red-200 hover:bg-red-950/50"
          }`}
      >
        Unblock
      </button>
    </div>
  );
}

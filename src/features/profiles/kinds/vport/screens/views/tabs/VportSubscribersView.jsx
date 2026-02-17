import { useEffect } from "react";
import { useSubscribers } from "@/features/profiles/kinds/vport/hooks/useSubscribers";
import ActorLink from "@/shared/components/ActorLink";

export default function VportSubscribersView({ profile }) {
  const actorId = profile?.actorId ?? null;

  const { loading, count, rows, error } = useSubscribers(actorId);

  // DEBUG
  useEffect(() => {
    console.groupCollapsed("[VportSubscribersView]");
    console.log("profile.actorId:", profile?.actorId);
    console.log("rows sample:", rows?.[0]);
    console.groupEnd();
  }, [profile?.actorId, rows]);

  return (
    <div
      className="
        rounded-3xl
        bg-black border border-white/10
        shadow-[0_0_40px_-16px_rgba(128,0,255,0.45)]
        p-5
      "
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Subscribers</h3>
        <div className="text-sm text-white">{count}</div>
      </div>

      {loading && <div className="mt-3 text-sm text-gray-400">Loading…</div>}

      {!loading && error && (
        <div className="mt-3 text-sm text-red-300">{error}</div>
      )}

      {!loading && !error && (rows?.length ?? 0) === 0 && (
        <div className="mt-3 text-sm text-gray-500">No subscribers yet.</div>
      )}

      {!loading && !error && (rows?.length ?? 0) > 0 && (
        <div className="mt-4 space-y-2">
          {rows.map((r) => {
            const key =
              r.actor_id ??
              r.follower_actor_id ??
              r.id ??
              `${r.username ?? "u"}:${r.display_name ?? "d"}`;

            const kind = r.kind ?? "user";
            const id = r.actor_id ?? r.id ?? null;

            // Match PostHeader handle preference:
            // ✅ vport: prefer slug, else username
            // ✅ normal: prefer username, else slug
            const rawHandle =
              kind === "vport"
                ? String(r.slug ?? r.vport_slug ?? r.username ?? "").trim()
                : String(r.username ?? r.slug ?? r.vport_slug ?? "").trim();

            // Build route to match your router:
            // - user with username => /u/:username
            // - vport with vportId (or id if that's the vportId) => /vport/:vportId
            // - fallback => /profile/:actorId
            const route =
              kind === "vport"
                ? id
                  ? `/vport/${encodeURIComponent(id)}`
                  : `/profile/${encodeURIComponent(id ?? "")}`
                : rawHandle
                  ? `/u/${encodeURIComponent(rawHandle)}`
                  : id
                    ? `/profile/${encodeURIComponent(id)}`
                    : "/feed";

            const actor = {
              id,
              kind,
              displayName: r.display_name || r.username || "Unknown",
              username: r.username ?? null,
              slug: r.slug ?? r.vport_slug ?? null,
              avatar: r.photo_url || "/avatar.jpg",
              route,
            };

            return (
              <div
                key={key}
                className="
                  rounded-2xl border border-purple-900/40
                  bg-[#1d1d1d] hover:bg-[#242424]
                  shadow-[0_0_12px_-4px_rgba(128,0,255,0.4)]
                  p-3
                "
              >
                <ActorLink
                  actor={actor}
                  avatarSize="w-12 h-12"
                  avatarShape="rounded-xl"
                  textSize="text-sm"
                  showUsername
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 text-xs text-neutral-400">
        Vport: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}

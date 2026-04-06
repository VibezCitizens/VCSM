import ActorLink from "@/shared/components/ActorLink";
import { useSubscribers } from "@/features/profiles/kinds/vport/hooks/subscribers/useSubscribers";

function buildSubscriberActor(row) {
  const id = row?.actor_id ?? row?.id ?? null;
  const kind = row?.kind ?? "user";
  const handle =
    kind === "vport"
      ? String(row?.slug ?? row?.vport_slug ?? row?.username ?? "").trim()
      : String(row?.username ?? row?.slug ?? row?.vport_slug ?? "").trim();

  const route =
    kind === "vport"
      ? id
        ? `/vport/${encodeURIComponent(id)}`
        : "/feed"
      : handle
      ? `/u/${encodeURIComponent(handle)}`
      : id
      ? `/profile/${encodeURIComponent(id)}`
      : "/feed";

  return {
    id,
    kind,
    displayName: row?.display_name || row?.username || "Unknown",
    username: row?.username ?? null,
    slug: row?.slug ?? row?.vport_slug ?? null,
    avatar: row?.photo_url || "/avatar.jpg",
    route,
  };
}

export default function VportSubscribersView({ profile }) {
  const actorId = profile?.actorId ?? null;
  const { loading, count, rows, error } = useSubscribers(actorId);
  const list = Array.isArray(rows) ? rows : [];

  return (
    <section className="profiles-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">Subscribers</div>
          <div className="mt-1 text-xs profiles-muted">Citizens following this vport.</div>
        </div>
        <div className="profiles-pill-btn px-3 py-1 text-xs font-semibold">{count ?? 0}</div>
      </div>

      {loading ? (
        <div className="profiles-subcard mt-4 p-4 text-sm profiles-muted">Loading subscribers...</div>
      ) : null}

      {!loading && error ? (
        <div className="profiles-error mt-4 rounded-2xl p-4 text-sm">{String(error)}</div>
      ) : null}

      {!loading && !error && list.length === 0 ? (
        <div className="profiles-subcard mt-4 p-4 text-sm profiles-muted">No subscribers yet.</div>
      ) : null}

      {!loading && !error && list.length > 0 ? (
        <div className="mt-4 space-y-2">
          {list.map((row) => {
            const key =
              row?.actor_id ?? row?.follower_actor_id ?? row?.id ?? `${row?.username ?? "u"}:${row?.display_name ?? "d"}`;
            const actor = buildSubscriberActor(row);

            return (
              <div
                key={key}
                className="profiles-subcard rounded-2xl p-3 transition-colors hover:bg-white/10"
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
      ) : null}

      <div className="mt-4 text-xs profiles-muted">Vport: @{profile?.username || "unknown"}</div>
    </section>
  );
}

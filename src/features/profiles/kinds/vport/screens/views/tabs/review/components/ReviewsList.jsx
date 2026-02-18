import React, { useMemo } from "react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorStore } from "@/state/actors/actorStore";

function formatDateSafe(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function ReviewRow({ r }) {
  const authorId = r.authorActorId ?? r.author_actor_id ?? null;

  const actor = useActorStore((s) =>
    authorId ? s.actors[authorId] : null
  );

  const actorUI = useMemo(() => {
    if (!actor) return null;

    const isVport = actor.kind === "vport";

    const displayName = isVport
      ? actor.vportName ?? actor.vport_name ?? "Vport"
      : actor.displayName ??
        actor.display_name ??
        actor.username ??
        "User";

    const username = isVport
      ? actor.vportSlug ?? actor.vport_slug ?? null
      : actor.username ?? null;

    const avatar =
      actor.photoUrl ??
      actor.photo_url ??
      "/avatar.jpg";

    const route = isVport
      ? `/profile/${encodeURIComponent(actor.id)}`
      : username
        ? `/u/${encodeURIComponent(username)}`
        : `/profile/${encodeURIComponent(actor.id)}`;

    return {
      id: actor.id,
      kind: actor.kind,
      displayName,
      username,
      avatar,
      route,
    };
  }, [actor]);

  const dateText = formatDateSafe(
    r.createdAt ?? r.created_at ?? null
  );

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div className="min-w-0">
          {actorUI ? (
            <ActorLink
              actor={actorUI}
              avatarSize="w-9 h-9"
              avatarShape="rounded-lg"
              textSize="text-sm"
              showUsername={true}
              showTimestamp={false}
              className="min-w-0"
              showText={true}
            />
          ) : (
            <div className="text-sm text-neutral-400">
              Unknown user
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.92)",
              fontWeight: 900,
            }}
          >
            {r.rating}★
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 12,
              fontWeight: 750,
              whiteSpace: "nowrap",
            }}
          >
            {dateText}
          </div>
        </div>
      </div>

      {/* Body */}
      {r.body ? (
        <div
          style={{
            marginTop: 10,
            color: "rgba(255,255,255,0.70)",
            fontSize: 13,
            lineHeight: "18px",
            wordBreak: "break-word",
          }}
        >
          {r.body}
        </div>
      ) : (
        <div
          style={{
            marginTop: 10,
            color: "rgba(255,255,255,0.45)",
            fontSize: 13,
          }}
        >
          (no comment)
        </div>
      )}
    </div>
  );
}

export default function ReviewsList({ loading, list }) {
  return (
    <div style={{ marginTop: 14 }}>
      {loading ? (
        <div className="text-sm text-neutral-300">
          Loading reviews…
        </div>
      ) : list?.length ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {list.map((r) => (
            <ReviewRow key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-300">
          No reviews yet.
        </div>
      )}
    </div>
  );
}

import React, { useMemo } from "react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorStore } from "@/state/actors/actorStore";

function formatDateSafe(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function Stars({ value = 0 }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: 14,
            color:
              n <= value
                ? "rgba(255,255,255,0.95)"
                : "rgba(255,255,255,0.20)",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
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
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.28))",
        boxShadow:
          "0 12px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        padding: 16,
        transition: "transform 120ms ease",
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
              avatarShape="rounded-xl"
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
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Stars value={r.rating} />

          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 12,
              fontWeight: 600,
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
            marginTop: 12,
            color: "rgba(255,255,255,0.78)",
            fontSize: 14,
            lineHeight: "20px",
            letterSpacing: 0.2,
            wordBreak: "break-word",
          }}
        >
          {r.body}
        </div>
      ) : (
        <div
          style={{
            marginTop: 12,
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
          }}
        >
          No comment provided.
        </div>
      )}
    </div>
  );
}

export default function ReviewsList({ loading, list }) {
  return (
    <div style={{ marginTop: 18 }}>
      {loading ? (
        <div className="text-sm text-neutral-400">
          Loading reviews…
        </div>
      ) : list?.length ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {list.map((r) => (
            <ReviewRow key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <div
          style={{
            marginTop: 8,
            color: "rgba(255,255,255,0.45)",
            fontSize: 14,
          }}
        >
          No reviews yet.
        </div>
      )}
    </div>
  );
}

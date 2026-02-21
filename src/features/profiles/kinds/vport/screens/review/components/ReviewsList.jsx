import React, { useMemo } from "react";
import ActorLink from "@/shared/components/ActorLink";

function pickAuthor(r) {
  const authorActorId =
    r?.authorActorId ??
    r?.author_actor_id ??
    r?.author_id ??
    r?.author?.actorId ??
    r?.author?.actor_id ??
    null;

  const displayName =
    r?.authorDisplayName ??
    r?.author_display_name ??
    r?.author?.displayName ??
    r?.author?.display_name ??
    r?.author?.name ??
    r?.author_name ??
    "Anonymous";

  const username =
    r?.authorUsername ??
    r?.author_username ??
    r?.author?.username ??
    "";

  const avatar =
    r?.authorAvatarUrl ??
    r?.author_avatar_url ??
    r?.author?.avatarUrl ??
    r?.author?.avatar_url ??
    r?.author?.avatar ??
    r?.author?.avatar_url ??
    "/avatar.jpg";

  return { authorActorId, displayName, username, avatar };
}

export default function ReviewsList({ loading, reviews }) {
  const rows = useMemo(() => (Array.isArray(reviews) ? reviews : []), [reviews]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
        Loading…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
        No reviews yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const id = r?.id ?? r?._id ?? `${r?.createdAt ?? ""}-${Math.random()}`;

        const createdAt = r?.createdAt ?? r?.created_at ?? null;
        const timestamp = createdAt ? new Date(createdAt).toLocaleString() : "";

        const overall = r?.overallRating ?? r?.overall_rating ?? null;
        const body = r?.body ?? "";

        const ratings =
          r?.ratings ?? r?.dimensionRatings ?? r?.dimension_ratings ?? [];

        const a = pickAuthor(r);

        const actor =
          a.authorActorId
            ? {
                id: a.authorActorId,
                kind: "user",
                displayName: a.displayName,
                username: a.username,
                avatar: a.avatar,
                route: `/profile/${a.authorActorId}`,
              }
            : null;

        return (
          <div
            key={id}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            {/* header row: avatar + name + time */}
            <div className="flex items-start justify-between gap-3">
              {actor ? (
                <ActorLink
                  actor={actor}
                  showUsername
                  showTimestamp
                  timestamp={timestamp}
                  avatarSize="w-10 h-10"
                  avatarShape="rounded-full"
                  textSize="text-sm"
                  className="min-w-0"
                />
              ) : (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full border border-white/10 bg-black/30 grid place-items-center overflow-hidden flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {a.displayName}
                    </div>
                    {a.username ? (
                      <div className="text-xs text-white/40 truncate">
                        @{a.username}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="text-xs text-white/40 whitespace-nowrap">
                {timestamp}
              </div>
            </div>

            {/* body */}
            {typeof overall === "number" || typeof overall === "string" ? (
              <div className="mt-3 text-sm font-semibold text-white">
                Overall: {overall}
              </div>
            ) : null}

            {body ? (
              <div className="mt-2 text-sm text-white/80">{body}</div>
            ) : null}

            {/* rating chips */}
            {Array.isArray(ratings) && ratings.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {ratings.map((rr, idx) => {
                  const k =
                    rr?.dimensionKey ??
                    rr?.dimension_key ??
                    rr?.key ??
                    `d-${idx}`;
                  const v = rr?.rating ?? rr?.value ?? "";
                  return (
                    <div
                      key={`${k}-${idx}`}
                      className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/80"
                    >
                      {k} {v}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
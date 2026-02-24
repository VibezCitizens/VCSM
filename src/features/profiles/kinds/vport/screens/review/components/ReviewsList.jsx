import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Star } from "lucide-react";

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

function formatDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(1);
}

function StarMeter({ value }) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;

  return (
    <div className="flex items-center gap-1" aria-label={`rating ${safe} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => {
        const active = safe >= step;
        return (
          <Star
            key={step}
            size={12}
            strokeWidth={2.2}
            className={active ? "text-amber-200" : "text-white/20"}
            fill={active ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

export default function ReviewsList({ loading, reviews }) {
  const rows = useMemo(() => (Array.isArray(reviews) ? reviews : []), [reviews]);

  if (loading) {
    return (
      <div className="profiles-subcard rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
        Loading reviews...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="profiles-subcard rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
        No reviews yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r, index) => {
        const id = r?.id ?? r?._id ?? `review-${index}`;

        const createdAt = r?.createdAt ?? r?.created_at ?? null;
        const timestamp = formatDateTime(createdAt);

        const overall = r?.overallRating ?? r?.overall_rating ?? null;
        const body = String(r?.body ?? "").trim();
        const isVerified = Boolean(r?.isVerified ?? r?.is_verified ?? false);

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
          <article
            key={id}
            className="profiles-subcard rounded-2xl border border-white/10 bg-black/20 p-4"
            aria-label="review card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              {actor ? (
                <Link to={actor.route} className="flex min-w-0 items-center gap-3 no-underline">
                  <img
                    src={actor.avatar || "/avatar.jpg"}
                    alt={actor.displayName}
                    className="h-11 w-11 shrink-0 rounded-xl border border-white/10 object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/avatar.jpg";
                    }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{actor.displayName}</div>
                    {actor.username ? (
                      <div className="truncate text-xs text-white/45">@{actor.username}</div>
                    ) : null}
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl border border-white/10 bg-black/30" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{a.displayName}</div>
                    {a.username ? (
                      <div className="truncate text-xs text-white/45">@{a.username}</div>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isVerified ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-sky-300/30 bg-sky-300/10 px-2 py-1 text-[11px] font-medium text-sky-100">
                    <ShieldCheck size={12} />
                    Verified
                  </div>
                ) : null}

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-xs text-white/80">
                  <StarMeter value={overall} />
                  <span className="font-semibold text-white">{formatScore(overall)}</span>
                </div>
              </div>
            </div>

            {timestamp ? (
              <div className="mt-2 text-xs text-white/45">{timestamp}</div>
            ) : null}

            {body ? (
              <p className="mt-3 text-sm leading-relaxed text-white/85">{body}</p>
            ) : (
              <p className="mt-3 text-sm italic text-white/45">No written details provided.</p>
            )}

          </article>
        );
      })}
    </div>
  );
}

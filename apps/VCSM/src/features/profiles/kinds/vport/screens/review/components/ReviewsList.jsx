import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, MessageSquare } from "lucide-react";

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
    "/avatar.jpg";

  return { authorActorId, displayName, username, avatar };
}

function formatDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
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
    <div className="flex items-center gap-0.5" aria-label={`rating ${safe} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => {
        const active = safe >= step;
        return (
          <Star
            key={step}
            size={12}
            strokeWidth={2}
            className={active ? "text-amber-300" : "text-white/15"}
            fill={active ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

export default function ReviewsList({ loading, reviews, viewerActorId = null, onEdit = null, onDelete = null, hasMore = false, loadingMore = false, onLoadMore = null }) {
  const rows = useMemo(() => (Array.isArray(reviews) ? reviews : []), [reviews]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.02] py-10 px-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        <div className="text-sm text-white/40">Loading reviews...</div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.02] py-10 px-4">
        <MessageSquare size={28} className="text-white/15" />
        <div className="text-sm font-medium text-white/40">No reviews yet</div>
        <div className="text-xs text-white/25">Be the first to share your experience.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r, index) => {
        const id = r?.id ?? r?._id ?? `review-${index}`;
        const isOptimistic = r?.isOptimistic === true;

        const createdAt = r?.reviewActivityAt ?? r?.createdAt ?? r?.created_at ?? null;
        const timestamp = formatDateTime(createdAt);

        const overall = r?.overallRating ?? r?.overall_rating ?? null;
        const body = String(r?.body ?? "").trim();

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
            className={[
              "rounded-2xl border p-4 transition-all",
              isOptimistic
                ? "border-sky-300/20 bg-sky-300/[0.04] animate-pulse"
                : "border-white/8 bg-white/[0.02]",
            ].join(" ")}
            aria-label="review card"
          >
            {/* Author row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {actor ? (
                  <Link to={actor.route} className="shrink-0 no-underline">
                    <img
                      src={actor.avatar || "/avatar.jpg"}
                      alt={actor.displayName}
                      className="h-10 w-10 rounded-2xl border border-white/10 object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/avatar.jpg";
                      }}
                    />
                  </Link>
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {actor ? (
                      <Link to={actor.route} className="truncate text-sm font-semibold text-white no-underline hover:text-white/80">
                        {actor.displayName}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-semibold text-white">{a.displayName}</span>
                    )}
                    {isOptimistic ? (
                      <span className="text-[10px] font-medium text-sky-300/60">Posting...</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/35">
                    {a.username ? <span>@{a.username}</span> : null}
                    {a.username && timestamp ? <span>·</span> : null}
                    {timestamp ? <span>{timestamp}</span> : null}
                  </div>
                </div>
              </div>

              {/* Rating pill */}
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-2.5 py-1.5">
                <StarMeter value={overall} />
                <span className="text-xs font-bold text-white">{formatScore(overall)}</span>
              </div>
            </div>

            {/* Body */}
            {body ? (
              <p className="mt-3 text-sm leading-relaxed text-white/80">{body}</p>
            ) : (
              <p className="mt-3 text-sm text-white/25 italic">No comment provided.</p>
            )}

            {/* Actions (own review) */}
            {viewerActorId && a.authorActorId && String(viewerActorId) === String(a.authorActorId) && !isOptimistic ? (
              <div className="mt-3 flex items-center gap-2 border-t border-white/6 pt-3">
                {typeof onEdit === "function" ? (
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="rounded-full border border-sky-300/25 bg-sky-300/8 px-3 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-300/15 transition-colors"
                  >
                    Edit
                  </button>
                ) : null}
                {typeof onDelete === "function" ? (
                  <button
                    type="button"
                    onClick={() => onDelete(r)}
                    className="rounded-full border border-red-400/25 bg-red-400/8 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-400/15 transition-colors"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}

      {hasMore && typeof onLoadMore === "function" ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mt-1 w-full rounded-xl border border-white/8 bg-white/[0.02] py-3 text-center text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/70 disabled:opacity-50 transition-colors"
        >
          {loadingMore ? "Loading..." : "Load more reviews"}
        </button>
      ) : null}
    </div>
  );
}

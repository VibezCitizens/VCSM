// src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import { useVportReviews } from "@/features/profiles/kinds/vport/hooks/review/useVportReviews";
import { useIdentity } from "@/state/identity/identityContext";
import { useActorConsistencyCheck } from "@debuggers/identity/useActorConsistencyCheck";

import ReviewsList from "./components/ReviewsList";
import { TabButton } from "@/features/profiles/kinds/vport/screens/review/components/VportReviewsControls";
import { ctrlSubmitReview } from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";

function formatAvg(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return n.toFixed(1);
}

function OverallStars({ value, size = 16 }) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;

  return (
    <div className="flex items-center gap-0.5" aria-label={`rating ${safe} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => {
        const active = safe >= step;
        return (
          <Star
            key={step}
            size={size}
            strokeWidth={2}
            className={active ? "text-amber-300" : "text-white/20"}
            fill={active ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

function InputStars({ value, onChange, label }) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((step) => {
        const active = safe >= step;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={[
              "grid h-10 w-10 place-items-center rounded-xl border transition-all",
              active
                ? "border-amber-300/40 bg-amber-300/15 text-amber-300 scale-105"
                : "border-white/10 bg-black/20 text-white/25 hover:border-white/25 hover:text-white/50",
            ].join(" ")}
            aria-label={`${label} ${step} stars`}
          >
            <Star size={18} strokeWidth={2} fill={active ? "currentColor" : "none"} />
          </button>
        );
      })}
    </div>
  );
}

export default function VportReviewsView({
  targetActorId: targetActorIdProp = null,
  profile = null,
  viewerActorId: _viewerActorId = null,
  mode = "public",
}) {
  const { identity } = useIdentity();
  const targetActorId = targetActorIdProp ?? profile?.actor_id ?? profile?.actorId ?? null;
  const sessionActorId = identity?.actorId ?? null;
  useActorConsistencyCheck('reviews', sessionActorId, identity?.kind);
  const reviewAuthorActorId = identity?.kind === "user" ? sessionActorId : null;

  const r = useVportReviews(targetActorId);

  const verifiedAvg = r.overallAverage ?? r.officialStats?.officialOverallAvg ?? r.officialStats?.official_overall_avg ?? "-";
  const verifiedCount = r.totalReviews ?? r.officialStats?.verifiedReviewCount ?? r.officialStats?.verified_review_count ?? 0;
  const isOwnerMode = mode === "owner";
  const formattedVerifiedAvg = formatAvg(verifiedAvg);

  const dynamicDimensions = useMemo(() => {
    const rows = (r.dimensions ?? [])
      .map((d, idx) => ({
        key: d?.dimension_key ?? d?.dimensionKey ?? `dim_${idx}`,
        label: d?.label ?? d?.dimension_key ?? d?.dimensionKey ?? `Dimension ${idx + 1}`,
      }))
      .filter((d) => d.key);

    return rows.length ? rows : [{ key: "overall_experience", label: "Overall" }];
  }, [r.dimensions]);

  const [body, setBody] = useState("");
  const [ratingsMap, setRatingsMap] = useState({});
  const [activeDimKey, setActiveDimKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canCompose = !isOwnerMode && !!reviewAuthorActorId && reviewAuthorActorId !== targetActorId;
  const showComposeForm = canCompose && (!r.myExists || r.isEditing);
  const trimmedBody = body.trim();

  // Pre-fill ratings from myReview when entering edit mode
  useEffect(() => {
    if (!r.isEditing || !r.myReview?.ratings) return;
    const map = {};
    for (const rt of Array.isArray(r.myReview.ratings) ? r.myReview.ratings : []) {
      const key = rt?.dimensionKey ?? rt?.dimension_key;
      const val = Number(rt?.rating ?? 0);
      if (key && val >= 1 && val <= 5) map[key] = val;
    }
    setRatingsMap((prev) => ({ ...prev, ...map }));
  }, [r.isEditing, r.myReview]);

  useEffect(() => {
    setRatingsMap((prev) => {
      const next = {};
      for (const d of dynamicDimensions) {
        next[d.key] = Number(prev?.[d.key] ?? 0);
      }
      return next;
    });
  }, [dynamicDimensions]);

  useEffect(() => {
    if (!dynamicDimensions.length) {
      setActiveDimKey(null);
      return;
    }
    setActiveDimKey((prev) => {
      const stillExists = dynamicDimensions.some((d) => d.key === prev);
      return stillExists ? prev : dynamicDimensions[0].key;
    });
  }, [dynamicDimensions]);

  const activeDimension = useMemo(() => {
    if (!dynamicDimensions.length) return null;
    return dynamicDimensions.find((d) => d.key === activeDimKey) ?? dynamicDimensions[0];
  }, [dynamicDimensions, activeDimKey]);

  const normalizedRatings = useMemo(() => {
    return dynamicDimensions
      .map((d) => ({
        dimensionKey: d.key,
        rating: Number(ratingsMap?.[d.key] ?? 0),
      }))
      .filter((row) => Number.isFinite(row.rating) && row.rating >= 1 && row.rating <= 5);
  }, [dynamicDimensions, ratingsMap]);

  const ratedCount = normalizedRatings.length;
  const totalDims = dynamicDimensions.length;
  const allRated = ratedCount === totalDims && totalDims > 0;

  const handleSubmit = useCallback(async () => {
    setSubmitErr(null);

    if (!reviewAuthorActorId) {
      setSubmitErr(new Error("You must be signed in to leave a review."));
      return;
    }

    if (!normalizedRatings.length) {
      setSubmitErr(new Error("Rate at least one category before submitting."));
      return;
    }

    setSubmitting(true);

    // Build optimistic review for immediate display
    const now = new Date().toISOString();
    const optimisticId = "optimistic-" + crypto.randomUUID();
    const avgRating = normalizedRatings.reduce((s, x) => s + x.rating, 0) / normalizedRatings.length;

    const optimisticReview = {
      id: optimisticId,
      targetActorId,
      authorActorId: reviewAuthorActorId,
      body: trimmedBody || "",
      overallRating: Math.round(avgRating * 100) / 100,
      ratings: normalizedRatings.map((nr) => ({ dimensionKey: nr.dimensionKey, rating: nr.rating })),
      createdAt: now,
      updatedAt: now,
      reviewActivityAt: now,
      authorDisplayName: identity?.displayName ?? "You",
      authorUsername: identity?.username ?? "",
      authorAvatarUrl: identity?.avatarUrl ?? identity?.avatar ?? "",
      isOptimistic: true,
    };

    // Inject optimistic review into the hook's list
    if (typeof r.setActiveList === "function") {
      r.setActiveList((prev) => [optimisticReview, ...(Array.isArray(prev) ? prev : [])]);
    }

    try {
      const saved = await ctrlSubmitReview({
        targetActorId,
        authorActorId: reviewAuthorActorId,
        body: trimmedBody ? trimmedBody : null,
        ratings: normalizedRatings,
      });

      // Reconcile: replace optimistic with real
      if (typeof r.setActiveList === "function" && saved) {
        r.setActiveList((prev) =>
          (Array.isArray(prev) ? prev : []).map((rev) =>
            rev.id === optimisticId ? { ...saved, isOptimistic: false } : rev
          )
        );
      }

      setBody("");
      setRatingsMap(Object.fromEntries(dynamicDimensions.map((d) => [d.key, 0])));
      if (r.isEditing && typeof r.cancelEdit === "function") r.cancelEdit();

      // Reload stats (non-blocking)
      if (typeof r.reload === "function") r.reload();
    } catch (e) {
      // Rollback optimistic
      if (typeof r.setActiveList === "function") {
        r.setActiveList((prev) =>
          (Array.isArray(prev) ? prev : []).filter((rev) => rev.id !== optimisticId)
        );
      }
      setSubmitErr(e);
    } finally {
      setSubmitting(false);
    }
  }, [
    reviewAuthorActorId,
    normalizedRatings,
    targetActorId,
    trimmedBody,
    identity,
    r,
    dynamicDimensions,
  ]);

  const showServicesTab = useMemo(() => {
    return (r.services?.length ?? 0) > 0 || r.isServiceTab || r.tab === "services";
  }, [r.services, r.isServiceTab, r.tab]);

  if (!targetActorId) return null;

  return (
    <div className="profiles-card rounded-2xl p-5">

      {/* ── Summary Card ── */}
      <div className="profiles-subcard rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex flex-col items-center sm:items-start">
            <div className="text-4xl font-bold tracking-tight text-white">
              {formattedVerifiedAvg === "-" ? "-" : formattedVerifiedAvg}
            </div>
            <OverallStars value={verifiedAvg} size={18} />
          </div>
          <div className="flex flex-col items-center gap-1 sm:items-start sm:pt-1">
            <div className="text-sm font-medium text-white/80">
              {verifiedCount === 0
                ? "No reviews yet"
                : `Based on ${verifiedCount} ${verifiedCount === 1 ? "review" : "reviews"}`}
            </div>
            <div className="text-xs text-white/45">
              {isOwnerMode
                ? "Quality signals across all review dimensions"
                : "Ratings from verified community members"}
            </div>
          </div>
        </div>
      </div>

      {r.error ? (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          {String(r.error?.message ?? r.error)}
        </div>
      ) : null}

      {/* ── Owner Tabs ── */}
      {isOwnerMode ? (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <TabButton active={r.tab === "overall"} onClick={() => r.setTab("overall")}>Overall</TabButton>
            {showServicesTab ? (
              <TabButton active={r.tab === "services"} onClick={() => r.setTab("services")}>Services</TabButton>
            ) : null}
            {(r.dimensions ?? []).map((d) => {
              const key = d.dimension_key ?? d.dimensionKey;
              const label = d.label ?? key;
              if (!key) return null;
              return (
                <TabButton key={key} active={r.tab === key} onClick={() => r.setTab(key)}>
                  {label}
                </TabButton>
              );
            })}
          </div>

          {r.tab === "services" ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="text-xs font-semibold text-white/70">Service:</div>
              <select
                className="profiles-input rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                value={r.serviceId ?? ""}
                onChange={(e) => r.setServiceId(e.target.value || null)}
              >
                <option value="">Select service...</option>
                {(r.services ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {r.loadingServices ? <div className="text-xs text-white/40">Loading services...</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Compose Form ── */}
      {!isOwnerMode ? (
        canCompose && r.myExists && !r.isEditing ? (
          <div className="mt-5 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-sm text-white/60">You've already reviewed this place.</div>
            <button
              type="button"
              onClick={r.startEdit}
              className="rounded-full border border-sky-300/35 bg-sky-300/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-300/18 transition-colors"
            >
              Edit my review
            </button>
          </div>
        ) : showComposeForm ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            {/* Form header */}
            <div className="mb-4">
              <div className="text-base font-semibold text-white">
                {r.isEditing ? "Edit your review" : "Write a review"}
              </div>
              <div className="mt-1 text-xs text-white/45">
                Rate each category below, then add an optional comment.
              </div>
            </div>

            {/* Step 1: Dimension pills — all visible */}
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
              Choose a category
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {dynamicDimensions.map((d) => {
                const isActive = d.key === activeDimKey;
                const val = Number(ratingsMap?.[d.key] ?? 0);
                const isRated = val >= 1 && val <= 5;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setActiveDimKey(d.key)}
                    className={[
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                      isActive
                        ? "border-sky-300/40 bg-sky-300/12 text-sky-100"
                        : isRated
                          ? "border-amber-300/25 bg-amber-300/8 text-amber-200/80"
                          : "border-white/10 bg-black/20 text-white/50 hover:border-white/20 hover:text-white/70",
                    ].join(" ")}
                  >
                    <span>{d.label}</span>
                    {isRated ? (
                      <span className="flex items-center gap-0.5 text-xs">
                        <Star size={10} fill="currentColor" strokeWidth={0} />
                        {val}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Step 2: Star rating for active dimension */}
            {activeDimension ? (
              <div className="rounded-xl border border-white/8 bg-black/15 px-4 py-4 mb-4">
                <div className="mb-2 text-sm font-medium text-white/80">
                  How would you rate <span className="text-white">{activeDimension.label}</span>?
                </div>
                <div className="flex items-center justify-between gap-3">
                  <InputStars
                    value={Number(ratingsMap?.[activeDimension.key] ?? 0)}
                    label={activeDimension.label}
                    onChange={(next) => setRatingsMap((prev) => ({ ...(prev ?? {}), [activeDimension.key]: next }))}
                  />
                  <div className="text-sm font-semibold text-white/60">
                    {Number(ratingsMap?.[activeDimension.key] ?? 0)
                      ? `${Number(ratingsMap?.[activeDimension.key] ?? 0)} / 5`
                      : "Not rated"}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Progress indicator */}
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-300/50 transition-all duration-300"
                  style={{ width: totalDims > 0 ? `${(ratedCount / totalDims) * 100}%` : "0%" }}
                />
              </div>
              <div className="text-xs text-white/45 whitespace-nowrap">
                {ratedCount} of {totalDims} rated
              </div>
            </div>

            {/* Step 3: Comment */}
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/40 flex items-center gap-1.5">
              <MessageSquare size={11} />
              Comment (optional)
            </div>
            <textarea
              className="w-full min-h-20 resize-none rounded-xl border border-white/8 bg-black/20 p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors"
              rows={3}
              placeholder="Share your experience — what stood out?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            {submitErr ? (
              <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                {String(submitErr?.message ?? submitErr)}
              </div>
            ) : null}

            {/* Submit area */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-white/35">
                {allRated
                  ? "All categories rated — ready to submit"
                  : ratedCount > 0
                    ? `${totalDims - ratedCount} more ${totalDims - ratedCount === 1 ? "category" : "categories"} to rate`
                    : "Pick a category above to start"}
              </div>
              <div className="flex items-center gap-2">
                {r.isEditing ? (
                  <button
                    type="button"
                    onClick={r.cancelEdit}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={submitting || !normalizedRatings.length}
                  onClick={handleSubmit}
                  className={[
                    "rounded-full px-5 py-2 text-sm font-semibold transition-all",
                    submitting
                      ? "bg-white/8 text-white/30 cursor-wait"
                      : !normalizedRatings.length
                        ? "bg-white/5 text-white/25 cursor-not-allowed border border-white/8"
                        : "border border-sky-300/40 bg-sky-300/15 text-sky-100 hover:bg-sky-300/22",
                  ].join(" ")}
                >
                  {submitting ? "Submitting..." : r.isEditing ? "Update review" : "Submit review"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3 text-sm text-white/40">
            {!sessionActorId
              ? "Sign in to leave a review."
              : !reviewAuthorActorId
                ? "Switch to your personal profile to leave a review."
                : "You can't review your own page."}
          </div>
        )
      ) : null}

      {/* ── Reviews List ── */}
      <div className="mt-5">
        <ReviewsList
          loading={r.loadingActiveList}
          reviews={r.activeList}
          viewerActorId={reviewAuthorActorId}
          onEdit={() => r.startEdit()}
          onDelete={() => setShowDeleteConfirm(true)}
          hasMore={r.hasMore}
          loadingMore={r.loadingMore}
          onLoadMore={r.loadMore}
        />

        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/12 bg-slate-900 p-6">
              <div className="text-base font-semibold text-white">Delete your review?</div>
              <p className="mt-2 text-sm text-white/50">This will permanently remove your review. This can't be undone.</p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={r.isDeleting}
                  onClick={async () => {
                    await r.deleteMyReview();
                    setShowDeleteConfirm(false);
                  }}
                  className="rounded-full border border-red-400/35 bg-red-400/12 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/22 disabled:opacity-50"
                >
                  {r.isDeleting ? "Deleting..." : "Delete review"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

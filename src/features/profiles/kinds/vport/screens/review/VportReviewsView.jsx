// src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx
import React, { useMemo, useState, useCallback } from "react";
import { useVportReviews } from "@/features/profiles/kinds/vport/hooks/review/useVportReviews";

import ReviewsList from "./components/ReviewsList";
import { ctrlSubmitReview } from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";

/* ============================================================
   VIEW SCREEN (Domain View)
   - uses hooks
   - composes components
   ============================================================ */

function StarsRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="text-sm text-white/90">{label}</div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = Number(value) >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={[
                "h-8 w-8 rounded-full border text-sm",
                active
                  ? "border-white/30 bg-white/15 text-white"
                  : "border-white/10 bg-black/20 text-white/40",
              ].join(" ")}
              aria-label={`${label} ${n} stars`}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-semibold border",
        active
          ? "border-white/25 bg-white/10 text-white"
          : "border-white/10 bg-black/20 text-white/60 hover:text-white/80",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function VportReviewsView({
  // dashboard path uses this
  targetActorId: targetActorIdProp = null,

  // profile tab path may still pass profile
  profile = null,

  // passed through but not used here yet
  viewerActorId = null,

  // ✅ NEW: "public" (default) vs "owner" (dashboard management)
  mode = "public",
}) {
  const targetActorId =
    targetActorIdProp ?? profile?.actor_id ?? profile?.actorId ?? null;

  if (!targetActorId) return null;

  // ✅ HOOK MUST RECEIVE STRING (actor id), NOT OBJECT
  const r = useVportReviews(targetActorId);

  const dimCount = useMemo(() => (r.dimensions?.length ?? 0), [r.dimensions]);

  const verifiedAvg =
    r.stats?.official_overall_avg ?? r.stats?.officialOverallAvg ?? "—";

  const verifiedCount =
    r.stats?.verified_review_count ?? r.stats?.verifiedReviewCount ?? 0;

  const showingCount = r.displayCnt ?? (r.activeList?.length ?? 0);
  const showingAvg = r.displayAvg ?? "—";

  const isOwnerMode = mode === "owner";

  // =========================
  // Composer state (public mode)
  // =========================
  const [body, setBody] = useState("");
  const [ratings, setRatings] = useState(() => ({}));
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  // ✅ Owner dashboard never composes a review
  const canCompose = !isOwnerMode && !!viewerActorId && viewerActorId !== targetActorId;

  const setRatingForKey = useCallback((dimensionKey, rating) => {
    setRatings((prev) => ({ ...(prev ?? {}), [dimensionKey]: rating }));
  }, []);

  const normalizedRatings = useMemo(() => {
    const dims = r.dimensions ?? [];
    return dims
      .map((d) => {
        const key = d.dimension_key ?? d.dimensionKey;
        const val = ratings?.[key];
        if (!key) return null;
        if (!val) return null;
        return { dimensionKey: key, rating: Number(val) };
      })
      .filter(Boolean);
  }, [r.dimensions, ratings]);

  const handleSubmit = useCallback(async () => {
    setSubmitErr(null);

    if (!viewerActorId) {
      setSubmitErr(new Error("You must be signed in to leave a review."));
      return;
    }

    if (!normalizedRatings.length) {
      setSubmitErr(new Error("Pick at least one rating."));
      return;
    }

    setSubmitting(true);
    try {
      await ctrlSubmitReview({
        targetActorId,
        authorActorId: viewerActorId,
        body: body?.trim() ? body.trim() : null,
        ratings: normalizedRatings,
      });

      setBody("");
      setRatings({});
      if (typeof r.refetch === "function") r.refetch();
      if (typeof r.refresh === "function") r.refresh();
    } catch (e) {
      setSubmitErr(e);
    } finally {
      setSubmitting(false);
    }
  }, [viewerActorId, normalizedRatings, targetActorId, body, r]);

  // =========================
  // Owner management tabs (hook-driven)
  // =========================
  const showServicesTab = useMemo(() => {
    // show if hook says services tab OR services exist (either is fine)
    return (r.services?.length ?? 0) > 0 || r.isServiceTab || r.tab === "services";
  }, [r.services, r.isServiceTab, r.tab]);

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-white font-semibold text-lg">
          {isOwnerMode ? "Reviews Manager" : "Reviews"}
        </div>

        <div className="text-xs text-neutral-400 text-right">
          <div>
            Dimensions: {dimCount} • Verified Avg: {verifiedAvg} • Verified Count: {verifiedCount}
          </div>
          <div>
            Showing: {showingCount} • Tab Avg: {showingAvg}
          </div>
        </div>
      </div>

      {r.error ? (
        <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {String(r.error?.message ?? r.error)}
        </div>
      ) : null}

      {/* =========================
          OWNER MODE: management controls (tabs + service picker)
         ========================= */}
      {isOwnerMode ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <TabButton active={r.tab === "overall"} onClick={() => r.setTab("overall")}>
              Overall
            </TabButton>

            {showServicesTab ? (
              <TabButton active={r.tab === "services"} onClick={() => r.setTab("services")}>
                Services
              </TabButton>
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
              <div className="text-xs text-white/70 font-semibold">Service:</div>

              <select
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                value={r.serviceId ?? ""}
                onChange={(e) => r.setServiceId(e.target.value || null)}
              >
                <option value="">Select service…</option>
                {(r.services ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {r.loadingServices ? (
                <div className="text-xs text-white/40">Loading services…</div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* =========================
          PUBLIC MODE ONLY: composer
         ========================= */}
      {!isOwnerMode ? (
        canCompose ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold text-white">Leave a review</div>

            <div className="mt-2">
              {(r.dimensions ?? []).map((d) => {
                const key = d.dimension_key ?? d.dimensionKey;
                const label = d.label ?? key;
                if (!key) return null;
                return (
                  <StarsRow
                    key={key}
                    label={label}
                    value={ratings?.[key] ?? 0}
                    onChange={(n) => setRatingForKey(key, n)}
                  />
                );
              })}
            </div>

            <textarea
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/30 outline-none"
              rows={3}
              placeholder="Write something (optional)…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            {submitErr ? (
              <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {String(submitErr?.message ?? submitErr)}
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  submitting
                    ? "bg-white/10 text-white/40"
                    : "bg-white text-black hover:bg-white/90",
                ].join(" ")}
              >
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-xs text-neutral-400">
            {viewerActorId ? "You can’t review your own vport." : "Sign in to leave a review."}
          </div>
        )
      ) : null}

      <div className="mt-4">
        <ReviewsList loading={r.loadingActiveList} reviews={r.activeList} />
      </div>
    </div>
  );
}
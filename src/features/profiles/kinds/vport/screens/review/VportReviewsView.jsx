// src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { ChevronDown, Star } from "lucide-react";
import { useVportReviews } from "@/features/profiles/kinds/vport/hooks/review/useVportReviews";

import ReviewsList from "./components/ReviewsList";
import { TabButton } from "@/features/profiles/kinds/vport/screens/review/components/VportReviewsControls";
import { ctrlSubmitReview } from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";
import {
  detectSupportedLanguageFromText,
  getSupportedLanguageLabel,
} from "@/shared/lib/language/detectSupportedLanguage";

function formatAvg(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return n.toFixed(1);
}

function OverallStars({ value }) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;

  return (
    <div className="flex items-center gap-1" aria-label={`rating ${safe} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => {
        const active = safe >= step;
        return (
          <Star
            key={step}
            size={14}
            strokeWidth={2.2}
            className={active ? "text-amber-200" : "text-white/25"}
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
              "grid h-9 w-9 place-items-center rounded-xl border transition-colors",
              active
                ? "border-amber-200/35 bg-amber-200/15 text-amber-200"
                : "border-white/10 bg-black/20 text-white/30 hover:border-white/25 hover:text-white/60",
            ].join(" ")}
            aria-label={`${label} ${step} stars`}
          >
            <Star size={16} strokeWidth={2.2} fill={active ? "currentColor" : "none"} />
          </button>
        );
      })}
    </div>
  );
}

export default function VportReviewsView({
  targetActorId: targetActorIdProp = null,
  profile = null,
  viewerActorId = null,
  mode = "public",
}) {
  const targetActorId = targetActorIdProp ?? profile?.actor_id ?? profile?.actorId ?? null;

  const r = useVportReviews(targetActorId);

  const verifiedAvg = r.stats?.official_overall_avg ?? r.stats?.officialOverallAvg ?? "-";
  const verifiedCount = r.stats?.verified_review_count ?? r.stats?.verifiedReviewCount ?? 0;
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
  const [openDimensionKey, setOpenDimensionKey] = useState(null);
  const [isDimensionPickerOpen, setIsDimensionPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  const canCompose = !isOwnerMode && !!viewerActorId && viewerActorId !== targetActorId;
  const trimmedBody = body.trim();

  const detectedBodyLanguage = useMemo(() => {
    if (!trimmedBody) return "unknown";
    return detectSupportedLanguageFromText(trimmedBody);
  }, [trimmedBody]);

  const hasUnsupportedBodyLanguage = Boolean(trimmedBody) && detectedBodyLanguage === "unknown";

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
      setOpenDimensionKey(null);
      setIsDimensionPickerOpen(false);
      return;
    }
    setOpenDimensionKey((prev) => {
      const stillExists = dynamicDimensions.some((d) => d.key === prev);
      return stillExists ? prev : dynamicDimensions[0].key;
    });
  }, [dynamicDimensions]);

  const activeDimension = useMemo(() => {
    if (!dynamicDimensions.length) return null;
    return dynamicDimensions.find((d) => d.key === openDimensionKey) ?? dynamicDimensions[0];
  }, [dynamicDimensions, openDimensionKey]);

  const normalizedRatings = useMemo(() => {
    return dynamicDimensions
      .map((d) => ({
        dimensionKey: d.key,
        rating: Number(ratingsMap?.[d.key] ?? 0),
      }))
      .filter((row) => Number.isFinite(row.rating) && row.rating >= 1 && row.rating <= 5);
  }, [dynamicDimensions, ratingsMap]);

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

    if (hasUnsupportedBodyLanguage) {
      setSubmitErr(new Error("Review text must be English, Spanish, German, Portuguese, or Italian."));
      return;
    }

    setSubmitting(true);

    try {
      await ctrlSubmitReview({
        targetActorId,
        authorActorId: viewerActorId,
        body: trimmedBody ? trimmedBody : null,
        ratings: normalizedRatings,
      });

      setBody("");
      setRatingsMap(Object.fromEntries(dynamicDimensions.map((d) => [d.key, 0])));

      if (typeof r.refetch === "function") r.refetch();
      if (typeof r.refresh === "function") r.refresh();
    } catch (e) {
      setSubmitErr(e);
    } finally {
      setSubmitting(false);
    }
  }, [
    viewerActorId,
    normalizedRatings,
    targetActorId,
    trimmedBody,
    hasUnsupportedBodyLanguage,
    r,
    dynamicDimensions,
  ]);

  const showServicesTab = useMemo(() => {
    return (r.services?.length ?? 0) > 0 || r.isServiceTab || r.tab === "services";
  }, [r.services, r.isServiceTab, r.tab]);

  if (!targetActorId) return null;

  return (
    <div className="profiles-card rounded-2xl p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-lg font-semibold text-white">{isOwnerMode ? "Reviews Manager" : "Reviews"}</div>
          <div className="mt-1 text-xs text-white/55">
            {isOwnerMode
              ? "Track quality signals across all review dimensions."
              : "Verified feedback designed for trust and clarity."}
          </div>
        </div>

        <div className="profiles-subcard w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 md:w-auto md:min-w-[220px]">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Overall rating</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-xl font-semibold text-white">{formattedVerifiedAvg === "-" ? "-" : `${formattedVerifiedAvg}/5`}</div>
            <OverallStars value={verifiedAvg} />
          </div>
          <div className="mt-1 text-xs text-white/55">{verifiedCount} {verifiedCount === 1 ? "rating" : "ratings"}</div>
        </div>
      </div>

      {r.error ? (
        <div className="profiles-error mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
          {String(r.error?.message ?? r.error)}
        </div>
      ) : null}

      {isOwnerMode ? (
        <div className="mt-4">
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

      {!isOwnerMode ? (
        canCompose ? (
          <div className="profiles-subcard mt-4 rounded-2xl border border-sky-300/20 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white">Vibez Reviews</div>
              <div className="text-xs text-white/50">Rate each area, then write your comment.</div>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="space-y-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                  <button
                    type="button"
                    onClick={() => setIsDimensionPickerOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left"
                    aria-expanded={isDimensionPickerOpen}
                  >
                    <div className="text-sm font-medium text-white">
                      {activeDimension?.label ?? "Select dimension"}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold text-white/75">
                        {activeDimension
                          ? (Number(ratingsMap?.[activeDimension.key] ?? 0) ? `${Number(ratingsMap?.[activeDimension.key] ?? 0)}/5` : "-")
                          : "-"}
                      </div>
                      <ChevronDown
                        size={14}
                        className={[
                          "transition-transform text-white/60",
                          isDimensionPickerOpen ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </div>
                  </button>

                  {isDimensionPickerOpen ? (
                    <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-1">
                      {dynamicDimensions.map((d) => {
                        if (d.key === activeDimension?.key) return null;
                        const val = Number(ratingsMap?.[d.key] ?? 0);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => {
                              setOpenDimensionKey(d.key);
                              setIsDimensionPickerOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-white/85 hover:bg-white/5"
                          >
                            <span>{d.label}</span>
                            <span className="text-xs text-white/55">{val ? `${val}/5` : "-"}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {activeDimension ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <InputStars
                      value={Number(ratingsMap?.[activeDimension.key] ?? 0)}
                      label={activeDimension.label}
                      onChange={(next) => setRatingsMap((prev) => ({ ...(prev ?? {}), [activeDimension.key]: next }))}
                    />
                    <div className="w-10 text-right text-sm font-semibold text-white/80">
                      {Number(ratingsMap?.[activeDimension.key] ?? 0)
                        ? `${Number(ratingsMap?.[activeDimension.key] ?? 0)}/5`
                        : "-"}
                    </div>
                  </div>
                ) : null}

                <div className="text-xs text-white/45">
                  {normalizedRatings.length} of {dynamicDimensions.length} rated
                </div>
              </div>
            </div>

            <textarea
              className="profiles-input mt-3 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/35 outline-none"
              rows={4}
              placeholder="Write something (optional)..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className={["mt-2 text-xs", hasUnsupportedBodyLanguage ? "text-amber-300" : "text-white/50"].join(" ")}>
              {trimmedBody
                ? hasUnsupportedBodyLanguage
                  ? "Language not detected or unsupported. Use English, Spanish, German, Portuguese, or Italian."
                  : `Detected language: ${getSupportedLanguageLabel(detectedBodyLanguage)}`
                : "Supported languages: English, Spanish, German, Portuguese, Italian."}
            </div>

            {submitErr ? (
              <div className="profiles-error mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
                {String(submitErr?.message ?? submitErr)}
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                disabled={submitting || hasUnsupportedBodyLanguage}
                onClick={handleSubmit}
                className={[
                  "profiles-pill-btn rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  (submitting || hasUnsupportedBodyLanguage)
                    ? "bg-white/10 text-white/40"
                    : "border-sky-300/40 bg-sky-300/15 text-sky-100 hover:bg-sky-300/20",
                ].join(" ")}
              >
                {submitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-xs text-neutral-400">
            {viewerActorId ? "You cannot review your own vport." : "Sign in to leave a review."}
          </div>
        )
      ) : null}

      <div className="mt-4">
        <ReviewsList loading={r.loadingActiveList} reviews={r.activeList} />
      </div>
    </div>
  );
}

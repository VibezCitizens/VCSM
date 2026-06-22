// src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "@i18n";
import { useVportReviews } from "@/features/profiles/kinds/vport/hooks/review/useVportReviews";
import { useVportReviewCompose } from "@/features/profiles/kinds/vport/hooks/review/useVportReviewCompose";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useActorConsistencyCheck } from "@debuggers/identity/useActorConsistencyCheck";
import { useVportProfileContextOptional } from "@/features/profiles/kinds/vport/context/VportProfileContext";

import ReviewsList from "./components/ReviewsList";
import { TabButton } from "@/features/profiles/kinds/vport/screens/review/components/VportReviewsControls";
import { OverallStars } from "@/features/profiles/kinds/vport/screens/review/components/VportReviewStars";
import { VportReviewComposeForm } from "@/features/profiles/kinds/vport/screens/review/components/VportReviewComposeForm";
import { VportReviewDeleteModal } from "@/features/profiles/kinds/vport/screens/review/components/VportReviewDeleteModal";

function formatAvg(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return n.toFixed(1);
}

export default function VportReviewsView({
  targetActorId: targetActorIdProp = null,
  profile = null,
  viewerActorId: _viewerActorId = null,
  mode: modeProp = null,
}) {
  const { t } = useTranslation();
  const { identity } = useIdentity();
  const profileCtx = useVportProfileContextOptional();
  const contextMode = modeProp ?? profileCtx?.mode ?? "public";
  const targetActorId = targetActorIdProp ?? profile?.actor_id ?? profile?.actorId ?? null;
  const sessionActorId = identity?.actorId ?? null;
  useActorConsistencyCheck('reviews', sessionActorId, identity?.kind);
  const reviewAuthorActorId = identity?.kind === "user" ? sessionActorId : null;

  const r = useVportReviews(targetActorId);

  const verifiedAvg = r.overallAverage ?? r.officialStats?.officialOverallAvg ?? r.officialStats?.official_overall_avg ?? "-";
  const verifiedCount = r.totalReviews ?? r.officialStats?.verifiedReviewCount ?? r.officialStats?.verified_review_count ?? 0;
  const isOwnerMode = contextMode === "owner";
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canCompose = !isOwnerMode && !!reviewAuthorActorId && reviewAuthorActorId !== targetActorId;

  const compose = useVportReviewCompose({
    dynamicDimensions,
    reviewAuthorActorId,
    myReview: r.myReview,
    isEditing: r.isEditing,
    cancelEdit: r.cancelEdit,
    submitReview: r.submitReview,
  });

  const showServicesTab = useMemo(() => {
    return (r.services?.length ?? 0) > 0 || r.isServiceTab || r.tab === "services";
  }, [r.services, r.isServiceTab, r.tab]);

  if (!targetActorId) return null;

  return (
    <div className="profiles-card rounded-2xl p-5">

      {/* Summary */}
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
                ? t('vport.reviewsView.noReviews')
                : verifiedCount === 1
                  ? t('vport.reviewsView.basedOn', { count: verifiedCount })
                  : t('vport.reviewsView.basedOnPlural', { count: verifiedCount })}
            </div>
            <div className="text-xs text-white/45">
              {isOwnerMode
                ? "Quality signals across all review dimensions"
                : t('vport.reviewsView.communityRatings')}
            </div>
          </div>
        </div>
      </div>

      {r.error ? (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          {String(r.error?.message ?? r.error)}
        </div>
      ) : null}

      {/* Owner Tabs */}
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
                <TabButton key={key} active={r.tab === key} onClick={() => r.setTab(key)}>{label}</TabButton>
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

      {/* Compose Form (public mode only) */}
      {!isOwnerMode ? (
        <VportReviewComposeForm
          canCompose={canCompose}
          myExists={r.myExists}
          isEditing={r.isEditing}
          reviewAuthorActorId={reviewAuthorActorId}
          sessionActorId={sessionActorId}
          targetActorId={targetActorId}
          dynamicDimensions={dynamicDimensions}
          activeDimKey={compose.activeDimKey}
          setActiveDimKey={compose.setActiveDimKey}
          activeDimension={compose.activeDimension}
          ratingsMap={compose.ratingsMap}
          setRatingsMap={compose.setRatingsMap}
          normalizedRatings={compose.normalizedRatings}
          ratedCount={compose.ratedCount}
          totalDims={compose.totalDims}
          body={compose.body}
          setBody={compose.setBody}
          submitting={compose.submitting}
          submitErr={compose.submitErr}
          onSubmit={compose.handleSubmit}
          onStartEdit={r.startEdit}
          onCancelEdit={r.cancelEdit}
        />
      ) : null}

      {/* Reviews List */}
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

        <VportReviewDeleteModal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          isDeleting={r.isDeleting}
          onDelete={async () => {
            await r.deleteMyReview();
            setShowDeleteConfirm(false);
          }}
        />
      </div>
    </div>
  );
}

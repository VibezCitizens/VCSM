// src/features/profiles/kinds/vport/screens/views/tabs/review/VportReviewsView.jsx
import React, { useEffect, useMemo } from "react";
import { useVportReviews } from "@/features/profiles/kinds/vport/hooks/review/useVportReviews";

import ReviewsHeader from "./components/ReviewsHeader";
import ServicesPicker from "./components/ServicesPicker";
import ReviewComposer from "./components/ReviewComposer";
import ReviewsList from "./components/ReviewsList";
import OverallDashboard from "./components/OverallDashboard";

import { getReviewDimensionsForVportType } from "@/features/profiles/kinds/vport/config/reviewDimensions.config";

export default function VportReviewsView({
  profile,
  viewerActorId,
  initialReviewTab = null,
  onConsumedInitialTab,
}) {
  const targetActorId = profile?.actor_id ?? profile?.actorId ?? null;
  if (!targetActorId) return null;

  const ownerActorId = profile?.ownerActorId ?? null;

  const isSelf =
    (viewerActorId ?? null) === (targetActorId ?? null) ||
    (ownerActorId != null && (viewerActorId ?? null) === ownerActorId);

  const vportType =
    profile?.vportType || profile?.type || profile?.vport_type || null;

  const vportGroup =
    profile?.vportGroup || profile?.group || profile?.vport_group || null;

  // ✅ dimensions from config (always available, always updates by type/group)
  const dimensions = useMemo(() => {
    const dims = getReviewDimensionsForVportType(vportType, vportGroup);
    return (Array.isArray(dims) ? dims : []).filter((d) => d?.key !== "vibez");
  }, [vportType, vportGroup]);

  const r = useVportReviews({ targetActorId, viewerActorId, vportType });

  const selectedServiceName = useMemo(
    () => r?.selectedService?.name ?? null,
    [r?.selectedService]
  );

  // ✅ allow parent to preselect a tab (ex: "food") once
  useEffect(() => {
    if (!initialReviewTab) return;
    r.setTab?.(initialReviewTab);
    onConsumedInitialTab?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReviewTab]);

  const isOverallTab = r.tab === "overall";

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <ReviewsHeader
        profile={profile}
        tab={r.tab}
        setTab={r.setTab}
        tabLabel={r.tabLabel}
        displayCnt={r.displayCnt}
        displayAvg={r.displayAvg}
        isServiceTab={r.isServiceTab}
        selectedServiceName={selectedServiceName}
        hasServices={(r.services?.length ?? 0) > 0}
        dimensions={dimensions}
      />

      <ServicesPicker
        isServiceTab={r.isServiceTab}
        loadingServices={r.loadingServices}
        services={r.services}
        serviceId={r.serviceId}
        setServiceId={r.setServiceId}
      />

      {/* ✅ Overall is read-only dashboard (NO composer, NO list) */}
      {isOverallTab ? (
        <OverallDashboard
          dimensions={dimensions}
          overallAvg={r.overallAvg}
          overallCount={r.overallCount}
          dimStats={r.dimStats}
          recentComments={r.recentComments}
        />
      ) : (
        <>
          <ReviewComposer
            tab={r.tab}
            viewerActorId={viewerActorId}
            tabLabel={r.tabLabel}
            isServiceTab={r.isServiceTab}
            serviceId={r.serviceId}
            myLoading={r.myLoading}
            myExists={r.myExists}
            rating={r.rating}
            setRating={r.setRating}
            body={r.body}
            setBody={r.setBody}
            saving={r.saving}
            handleSave={r.handleSave}
            msg={r.msg}
            disabledBecauseSelf={isSelf}
          />

          <ReviewsList loading={r.loadingActiveList} list={r.activeList} />
        </>
      )}

      <div className="mt-4 text-xs text-neutral-400">
        Vport: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}

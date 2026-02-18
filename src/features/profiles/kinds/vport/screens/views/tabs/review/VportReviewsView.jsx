// src/features/profiles/kinds/vport/screens/views/tabs/review/VportReviewsView.jsx
import React, { useEffect } from "react";
import { useVportReviews } from "@/features/profiles/kinds/vport/hooks/review/useVportReviews";

import ReviewsHeader from "./components/ReviewsHeader";
import ServicesPicker from "./components/ServicesPicker";
import ReviewComposer from "./components/ReviewComposer";
import ReviewsList from "./components/ReviewsList";

export default function VportReviewsView({
  profile,
  viewerActorId,
  initialReviewTab = null,
  onConsumedInitialTab,
}) {
  const targetActorId = profile?.actor_id ?? profile?.actorId ?? null;
  if (!targetActorId) return null;

  const ownerActorId = profile?.ownerActorId ?? null;

  // ✅ if I'm the vport actor OR I'm the vport owner -> no self reviews
  const isSelf =
    (viewerActorId ?? null) === (targetActorId ?? null) ||
    (ownerActorId != null && (viewerActorId ?? null) === ownerActorId);

  const r = useVportReviews({ targetActorId, viewerActorId });

  // ✅ allow parent to preselect a tab (ex: "food") once
  useEffect(() => {
    if (!initialReviewTab) return;
    r.setTab?.(initialReviewTab);
    onConsumedInitialTab?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReviewTab]);

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <ReviewsHeader
        tab={r.tab}
        setTab={r.setTab}
        tabLabel={r.tabLabel}
        displayCnt={r.displayCnt}
        displayAvg={r.displayAvg}
        isServiceTab={r.isServiceTab}
        selectedServiceName={r.selectedService?.name ?? null}
      />

      <ServicesPicker
        isServiceTab={r.isServiceTab}
        loadingServices={r.loadingServices}
        services={r.services}
        serviceId={r.serviceId}
        setServiceId={r.setServiceId}
      />

      <ReviewComposer
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

      <div className="mt-4 text-xs text-neutral-400">
        Vport: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}

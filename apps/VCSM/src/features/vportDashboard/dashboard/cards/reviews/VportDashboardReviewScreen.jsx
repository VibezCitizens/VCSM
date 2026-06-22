import { useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import VportReviewsView from "@/features/profiles/kinds/vport/adapters/screens/review/VportReviewsView.adapter";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import { createVportDashboardShellStyles } from "@/features/vportDashboard/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/shared/ui/dashboard/BackButton";
import { useVportReviews } from "./hooks/useVportReviews";

export default function VportDashboardReviewScreen({ targetActorId: targetActorIdProp }) {
  const navigate = useNavigate();
  const params = useParams();
  const isDesktop = useDesktopBreakpoint();

  const targetActorId = useMemo(
    () => targetActorIdProp ?? params?.actorId ?? null,
    [targetActorIdProp, params]
  );

  const { viewerActorId, isOwner, ownershipLoading } = useVportReviews({ actorId: targetActorId });

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1100 });

  if (!targetActorId) return null;
  if (ownershipLoading)
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  if (!isOwner)
    return <div className="p-10 text-center text-white/50">You can only view reviews for your own vport.</div>;

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton
              isDesktop={isDesktop}
              onClick={() => navigate(`/actor/${targetActorId}/dashboard`)}
            />
            <div style={shell.title}>REVIEWS</div>
            <div style={shell.rightSpacer} />
          </div>
          <div style={{ padding: 16 }}>
            <VportReviewsView
              targetActorId={targetActorId}
              viewerActorId={viewerActorId}
              mode="owner"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

import { useCallback } from "react";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import { useVportDashboardContext } from "@/features/vportDashboard/adapters/vportDashboard.adapter";
import VportDashboardGasView from "@/features/vportDashboard/dashboard/cards/gasprices/screens/VportDashboardGasView";

export function VportDashboardGasScreen() {
  const navigate = useNavigate();
  const { identity, identityLoading } = useIdentity();
  const isDesktop = useDesktopBreakpoint();

  const { loading: ownershipLoading, vportActorId: actorId, canManage: isOwner } = useVportDashboardContext();

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  if (!actorId) return null;
  if (identityLoading || ownershipLoading) {
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  }
  if (!identity) {
    return (
      <div className="p-10 text-center text-white/50">Sign in required.</div>
    );
  }
  if (!isOwner) {
    return (
      <div className="p-10 text-center text-white/50">
        You can only manage gas prices for your own vport.
      </div>
    );
  }

  const content = (
    <VportDashboardGasView
      actorId={actorId}
      identity={identity}
      isDesktop={isDesktop}
      isOwner={isOwner}
      onBack={goBack}
    />
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "auto",
          background: "#000",
        }}
      >
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

export default VportDashboardGasScreen;

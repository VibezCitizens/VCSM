import { useCallback, useMemo } from "react";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import VportBackButton from "@/shared/ui/dashboard/BackButton";
import { createVportDashboardShellStyles } from "@/features/vportDashboard/screens/styles/vportDashboardShellStyles";
import VportServicesView from "@/features/profiles/kinds/vport/adapters/screens/services/view/VportServicesView.adapter";

import { useVportServices } from "./hooks/useVportServices";

export function VportDashboardServicesScreen() {
  const navigate = useNavigate();
  const params = useParams();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const isDesktop = useDesktopBreakpoint();

  const { identity, identityLoading, viewerActorId, isOwner, ownershipLoading } =
    useVportServices({ actorId });

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  if (identityLoading || ownershipLoading)
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  if (!identity)
    return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  if (!actorId)
    return <div className="p-6 text-sm text-white/50">Invalid vport.</div>;
  if (!isOwner)
    return (
      <div className="p-10 text-center text-white/50">
        You can only manage services for your own vport.
      </div>
    );

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1100 });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={goBack} />
            <div style={shell.title}>SERVICES</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }}>
            <VportServicesView
              actorId={actorId}
              viewerActorId={viewerActorId}
              allowOwnerEditing={true}
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

export default VportDashboardServicesScreen;

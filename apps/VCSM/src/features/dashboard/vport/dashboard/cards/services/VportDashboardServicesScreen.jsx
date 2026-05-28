// src/features/dashboard/vport/screens/VportDashboardServicesScreen.jsx

import React, { useCallback, useMemo } from "react";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import VportServicesView from "@/features/profiles/adapters/kinds/vport/screens/services/view/VportServicesView.adapter";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/shared/components/BackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";

export function VportDashboardServicesScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const isDesktop = useDesktopBreakpoint();
  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  if (identityLoading || ownershipLoading) {
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  }

  if (!identity) {
    return (
      <div className="p-10 text-center text-white/50">Sign in required.</div>
    );
  }

  if (!actorId) {
    return <div className="p-6 text-sm text-white/50">Invalid vport.</div>;
  }

  if (!isOwner) {
    return (
      <div className="p-10 text-center text-white/50">
        You can only manage services for your own vport.
      </div>
    );
  }

  const shell = createVportDashboardShellStyles({
    isDesktop,
    maxWidthDesktop: 1100,
  });

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

export default VportDashboardServicesScreen;


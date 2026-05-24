// src/features/dashboard/vport/screens/VportDashboardReviewScreen.jsx
import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import VportReviewsView from "@/features/profiles/adapters/kinds/vport/screens/review/VportReviewsView.adapter";
import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";

export default function VportDashboardReviewScreen({
  targetActorId: targetActorIdProp,
}) {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();

  const targetActorId = useMemo(() => {
    return targetActorIdProp ?? params?.actorId ?? null;
  }, [targetActorIdProp, params]);

  const viewerActorId = identity?.actorId ?? null;
  const isDesktop = useDesktopBreakpoint();
  const { isOwner } = useVportOwnership(viewerActorId, targetActorId);
  const shell = createVportDashboardShellStyles({
    isDesktop,
    maxWidthDesktop: 1100,
  });

  if (!targetActorId) return null;

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
              mode={isOwner ? "owner" : "public"}
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


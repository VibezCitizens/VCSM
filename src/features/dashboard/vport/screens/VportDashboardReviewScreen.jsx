// src/features/dashboard/vport/screens/VportDashboardReviewScreen.jsx
import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import VportReviewsView from "@/features/profiles/kinds/vport/screens/review/VportReviewsView";
import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import {
  ModernButton,
  ModernContainer,
  ModernPage,
  ModernShell,
  ModernTopBar,
} from "@/features/ui/modern/ModernPrimitives";

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
  const isOwner =
    Boolean(targetActorId) &&
    Boolean(viewerActorId) &&
    String(viewerActorId) === String(targetActorId);

  if (!targetActorId) return null;

  const content = (
    <ModernPage>
      <ModernContainer isDesktop={isDesktop} style={{ maxWidth: isDesktop ? 1100 : 900 }}>
        <ModernShell>
          <ModernTopBar
            title="REVIEWS"
            left={
              <ModernButton onClick={() => navigate(`/actor/${targetActorId}/dashboard`)}>
                {isDesktop ? "<- Back" : "<"}
              </ModernButton>
            }
          />
          <div style={{ padding: 16 }}>
            <VportReviewsView
              targetActorId={targetActorId}
              viewerActorId={viewerActorId}
              mode={isOwner ? "owner" : "public"}
            />
          </div>
        </ModernShell>
      </ModernContainer>
    </ModernPage>
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


import React, { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createFlyerEditorScreenStyles } from "@/features/dashboard/flyerBuilder/model/vportActorMenuFlyerEditorScreen.styles";
import VportDesignStudioViewScreen from "@/features/dashboard/flyerBuilder/designStudio/screens/VportDesignStudioViewScreen";

export function VportActorMenuFlyerEditorScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const isDesktop = useDesktopBreakpoint();
  const viewerActorId = identity?.actorId ?? null;
  const isOwner =
    Boolean(actorId) &&
    Boolean(viewerActorId) &&
    String(viewerActorId) === String(actorId);

  const styles = useMemo(() => createFlyerEditorScreenStyles(), []);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  const openPreview = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/menu/flyer`);
  }, [navigate, actorId]);

  if (!actorId) return null;
  if (identityLoading) {
    return <div className="p-10 text-center text-neutral-400">Loading...</div>;
  }
  if (!identity) {
    return (
      <div className="p-10 text-center text-neutral-400">Sign in required.</div>
    );
  }
  if (!isOwner) {
    return (
      <div className="p-10 text-center text-neutral-400">
        You can only edit flyers for your own vport.
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div style={styles.mobileOnlyPage}>
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontWeight: 950, letterSpacing: 1.2, fontSize: 16 }}>
            Desktop Only
          </div>
          <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
            Please open this editor on a desktop screen.
          </div>
          <VportBackButton
            isDesktop={false}
            onClick={goBack}
            style={{ ...styles.btn("soft"), marginTop: 16 }}
          />
        </div>
      </div>
    );
  }

  const content = (
    <div style={styles.page}>
      <div className="flyer-editor-scope" style={styles.container}>
        <div className="flyer-editor-header" style={styles.header}>
          <VportBackButton
            isDesktop={isDesktop}
            onClick={goBack}
            style={styles.btn("soft")}
          />

          <div
            className="flyer-editor-title"
            style={{ fontWeight: 950, letterSpacing: 1.2 }}
          >
            VPORT CANVAS STUDIO
          </div>

          <button
            className="flyer-editor-preview"
            type="button"
            onClick={openPreview}
            style={styles.btn("glow")}
          >
            Public preview
          </button>
        </div>

        <VportDesignStudioViewScreen
          actorId={actorId}
          starter={{
            documentTitle: "VPORT Flyer Studio",
            title: "Digital Menu",
            subtitle: "Scan and explore",
            note: "Create premium page designs and export instantly",
            accentColor: "#b572ff",
          }}
          onOpenPreview={openPreview}
        />
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "hidden",
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

export default VportActorMenuFlyerEditorScreen;

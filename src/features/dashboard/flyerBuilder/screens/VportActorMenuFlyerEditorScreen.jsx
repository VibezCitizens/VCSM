import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";

import FlyerEditorPanel from "@/features/dashboard/flyerBuilder/components/FlyerEditorPanel";
import { fetchFlyerPublicDetailsByActorId } from "@/features/dashboard/flyerBuilder/dal/flyer.read.dal";
import { makeFlyerDraftFromPublicDetails } from "@/features/dashboard/flyerBuilder/model/flyerDraft.model";

export function VportActorMenuFlyerEditorScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  const [publicDetails, setPublicDetails] = useState(null);
  const [draft, setDraft] = useState(null);
  const [screenLoading, setScreenLoading] = useState(false);

  // ✅ reactive desktop detection
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 821px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(min-width: 821px)");
    const onChange = () => setIsDesktop(mq.matches);

    onChange();

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (!actorId) return;

    let alive = true;

    (async () => {
      setScreenLoading(true);
      try {
        const d = await fetchFlyerPublicDetailsByActorId(actorId);
        if (!alive) return;

        setPublicDetails(d || null);
        setDraft(makeFlyerDraftFromPublicDetails(d || {}));
      } catch (e) {
        if (!alive) return;
        setPublicDetails(null);
        setDraft(makeFlyerDraftFromPublicDetails({}));
      } finally {
        if (!alive) return;
        setScreenLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const vportId = useMemo(
    () => publicDetails?.vport_id ?? null,
    [publicDetails]
  );

  // ✅ canonical routes (actor-first)
  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  const openPreview = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/menu/flyer`);
  }, [navigate, actorId]);

  const onSaved = useCallback((res) => {
    setPublicDetails((prev) => ({
      ...(prev || {}),
      ...(res || {}),
      vport_id: prev?.vport_id ?? res?.vport_id ?? null,
    }));
  }, []);

  if (!actorId) return null;

  // ✅ desktop-only lock (since you said this screen is only desktop view)
  if (!isDesktop) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background:
            "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontWeight: 950, letterSpacing: 1.2, fontSize: 16 }}>
            Desktop Only
          </div>
          <div style={{ marginTop: 10, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
            Please open this editor on a desktop screen.
          </div>
          <button
            type="button"
            onClick={goBack}
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
              letterSpacing: 0.3,
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const page = {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
    color: "#fff",
    padding: 18,
  };

  // ✅ real desktop width
  const container = {
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    paddingBottom: 80,
    display: "grid",
    gap: 12,
  };

  const header = {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(12,14,24,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  };

  const btn = (variant = "soft") => ({
    padding: "10px 12px",
    borderRadius: 14,
    border:
      variant === "soft"
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,255,240,0.22)",
    background:
      variant === "soft"
        ? "rgba(255,255,255,0.06)"
        : "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: 0.3,
  });

  const content = (
    <div style={page}>
      <div className="flyer-editor-scope" style={container}>
        <div className="flyer-editor-header" style={header}>
          <button
            className="flyer-editor-back"
            type="button"
            onClick={goBack}
            style={btn("soft")}
          >
            ← Back
          </button>

          <div
            className="flyer-editor-title"
            style={{ fontWeight: 950, letterSpacing: 1.2 }}
          >
            EDIT FLYER
          </div>

          <button
            className="flyer-editor-preview"
            type="button"
            onClick={openPreview}
            style={btn("soft")}
          >
            Preview
          </button>
        </div>

        {screenLoading || !draft ? (
          <div className="flex justify-center py-20 text-neutral-400">
            Loading…
          </div>
        ) : (
          <FlyerEditorPanel
            vportId={vportId}
            draft={draft}
            setDraft={setDraft}
            onSaved={onSaved}
          />
        )}
      </div>
    </div>
  );

  // ✅ KEY FIX: escape RootLayout/mobile frame using portal overlay
  if (typeof document !== "undefined") {
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

export default VportActorMenuFlyerEditorScreen;
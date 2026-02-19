import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import { useIsActorOwner } from "@/features/profiles/kinds/vport/hooks/menu/useIsActorOwner";

import FlyerEditorPanel from "@/features/dashboard/flyerBuilder/components/FlyerEditorPanel";
import { fetchFlyerPublicDetailsByActorId } from "@/features/dashboard/flyerBuilder/dal/flyer.read.dal";
import { makeFlyerDraftFromPublicDetails } from "@/features/dashboard/flyerBuilder/model/flyerDraft.model";

export function VportActorMenuFlyerEditorScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  const { isOwner, loading } = useIsActorOwner({
    actorId,
    viewerActorId: identity?.actorId,
  });

  const [publicDetails, setPublicDetails] = useState(null);
  const [draft, setDraft] = useState(null);
  const [screenLoading, setScreenLoading] = useState(false);

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

  const vportId = useMemo(() => publicDetails?.vport_id ?? null, [publicDetails]);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/vport/${actorId}/dashboard`);
  }, [navigate, actorId]);

  const onSaved = useCallback((res) => {
    setPublicDetails((prev) => ({
      ...(prev || {}),
      ...(res || {}),
      vport_id: prev?.vport_id ?? res?.vport_id ?? null,
    }));
  }, []);

  const page = {
    height: "100vh",
    overflowY: "auto",
    width: "100%",
    background:
      "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
    color: "#fff",
    padding: 18,
  };

  const container = {
    width: "100%",
    maxWidth: 900,
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
    flexWrap: "wrap", // ✅ mobile: allow wrapping instead of squeezing
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

  if (!actorId) return null;

  if (loading) {
    return (
      <div style={page}>
        <div className="flex justify-center py-20 text-neutral-400">
          Loading…
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div style={page}>
        <div className="flex justify-center py-20 text-neutral-400">
          Owner access only.
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      {/* ✅ MOBILE FIXES:
          - prevent iOS input-zoom by setting 16px on inputs/textarea/select
          - better header spacing on small screens
      */}
      <style>
        {`
          @media (max-width: 520px) {
            .flyer-editor-header {
              gap: 10px !important;
            }
            .flyer-editor-title {
              width: 100% !important;
              text-align: center !important;
              order: 2 !important;
            }
            .flyer-editor-back {
              order: 1 !important;
            }
            .flyer-editor-preview {
              order: 3 !important;
            }

            /* ✅ iOS Safari zoom fix */
            .flyer-editor-scope input,
            .flyer-editor-scope textarea,
            .flyer-editor-scope select {
              font-size: 16px !important;
            }
          }
        `}
      </style>

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
            onClick={() => navigate(`/vport/${actorId}/menu/flyer`)}
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
}

export default VportActorMenuFlyerEditorScreen;

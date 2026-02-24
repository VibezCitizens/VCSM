import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ClassicFlyer from "@/features/dashboard/qrcode/components/flyer/ClassicFlyer";
import PosterFlyer from "@/features/dashboard/qrcode/components/flyer/PosterFlyer";
import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";
import {
  asTextValue,
  buildFlyerActions,
  buildFlyerProfile,
  createFlyerViewStyles,
} from "@/features/dashboard/flyerBuilder/model/vportActorMenuFlyerView.model";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";

export function VportActorMenuFlyerView({
  actorId,
  variant: initialVariant = "classic",
}) {
  const navigate = useNavigate();
  const [publicDetails, setPublicDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState(initialVariant);
  const isDesktop = useDesktopBreakpoint();

  const menuUrl = useMemo(() => {
    if (!actorId) return "";
    return `${window.location.origin}/m/${actorId}`;
  }, [actorId]);

  useEffect(() => {
    if (!actorId) return;

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const details = await fetchVportPublicDetailsByActorId(actorId);
        if (alive) setPublicDetails(details || null);
      } catch {
        if (alive) setPublicDetails(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const profile = useMemo(() => buildFlyerProfile(publicDetails), [publicDetails]);
  const actions = useMemo(() => buildFlyerActions(publicDetails), [publicDetails]);
  const styles = useMemo(() => createFlyerViewStyles(), []);

  const onPrint = useCallback(() => {
    try {
      window.print();
    } catch {
      // no-op
    }
  }, []);

  const onBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (actorId) {
      navigate(`/vport/${actorId}`, { replace: true });
      return;
    }
    navigate(`/feed`, { replace: true });
  }, [navigate, actorId]);

  if (!actorId) return null;

  return (
    <div style={styles.page}>
      <div style={styles.headerWrap}>
        <div style={styles.headerInner}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <VportBackButton isDesktop={isDesktop} onClick={onBack} style={styles.pillBtn(false, "soft")} />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => setVariant("classic")}
              style={styles.pillBtn(variant === "classic", "soft")}
            >
              Classic
            </button>
            <button
              type="button"
              onClick={() => setVariant("poster")}
              style={styles.pillBtn(variant === "poster", "soft")}
            >
              Poster
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={onPrint} style={styles.pillBtn(false, "accent")}>
              Print
            </button>
          </div>
        </div>
      </div>

      {variant !== "poster" ? (
        <ClassicFlyer
          loading={loading}
          publicDetails={publicDetails}
          profile={profile}
          actions={actions}
          menuUrl={menuUrl}
          onPrint={onPrint}
          asText={asTextValue}
        />
      ) : (
        <PosterFlyer
          loading={loading}
          publicDetails={publicDetails}
          profile={profile}
          actions={actions}
          menuUrl={menuUrl}
          onPrint={onPrint}
          asText={asTextValue}
        />
      )}
    </div>
  );
}

export default VportActorMenuFlyerView;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { DashboardCard, VportBannerHeader } from "@/features/dashboard/vport/screens/components/VportDashboardParts";
import { buildDashboardCards } from "@/features/dashboard/vport/screens/model/buildDashboardCards";
import {
  ModernButton,
  ModernContainer,
  ModernPage,
  ModernShell,
  ModernTopBar,
} from "@/features/ui/modern/ModernPrimitives";

export function VportDashboardScreen() {
  const navigate = useNavigate();
  const { actorId = null } = useParams();
  const { identity, identityLoading } = useIdentity();

  const [publicDetails, setPublicDetails] = useState(null);
  const [headerLoading, setHeaderLoading] = useState(false);

  const isDesktop = useDesktopBreakpoint();
  const isOwner = Boolean(actorId) && Boolean(identity?.actorId) && String(identity.actorId) === String(actorId);

  useEffect(() => {
    if (!actorId) return;
    let alive = true;

    (async () => {
      setHeaderLoading(true);
      try {
        const data = await fetchVportPublicDetailsByActorId(actorId);
        if (alive) setPublicDetails(data || null);
      } catch {
        if (alive) setPublicDetails(null);
      } finally {
        if (alive) setHeaderLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const profile = useMemo(
    () => ({
      displayName: publicDetails?.display_name ?? publicDetails?.name ?? "Dashboard",
      username: publicDetails?.username ?? "",
      tagline: publicDetails?.tagline ?? "",
      bannerUrl: publicDetails?.banner_url ?? publicDetails?.bannerUrl ?? "",
      avatarUrl: publicDetails?.avatar_url ?? publicDetails?.avatarUrl ?? "",
    }),
    [publicDetails]
  );

  const goBack = useCallback(() => actorId && navigate(`/profile/${actorId}`), [navigate, actorId]);
  const openQr = useCallback(() => actorId && navigate(`/actor/${actorId}/menu/qr`), [navigate, actorId]);
  const openFlyer = useCallback(() => actorId && navigate(`/actor/${actorId}/menu/flyer`), [navigate, actorId]);
  const openFlyerEditor = useCallback(() => actorId && navigate(`/actor/${actorId}/menu/flyer/edit`), [navigate, actorId]);
  const openOnlineMenuPreview = useCallback(() => actorId && navigate(`/actor/${actorId}/menu`), [navigate, actorId]);
  const openExchangeRates = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/exchange`), [navigate, actorId]);
  const openServices = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/services`), [navigate, actorId]);
  const openReviews = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/reviews`), [navigate, actorId]);
  const openGasPrices = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/gas`), [navigate, actorId]);
  const openAdsPipeline = useCallback(() => actorId && navigate(`/ads/vport/${actorId}`), [navigate, actorId]);
  const openSettings = useCallback(() => actorId && navigate(`/actor/${actorId}/settings`), [navigate, actorId]);

  const cards = useMemo(
    () =>
      buildDashboardCards({
        isDesktop,
        handlers: {
          openQr,
          openFlyer,
          openFlyerEditor,
          openOnlineMenuPreview,
          openExchangeRates,
          openServices,
          openReviews,
          openGasPrices,
          openAdsPipeline,
          openSettings,
        },
      }),
    [
      isDesktop,
      openQr,
      openFlyer,
      openFlyerEditor,
      openOnlineMenuPreview,
      openExchangeRates,
      openServices,
      openReviews,
      openGasPrices,
      openAdsPipeline,
      openSettings,
    ]
  );

  if (!actorId) return null;
  if (identityLoading) return <div className="p-10 text-center text-neutral-400">Loading...</div>;
  if (!identity) return <div className="p-10 text-center text-neutral-400">Sign in required.</div>;
  if (!isOwner) return <div className="p-10 text-center text-neutral-400">You can only access the dashboard for your own vport.</div>;

  const content = (
    <ModernPage>
      <ModernContainer isDesktop={isDesktop} style={{ maxWidth: isDesktop ? 1140 : 900 }}>
        <ModernShell>
          <ModernTopBar
            title="VPORT DASHBOARD"
            left={
              <ModernButton onClick={goBack}>
                {isDesktop ? "<- Back" : "<"}
              </ModernButton>
            }
          />

          <VportBannerHeader profile={profile} headerLoading={headerLoading} />

          <div style={{ padding: "0 20px 24px 20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(240px, 1fr))",
                gap: isDesktop ? 16 : 12,
                marginTop: 16,
              }}
            >
              {cards.map((card) => (
                <DashboardCard
                  key={card.key}
                  title={card.title}
                  body={card.body}
                  onClick={card.onClick}
                  locked={Boolean(card.locked)}
                />
              ))}
            </div>
          </div>
        </ModernShell>
      </ModernContainer>
    </ModernPage>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>{content}</div>,
      document.body
    );
  }

  return content;
}

export default VportDashboardScreen;

import React, { useCallback, useMemo } from "react";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import { useVportPublicDetails } from "@/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { DashboardCard, VportBannerHeader } from "@/features/dashboard/vport/screens/components/VportDashboardParts";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { buildDashboardCards } from "@/features/dashboard/vport/screens/model/buildDashboardCards";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import {
  getDashboardViewByVportType,
  normalizeVportType,
} from "@/features/dashboard/vport/screens/model/dashboardViewByVportType.model";
import { normalizeDashboardVportDetails } from "@/features/dashboard/vport/model/dashboardVportDetails.model";

export function VportDashboardScreen() {
  const navigate = useNavigate();
  const { actorId = null } = useParams();
  const { identity, identityLoading } = useIdentity();
  const { loading: headerLoading, details: publicDetails } = useVportPublicDetails(actorId);
  const dashboardDetails = useMemo(
    () => normalizeDashboardVportDetails(publicDetails),
    [publicDetails]
  );

  const isDesktop = useDesktopBreakpoint();
  const isOwner = Boolean(actorId) && Boolean(identity?.actorId) && String(identity.actorId) === String(actorId);

  const profile = useMemo(
    () => ({
      displayName: dashboardDetails.name || "Dashboard",
      username: dashboardDetails.slug,
      tagline: dashboardDetails.tagline,
      bannerUrl: dashboardDetails.bannerUrl,
      avatarUrl: dashboardDetails.avatarUrl,
    }),
    [dashboardDetails]
  );

  const goBack = useCallback(() => actorId && navigate(`/profile/${actorId}`), [navigate, actorId]);
  const openQr = useCallback(() => actorId && navigate(`/actor/${actorId}/menu/qr`), [navigate, actorId]);
  const openFlyer = useCallback(() => {
    if (!actorId) return;
    const activeType = normalizeVportType(identity?.vportType ?? dashboardDetails.vportType ?? null);
    const query = activeType === "restaurant" ? "?variant=table" : "";
    navigate(`/actor/${actorId}/menu/flyer${query}`);
  }, [navigate, actorId, identity?.vportType, dashboardDetails.vportType]);
  const openFlyerEditor = useCallback(() => actorId && navigate(`/actor/${actorId}/menu/flyer/edit`), [navigate, actorId]);
  const openOnlineMenuPreview = useCallback(() => actorId && navigate(`/actor/${actorId}/menu`), [navigate, actorId]);
  const openExchangeRates = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/exchange`), [navigate, actorId]);
  const openServices = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/services`), [navigate, actorId]);
  const openReviews = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/reviews`), [navigate, actorId]);
  const openCalendar = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/calendar`), [navigate, actorId]);
  const openPortfolio = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/portfolio`), [navigate, actorId]);
  const openBookingHistory = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/booking-history`), [navigate, actorId]);
  const openLocksmith = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/locksmith`), [navigate, actorId]);
  const openGasPrices = useCallback(() => actorId && navigate(`/actor/${actorId}/dashboard/gas`), [navigate, actorId]);
  const openAdsPipeline = useCallback(() => actorId && navigate(`/ads/vport/${actorId}`), [navigate, actorId]);
  const openSettings = useCallback(() => actorId && navigate(`/actor/${actorId}/settings`), [navigate, actorId]);

  const vportType = useMemo(
    () => normalizeVportType(identity?.vportType ?? dashboardDetails.vportType ?? null),
    [identity?.vportType, dashboardDetails.vportType]
  );

  const dashboardView = useMemo(() => getDashboardViewByVportType(vportType), [vportType]);

  const cards = useMemo(
    () =>
      buildDashboardCards({
        isDesktop,
        vportType,
        handlers: {
          openQr,
          openFlyer,
          openFlyerEditor,
          openOnlineMenuPreview,
          openPortfolio,
          openBookingHistory,
          openLocksmith,
          openExchangeRates,
          openServices,
          openReviews,
          openCalendar,
          openGasPrices,
          openAdsPipeline,
          openSettings,
        },
      }),
    [
      isDesktop,
      vportType,
      openQr,
      openFlyer,
      openFlyerEditor,
      openOnlineMenuPreview,
      openPortfolio,
      openBookingHistory,
      openLocksmith,
      openExchangeRates,
      openServices,
      openReviews,
      openCalendar,
      openGasPrices,
      openAdsPipeline,
      openSettings,
    ]
  );

  if (!actorId) return null;
  if (identityLoading) return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  if (!identity) return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  if (!isOwner) return <div className="p-10 text-center text-white/50">You can only access the dashboard for your own vport.</div>;

  const shell = createVportDashboardShellStyles({
    isDesktop,
    maxWidthDesktop: 1140,
  });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={goBack} />
            <div style={shell.title}>VPORT DASHBOARD</div>
            <div style={shell.rightSpacer} />
          </div>

          <VportBannerHeader profile={profile} headerLoading={headerLoading} />

          <div style={{ padding: "0 20px 24px 20px" }}>
            <div
              style={{
                marginTop: 10,
                marginBottom: 10,
                fontSize: 12,
                color: "rgba(226,232,240,0.72)",
                letterSpacing: 0.5,
              }}
            >
              Dashboard view: <strong style={{ color: "#f8fafc" }}>{dashboardView.label}</strong>
              {" • "}
              Type: <strong style={{ color: "#f8fafc", textTransform: "capitalize" }}>{vportType}</strong>
            </div>
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
        </div>
      </div>
    </div>
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

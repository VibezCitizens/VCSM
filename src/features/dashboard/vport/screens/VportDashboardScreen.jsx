// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\dashboard\vport\screens\VportDashboardScreen.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";

import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";

export function VportDashboardScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  const [publicDetails, setPublicDetails] = useState(null);
  const [headerLoading, setHeaderLoading] = useState(false);

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
      setHeaderLoading(true);
      try {
        const d = await fetchVportPublicDetailsByActorId(actorId);
        if (!alive) return;
        setPublicDetails(d || null);
      } catch (e) {
        if (!alive) return;
        setPublicDetails(null);
      } finally {
        if (!alive) return;
        setHeaderLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const profile = useMemo(() => {
    return {
      displayName:
        publicDetails?.display_name ?? publicDetails?.name ?? "Dashboard",
      username: publicDetails?.username ?? "",
      tagline: publicDetails?.tagline ?? "",
      bannerUrl: publicDetails?.banner_url ?? publicDetails?.bannerUrl ?? "",
      avatarUrl: publicDetails?.avatar_url ?? publicDetails?.avatarUrl ?? "",
    };
  }, [publicDetails]);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/profile/${actorId}`);
  }, [navigate, actorId]);

  // ✅ QR Code
  const openQr = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/menu/qr`);
  }, [navigate, actorId]);

  // ✅ Printable Flyer (preview)
  const openFlyer = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/menu/flyer`);
  }, [navigate, actorId]);

  // ✅ Edit Flyer
  const openFlyerEditor = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/menu/flyer/edit`);
  }, [navigate, actorId]);

  // ✅ Preview Online Menu (PUBLIC MENU, not flyer)
  const openOnlineMenuPreview = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/menu`);
  }, [navigate, actorId]);

  const openSettings = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/settings`);
  }, [navigate, actorId]);

  const openGasPrices = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard/gas`);
  }, [navigate, actorId]);

  // ✅ Reviews (NEW)
  const openReviews = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard/reviews`);
  }, [navigate, actorId]);

  if (!actorId) return null;

  const bannerImage = profile.bannerUrl?.trim()
    ? `url(${profile.bannerUrl})`
    : null;
  const avatarImage = profile.avatarUrl?.trim()
    ? `url(${profile.avatarUrl})`
    : null;

  const desktopOnlyLocked = !isDesktop;

  const page = {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
    color: "#fff",
    padding: 18,
  };

  const container = {
    width: "100%",
    maxWidth: isDesktop ? 1280 : 900,
    margin: "0 auto",
    paddingBottom: 56,
  };

  const headerWrap = {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(12,14,24,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
  };

  const topBar = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
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

  const cardGrid = {
    display: "grid",
    gridTemplateColumns: isDesktop
      ? "repeat(3, minmax(0, 1fr))"
      : "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
    marginTop: 14,
  };

  const cardBase = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 16,
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
    userSelect: "none",
  };

  const badge = {
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.75)",
    width: "fit-content",
  };

  const cardTitle = {
    fontSize: 14,
    fontWeight: 950,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  };

  const cardBody = {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.45,
  };

  const content = (
    <div style={page}>
      <div style={container}>
        <div style={headerWrap}>
          <div style={topBar}>
            <button type="button" onClick={goBack} style={btn("soft")}>
              ← Back
            </button>

            <div style={{ fontWeight: 950, letterSpacing: 1.2 }}>
              VPORT DASHBOARD
            </div>

            <div style={{ width: 110 }} />
          </div>

          <div
            style={{
              height: 170,
              position: "relative",
              backgroundColor: "#070812",
              backgroundImage: bannerImage
                ? bannerImage
                : "radial-gradient(900px 340px at 18% 20%, rgba(0,255,240,0.35), transparent 60%), radial-gradient(900px 340px at 82% 30%, rgba(124,58,237,0.30), transparent 62%), radial-gradient(700px 340px at 55% 90%, rgba(0,153,255,0.22), transparent 60%), linear-gradient(180deg, rgba(10,12,22,0.95), rgba(5,6,11,0.92))",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: bannerImage ? "saturate(1.05) contrast(1.05)" : "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
              }}
            />
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: 16,
              display: "flex",
              gap: 14,
              alignItems: "center",
              marginTop: -34,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: "#0b0b0f",
                backgroundImage: avatarImage ? avatarImage : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.65)",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.65)",
                fontWeight: 950,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {!avatarImage ? "VC" : null}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.6 }}>
                {headerLoading ? "Loading…" : profile.displayName}
              </div>

              {profile.username?.trim() ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.58)",
                    letterSpacing: 1.2,
                  }}
                >
                  @{profile.username}
                </div>
              ) : null}

              {profile.tagline?.trim() ? (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {profile.tagline}
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ padding: "0 16px 16px 16px" }}>
            <div style={cardGrid}>
              <div style={{ ...cardBase, cursor: "pointer" }} onClick={openQr}>
                <div style={cardTitle}>QR Code</div>
                <div style={cardBody}>
                  Open the QR screen for quick scanning and sharing.
                </div>
              </div>

              <div
                style={{
                  ...cardBase,
                  cursor: desktopOnlyLocked ? "not-allowed" : "pointer",
                  opacity: desktopOnlyLocked ? 0.55 : 1,
                }}
                onClick={() => {
                  if (desktopOnlyLocked) return;
                  openFlyer();
                }}
              >
                <div style={cardTitle}>Printable Flyer</div>
                <div style={cardBody}>
                  Open a print-optimized flyer with your QR for your menu.
                </div>
                {desktopOnlyLocked ? <div style={badge}>Desktop only</div> : null}
              </div>

              <div
                style={{
                  ...cardBase,
                  cursor: desktopOnlyLocked ? "not-allowed" : "pointer",
                  opacity: desktopOnlyLocked ? 0.55 : 1,
                }}
                onClick={() => {
                  if (desktopOnlyLocked) return;
                  openFlyerEditor();
                }}
              >
                <div style={cardTitle}>Edit Flyer</div>
                <div style={cardBody}>
                  Update headline, note, accent color, hours, and images.
                </div>
                {desktopOnlyLocked ? <div style={badge}>Desktop only</div> : null}
              </div>

              <div
                style={{ ...cardBase, cursor: "pointer" }}
                onClick={openOnlineMenuPreview}
              >
                <div style={cardTitle}>Preview Online Menu</div>
                <div style={cardBody}>
                  Preview how your online menu looks to customers.
                </div>
              </div>

              {/* ✅ Reviews (NEW CARD) */}
              <div style={{ ...cardBase, cursor: "pointer" }} onClick={openReviews}>
                <div style={cardTitle}>Reviews</div>
                <div style={cardBody}>
                  View and manage your reviews and overall rating.
                </div>
              </div>

              <div style={{ ...cardBase, cursor: "pointer" }} onClick={openGasPrices}>
                <div style={cardTitle}>Gas Prices</div>
                <div style={cardBody}>
                  Update official prices and review community suggestions.
                </div>
              </div>

              <div style={{ ...cardBase, cursor: "pointer" }} onClick={openSettings}>
                <div style={cardTitle}>Settings</div>
                <div style={cardBody}>
                  Edit public details, hours, highlights, and more.
                </div>
              </div>
            </div>
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

export default VportDashboardScreen;
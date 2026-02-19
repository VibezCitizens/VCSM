// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportActorMenuFlyerView.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import ClassicFlyer from "@/features/dashboard/qrcode/components/flyer/ClassicFlyer";
import PosterFlyer from "@/features/dashboard/qrcode/components/flyer/PosterFlyer";

import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";

export function VportActorMenuFlyerView({
  actorId,
  variant: initialVariant = "classic",
}) {
  const navigate = useNavigate();

  const [publicDetails, setPublicDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const [variant, setVariant] = useState(initialVariant);

  const asText = useCallback((v) => {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    return "";
  }, []);

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
        const d = await fetchVportPublicDetailsByActorId(actorId);
        if (!alive) return;
        setPublicDetails(d || null);
      } catch (e) {
        if (!alive) return;
        setPublicDetails(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const profile = useMemo(() => {
    const displayNameRaw =
      publicDetails?.display_name ?? publicDetails?.name ?? "Menu";

    return {
      displayName: asText(displayNameRaw) || "Menu",
      username: asText(publicDetails?.username),
      tagline: asText(publicDetails?.tagline),
      bannerUrl: asText(publicDetails?.banner_url ?? publicDetails?.bannerUrl),
      avatarUrl: asText(publicDetails?.avatar_url ?? publicDetails?.avatarUrl),
      logoUrl: asText(publicDetails?.logo_url ?? publicDetails?.logoUrl),
      address: asText(
        publicDetails?.address ??
          publicDetails?.street_address ??
          publicDetails?.streetAddress
      ),
      hours: asText(
        publicDetails?.hours ?? publicDetails?.open_hours ?? publicDetails?.openHours
      ),
      website: asText(
        publicDetails?.website ??
          publicDetails?.website_url ??
          publicDetails?.websiteUrl
      ),
      accent: asText(
        publicDetails?.accent ??
          publicDetails?.accent_color ??
          publicDetails?.accentColor
      ),
      flyerHeadline: asText(publicDetails?.flyer_headline ?? publicDetails?.flyerHeadline),
      flyerSubheadline: asText(
        publicDetails?.flyer_subheadline ?? publicDetails?.flyerSubheadline
      ),
    };
  }, [publicDetails, asText]);

  const actions = useMemo(() => {
    const directionsUrl =
      publicDetails?.directions_url ??
      publicDetails?.directionsUrl ??
      publicDetails?.maps_url ??
      publicDetails?.mapsUrl ??
      "";

    const phone =
      publicDetails?.phone ??
      publicDetails?.phone_number ??
      publicDetails?.phoneNumber ??
      "";

    const foodImage1 =
      publicDetails?.flyer_food_image_1 ??
      publicDetails?.flyerFoodImage1 ??
      "";
    const foodImage2 =
      publicDetails?.flyer_food_image_2 ??
      publicDetails?.flyerFoodImage2 ??
      "";

    return {
      directionsUrl: asText(directionsUrl).trim(),
      phone: asText(phone).trim(),
      foodImage1: asText(foodImage1).trim(),
      foodImage2: asText(foodImage2).trim(),
    };
  }, [publicDetails, asText]);

  const onPrint = useCallback(() => {
    try {
      window.print();
    } catch (_) {}
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

  // --- Scroll container (fixes iOS "not scrollable" issues) ---
  const page = {
    height: "100vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    background:
      "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
  };

  // --- Header styles (dark / glass like dashboard) ---
  const headerWrap = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    padding: 14,
    background:
      "linear-gradient(180deg, rgba(5,6,11,0.92) 0%, rgba(7,8,18,0.86) 55%, rgba(5,6,11,0.65) 100%)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const headerInner = {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const pillBtn = (active = false, tone = "soft") => ({
    padding: "10px 12px",
    borderRadius: 14,
    border:
      tone === "accent"
        ? "1px solid rgba(0,255,240,0.22)"
        : "1px solid rgba(255,255,255,0.12)",
    background: active
      ? "rgba(255,255,255,0.12)"
      : tone === "accent"
      ? "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))"
      : "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: 0.3,
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
  });

  return (
    <div style={page}>
      <div style={headerWrap}>
        <div style={headerInner}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <button type="button" onClick={onBack} style={pillBtn(false, "soft")}>
              ← Back
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => setVariant("classic")}
              style={pillBtn(variant === "classic", "soft")}
            >
              Classic
            </button>

            <button
              type="button"
              onClick={() => setVariant("poster")}
              style={pillBtn(variant === "poster", "soft")}
            >
              Poster
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={onPrint} style={pillBtn(false, "accent")}>
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
          asText={asText}
        />
      ) : (
        <PosterFlyer
          loading={loading}
          publicDetails={publicDetails}
          profile={profile}
          actions={actions}
          menuUrl={menuUrl}
          onPrint={onPrint}
          asText={asText}
        />
      )}
    </div>
  );
}

export default VportActorMenuFlyerView;

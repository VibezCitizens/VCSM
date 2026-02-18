// src/features/profiles/kinds/vport/screens/views/tabs/menu/VportActorMenuFlyerView.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";

import ClassicFlyer from "@/features/qrcode/components/flyer/ClassicFlyer";
import PosterFlyer from "@/features/qrcode/components/flyer/PosterFlyer";

import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";

export function VportActorMenuFlyerView({ actorId, variant: initialVariant = "classic" }) {
  const [publicDetails, setPublicDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 Template state (switcher)
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
    const displayNameRaw = publicDetails?.display_name ?? publicDetails?.name ?? "Menu";

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
      hours: asText(publicDetails?.hours ?? publicDetails?.open_hours ?? publicDetails?.openHours),
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

  if (!actorId) return null;

  return (
    <div>
      {/* 🔥 TEMPLATE SWITCHER UI */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 16,
          justifyContent: "center",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
        }}
      >
        <button
          type="button"
          onClick={() => setVariant("classic")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: variant === "classic" ? "2px solid #000" : "1px solid #ccc",
            background: variant === "classic" ? "#000" : "#fff",
            color: variant === "classic" ? "#fff" : "#000",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Classic
        </button>

        <button
          type="button"
          onClick={() => setVariant("poster")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: variant === "poster" ? "2px solid #000" : "1px solid #ccc",
            background: variant === "poster" ? "#000" : "#fff",
            color: variant === "poster" ? "#fff" : "#000",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Poster
        </button>
      </div>

      {/* 🔥 TEMPLATE RENDER */}
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

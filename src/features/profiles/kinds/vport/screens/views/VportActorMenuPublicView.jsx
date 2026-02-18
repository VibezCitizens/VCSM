import React, { useEffect, useMemo, useState } from "react";
import VportActorMenuPublicPanel from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuPublicPanel";
import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";

export function VportActorMenuPublicView({ actorId }) {
  const [q, setQ] = useState("");

  const [publicDetails, setPublicDetails] = useState(null);
  const [loadingHeader, setLoadingHeader] = useState(false);

  useEffect(() => {
    if (!actorId) return;

    let alive = true;

    (async () => {
      setLoadingHeader(true);
      try {
        const d = await fetchVportPublicDetailsByActorId(actorId);
        if (!alive) return;
        setPublicDetails(d || null);
      } catch (e) {
        if (!alive) return;
        setPublicDetails(null);
      } finally {
        if (!alive) return;
        setLoadingHeader(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const profile = useMemo(() => {
    return {
      displayName: publicDetails?.display_name ?? publicDetails?.name ?? "Menu",
      username: publicDetails?.username ?? "venue",
      tagline: publicDetails?.tagline ?? "Public Menu • Fast Scan Access",
      bannerUrl: publicDetails?.banner_url ?? publicDetails?.bannerUrl ?? "",
      avatarUrl: publicDetails?.avatar_url ?? publicDetails?.avatarUrl ?? "",
    };
  }, [publicDetails]);

  const actions = useMemo(() => {
    const reviewUrl = publicDetails?.review_url ?? publicDetails?.reviewUrl ?? "";
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

    return {
      reviewUrl: typeof reviewUrl === "string" ? reviewUrl.trim() : "",
      directionsUrl: typeof directionsUrl === "string" ? directionsUrl.trim() : "",
      phone: typeof phone === "string" ? phone.trim() : "",
    };
  }, [publicDetails]);

  if (!actorId) return null;

  const bannerImage = profile.bannerUrl?.trim() ? `url(${profile.bannerUrl})` : null;
  const avatarImage = profile.avatarUrl?.trim() ? `url(${profile.avatarUrl})` : null;

  const btnBase = (enabled) => ({
    borderRadius: 14,
    padding: "10px 12px",
    border: enabled ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.08)",
    background: enabled
      ? "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))"
      : "rgba(255,255,255,0.03)",
    color: enabled ? "#fff" : "rgba(255,255,255,0.45)",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 0.5,
    cursor: enabled ? "pointer" : "not-allowed",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  // ✅ public/ asset path (works in dev + prod)
  const vibezIconSrc = "/vibez-icon-512x512.png";

  const brandWrap = {
    marginTop: 18,
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(12,14,24,0.45)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
  };

  const brandTopGlow = {
    height: 3,
    width: "100%",
    background:
      "linear-gradient(90deg, rgba(0,255,240,0.8) 0%, rgba(124,58,237,0.85) 50%, rgba(0,153,255,0.75) 100%)",
    opacity: 0.9,
  };

  // ✅ UPDATED: rounded square (no circle)
  const logoBox = {
    width: 64,
    height: 64,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.60)",
    background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    overflow: "hidden",
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        background:
          "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          padding: 18,
          paddingBottom: 56,
          position: "relative",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(12,14,24,0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
          }}
        >
          <div
            style={{
              height: 190,
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

          {/* Avatar + Info + Right Buttons */}
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
                {loadingHeader ? "Loading…" : profile.displayName}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.58)",
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                }}
              >
                @{profile.username} • Public Menu
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.58)" }}>
                {profile.tagline}
              </div>
            </div>

            {/* RIGHT SIDE BUTTONS */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
              <button
                type="button"
                style={btnBase(!!actions.reviewUrl)}
                disabled={!actions.reviewUrl}
                onClick={() => {
                  if (!actions.reviewUrl) return;
                  window.open(actions.reviewUrl, "_blank", "noopener,noreferrer");
                }}
              >
                Leave a review
              </button>

              <button
                type="button"
                style={btnBase(!!actions.directionsUrl)}
                disabled={!actions.directionsUrl}
                onClick={() => {
                  if (!actions.directionsUrl) return;
                  window.open(actions.directionsUrl, "_blank", "noopener,noreferrer");
                }}
              >
                Directions
              </button>

              <button
                type="button"
                style={btnBase(!!actions.phone)}
                disabled={!actions.phone}
                onClick={() => {
                  if (!actions.phone) return;
                  window.location.href = `tel:${actions.phone}`;
                }}
              >
                Call
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: "0 16px 16px 16px" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search menu items…"
              style={{
                width: "100%",
                borderRadius: 14,
                padding: "12px 12px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                outline: "none",
                fontWeight: 750,
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <VportActorMenuPublicPanel actorId={actorId} query={q} />
        </div>

        {/* ✅ BOTTOM BRAND CALLOUT */}
        <div style={brandWrap}>
          <div style={brandTopGlow} />
          <div style={{ padding: 18, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
              <div style={logoBox}>
                <img
                  src={vibezIconSrc}
                  alt="Vibez Citizens"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "contain",
                    display: "block",
                    filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.55))",
                  }}
                  loading="lazy"
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 26,
                fontWeight: 1000,
                letterSpacing: 0.4,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              Vibez Citizens
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 14,
                color: "rgba(255,255,255,0.70)",
                lineHeight: "20px",
              }}
            >
              Built for the real world. Connect, earn, and support your local scene.
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: 0.4,
              }}
            >
              © {new Date().getFullYear()} Vibez Citizens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VportActorMenuPublicView;

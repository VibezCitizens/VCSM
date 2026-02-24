import React, { useEffect, useMemo, useState } from "react";
import VportActorMenuPublicPanel from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuPublicPanel";
import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";

export function VportActorMenuPublicView({ actorId, onLeaveReview }) {
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
      } catch {
        if (!alive) return;
        setPublicDetails(null);
      } finally {
        if (alive) setLoadingHeader(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const profile = useMemo(() => {
    return {
      displayName: publicDetails?.display_name ?? publicDetails?.name ?? "Menu",
      username: publicDetails?.username ?? "",
      tagline: publicDetails?.tagline ?? "",
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
    letterSpacing: 0.3,
    cursor: enabled ? "pointer" : "not-allowed",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  const headerWrap = {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(12,14,24,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
  };

  // ✅ actions row: keep wrap, but don't steal space from name
  const actionRow = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  };

  // ✅ NEW: make the top header row wrap, and push buttons to next line when needed
  const headerTopRow = {
    position: "relative",
    zIndex: 2,
    padding: 16,
    display: "flex",
    gap: 14,
    alignItems: "center",
    marginTop: -34,

    flexWrap: "wrap", // ✅ allow wrap instead of overlap
  };

  // ✅ NEW: ensure the name block has a sane minimum width so buttons wrap away
  const nameCol = {
    minWidth: 180, // ✅ gives the name room; buttons wrap below if not enough space
    flex: 1,
  };

  // ✅ NEW: make actions take full width on wrap line (prevents overlay)
  const actionsCol = {
    marginLeft: "auto",
    flexBasis: "100%", // ✅ when wrapping occurs, actions go to next line
    display: "flex",
    justifyContent: "flex-end",
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
        <div style={headerWrap}>
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

          <div style={headerTopRow}>
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

            <div style={nameCol}>
              <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.6 }}>
                {loadingHeader ? "Loading…" : profile.displayName}
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
                <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.58)" }}>
                  {profile.tagline}
                </div>
              ) : null}
            </div>

            <div style={actionsCol}>
              <div style={actionRow}>
                <button
                  type="button"
                  style={btnBase(!!onLeaveReview || !!actions.reviewUrl)}
                  disabled={!onLeaveReview && !actions.reviewUrl}
                  onClick={() => {
                    if (typeof onLeaveReview === "function") {
                      onLeaveReview();
                      return;
                    }
                    if (!actions.reviewUrl) return;
                    window.open(actions.reviewUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  Review
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
          </div>

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
      </div>
    </div>
  );
}

export default VportActorMenuPublicView;

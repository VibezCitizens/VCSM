import React, { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useDesktopBreakpoint from "@/features/public/vportMenu/hooks/useDesktopBreakpoint";
import { useVportPublicMenu } from "@/features/public/vportMenu/hooks/useVportPublicMenu";
import { useVportPublicDetails } from "@/features/public/vportMenu/hooks/useVportPublicDetails";
import VportPublicMenuPanel from "@/features/public/vportMenu/components/VportPublicMenuPanel";

function actionButtonStyle(enabled) {
  return {
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
  };
}

export function VportPublicMenuView({ actorId }) {
  const navigate = useNavigate();
  const isDesktop = useDesktopBreakpoint();
  const [query, setQuery] = useState("");

  const {
    categories,
    loading: menuLoading,
    error: menuError,
    rpcErrorCode: menuRpcErrorCode,
  } = useVportPublicMenu({ actorId });

  const {
    details,
    error: detailsError,
    rpcErrorCode: detailsRpcErrorCode,
  } = useVportPublicDetails({ actorId });

  const profile = useMemo(
    () => ({
      displayName: details?.displayName || details?.username || "VPORT",
      username: details?.username || "",
      tagline: details?.tagline || "",
      bannerUrl: details?.bannerUrl || "",
      avatarUrl: details?.avatarUrl || "",
      reviewUrl: details?.reviewUrl || "",
      directionsUrl: details?.directionsUrl || "",
      phone: details?.phone || "",
    }),
    [details]
  );

  const onBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/profile/${actorId}`, { replace: true });
  };

  if (!actorId) return null;

  const bannerImage = profile.bannerUrl ? `url(${profile.bannerUrl})` : null;
  const avatarImage = profile.avatarUrl ? `url(${profile.avatarUrl})` : null;

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
      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: 18, paddingBottom: 56 }}>
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(12,14,24,0.55)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
          }}
        >
          <div
            style={{
              minHeight: 56,
              padding: "14px 16px 10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              onClick={onBack}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                minHeight: 40,
                padding: isDesktop ? "0 16px" : "0 12px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {isDesktop ? "Back" : <ChevronLeft size={20} />}
            </button>

            <div style={{ fontWeight: 900, letterSpacing: 1, fontSize: 13 }}>ONLINE MENU</div>
            <div style={{ width: 48 }} />
          </div>

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

          <div style={{ padding: 16, marginTop: -34, position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
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
                  display: "grid",
                  placeItems: "center",
                  color: "rgba(255,255,255,0.65)",
                  fontWeight: 950,
                }}
              >
                {!avatarImage ? "VC" : null}
              </div>

              <div style={{ minWidth: 180, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.6 }}>
                  {profile.displayName}
                </div>
                {profile.username ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.58)", letterSpacing: 1.2 }}>
                    @{profile.username}
                  </div>
                ) : null}
                {profile.tagline ? (
                  <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.58)" }}>
                    {profile.tagline}
                  </div>
                ) : null}
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={actionButtonStyle(!!profile.reviewUrl)}
                  disabled={!profile.reviewUrl}
                  onClick={() => {
                    if (!profile.reviewUrl) return;
                    window.open(profile.reviewUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  Review
                </button>

                <button
                  type="button"
                  style={actionButtonStyle(!!profile.directionsUrl)}
                  disabled={!profile.directionsUrl}
                  onClick={() => {
                    if (!profile.directionsUrl) return;
                    window.open(profile.directionsUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  Directions
                </button>

                <button
                  type="button"
                  style={actionButtonStyle(!!profile.phone)}
                  disabled={!profile.phone}
                  onClick={() => {
                    if (!profile.phone) return;
                    window.location.href = `tel:${encodeURIComponent(profile.phone)}`;
                  }}
                >
                  Call
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu items..."
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
        </div>

        <div style={{ marginTop: 14 }}>
          <VportPublicMenuPanel
            categories={categories}
            query={query}
            loading={menuLoading}
            error={menuError}
            rpcErrorCode={menuRpcErrorCode}
          />

          {!menuError && !menuRpcErrorCode && (detailsError || detailsRpcErrorCode) ? (
            <div style={{ marginTop: 12, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
              Some header details are unavailable right now.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default VportPublicMenuView;

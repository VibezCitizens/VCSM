import React, { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useDesktopBreakpoint from "@/features/public/vportMenu/hooks/useDesktopBreakpoint";
import { useVportPublicMenu } from "@/features/public/vportMenu/hooks/useVportPublicMenu";
import { useVportPublicDetails } from "@/features/public/vportMenu/hooks/useVportPublicDetails";
import VportPublicMenuPanel from "@/features/public/vportMenu/components/VportPublicMenuPanel";
import { hasDirectionsAddress, openDirections } from "@/features/vport/utils/openDirections";

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
      address: details?.address ?? details?.raw?.address ?? null,
      phone: details?.phone || "",
    }),
    [details]
  );
  const canOpenDirections = hasDirectionsAddress(profile);

  const onBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/profile/${actorId}`, { replace: true });
  };

  if (!actorId) return null;

  const avatarImage = profile.avatarUrl ? `url(${profile.avatarUrl})` : null;

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        background:
          "radial-gradient(900px 500px at 15% 10%, var(--vc-gradient-a, rgba(108,77,246,0.15)), transparent 60%), " +
          "radial-gradient(800px 420px at 85% 90%, var(--vc-gradient-b, rgba(59,130,246,0.10)), transparent 60%), " +
          "var(--vc-bg-0, #0b0b0f)",
        color: "#fff",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: 18, paddingBottom: 56 }}>
        {/* Banner + card stacking layout */}
        <div style={{ position: 'relative' }}>
          {/* Banner image */}
          {profile.bannerUrl ? (
            <div
              style={{
                height: isDesktop ? 200 : 150,
                borderRadius: '20px 20px 0 0',
                overflow: 'hidden',
                background: `url(${profile.bannerUrl}) center/cover no-repeat`,
              }}
            />
          ) : (
            <div
              style={{
                height: isDesktop ? 200 : 150,
                borderRadius: '20px 20px 0 0',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))',
              }}
            />
          )}

          {/* Content card — overlaps banner */}
          <div
            style={{
              position: 'relative',
              marginTop: -40,
              borderRadius: 20,
              border: '1px solid var(--vc-border, rgba(139,92,246,0.18))',
              background: 'var(--vc-card-bg, linear-gradient(180deg, rgba(20,20,26,0.98), rgba(20,20,26,0.90)))',
              boxShadow: 'var(--vc-shadow-elevated, 0 24px 45px rgba(0,0,0,0.36))',
              zIndex: 2,
            }}
          >
            {/* Top bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isDesktop ? '12px 16px' : '10px 14px',
              }}
            >
              <button
                type="button"
                onClick={onBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: isDesktop ? '8px 14px' : '6px 8px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={18} strokeWidth={2} />
                {isDesktop && <span>Back</span>}
              </button>

              <div style={{ fontWeight: 700, letterSpacing: 1.2, fontSize: 13, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                Online Menu
              </div>
              <div style={{ width: isDesktop ? 80 : 36 }} />
            </div>

            {/* Profile info */}
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: '#0b0b0f',
                    backgroundImage: avatarImage || 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {!avatarImage ? 'VC' : null}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>
                    {profile.displayName}
                  </div>
                  {profile.username ? (
                    <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      @{profile.username}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={actionButtonStyle(!!profile.reviewUrl)} disabled={!profile.reviewUrl}
                  onClick={() => { if (profile.reviewUrl) window.open(profile.reviewUrl, '_blank', 'noopener,noreferrer') }}>
                  Review
                </button>
                <button type="button" style={actionButtonStyle(canOpenDirections)} disabled={!canOpenDirections}
                  onClick={() => openDirections(profile)}>
                  Directions
                </button>
                <button type="button" style={actionButtonStyle(!!profile.phone)} disabled={!profile.phone}
                  onClick={() => { if (profile.phone) window.location.href = `tel:${encodeURIComponent(profile.phone)}` }}>
                  Call
                </button>
              </div>

              {/* Search */}
              <div style={{ marginTop: 14 }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search menu items..."
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    padding: '12px',
                    border: '1px solid var(--vc-border, rgba(139,92,246,0.18))',
                    background: 'var(--vc-surface-input, rgba(14,12,22,0.78))',
                    color: '#fff',
                    outline: 'none',
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                />
              </div>
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

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VportActorMenuPublicPanel from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuPublicPanel";
import { useVportPublicDetails } from "@/features/profiles/kinds/vport/hooks/useVportPublicDetails";
import useDesktopBreakpoint from "@/features/dashboard/adapters/vport/screens/useDesktopBreakpoint.adapter";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/adapters/vport.adapter";
import { hasDirectionsAddress, openDirections } from "@/features/vport/adapters/vport.public.adapter";
import { toSafeExternalUrl, toSafePhone } from "@/features/profiles/kinds/vport/screens/menu/vportActorMenuPublic.model";
import {
  actionRow,
  actionsCol,
  getBtnBase,
  headerTopRow,
  headerWrap,
  nameCol,
} from "@/features/profiles/kinds/vport/screens/menu/vportActorMenuPublicView.styles";

export function VportActorMenuPublicView({ actorId, onLeaveReview }) {
  const navigate = useNavigate();
  const isDesktop = useDesktopBreakpoint();
  const [q, setQ] = useState("");
  const { loading: loadingHeader, details: publicDetails } = useVportPublicDetails(actorId);

  const profile = useMemo(() => ({
    displayName: publicDetails?.name ?? "Menu",
    username: publicDetails?.slug ?? "",
    tagline: publicDetails?.tagline ?? "",
    bannerUrl: publicDetails?.bannerUrl ?? "",
    avatarUrl: publicDetails?.avatarUrl ?? "",
  }), [publicDetails]);

  const actions = useMemo(() => {
    const reviewUrl = publicDetails?.review_url ?? publicDetails?.reviewUrl ?? "";
    const phone = publicDetails?.phonePublic ?? "";
    return {
      reviewUrl: toSafeExternalUrl(reviewUrl),
      phone: toSafePhone(phone),
    };
  }, [publicDetails]);

  const canOpenDirections = hasDirectionsAddress(publicDetails);
  const shell = useMemo(
    () => createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 900 }),
    [isDesktop]
  );

  const onBack = useCallback(() => {
    if (window.history.length > 1) { navigate(-1); return; }
    navigate(`/profile/${actorId}`, { replace: true });
  }, [navigate, actorId]);

  if (!actorId) return null;

  const bannerImage = profile.bannerUrl?.trim() ? `url(${profile.bannerUrl})` : null;
  const avatarImage = profile.avatarUrl?.trim() ? `url(${profile.avatarUrl})` : null;

  return (
    <div style={{ height: "100vh", width: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)", color: "#fff" }}>
      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: 18, paddingBottom: 56, position: "relative" }}>
        <div style={headerWrap}>
          <div style={{ ...shell.topBar, minHeight: "auto", padding: "14px 16px 10px 16px" }}>
            <button type="button" onClick={onBack}>
              {isDesktop ? (
                "Back"
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ChevronLeft size={22} />
                  <span>Back</span>
                </span>
              )}
            </button>
            <div style={{ ...shell.title, fontSize: isDesktop ? 14 : 13 }}>ONLINE MENU</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ height: 190, position: "relative", backgroundColor: "#070812", backgroundImage: bannerImage ? bannerImage : "radial-gradient(900px 340px at 18% 20%, rgba(0,255,240,0.35), transparent 60%), radial-gradient(900px 340px at 82% 30%, rgba(124,58,237,0.30), transparent 62%), radial-gradient(700px 340px at 55% 90%, rgba(0,153,255,0.22), transparent 60%), linear-gradient(180deg, rgba(10,12,22,0.95), rgba(5,6,11,0.92))", backgroundSize: "cover", backgroundPosition: "center", filter: bannerImage ? "saturate(1.05) contrast(1.05)" : "none" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)" }} />
          </div>

          <div style={headerTopRow}>
            <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: "#0b0b0f", backgroundImage: avatarImage ? avatarImage : "none", backgroundSize: "cover", backgroundPosition: "center", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 18px 50px rgba(0,0,0,0.65)", flexShrink: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.65)", fontWeight: 950, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {!avatarImage ? "VC" : null}
            </div>

            <div style={nameCol}>
              <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.6 }}>
                {loadingHeader ? "Loading…" : profile.displayName}
              </div>
              {profile.username?.trim() ? (
                <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.58)", letterSpacing: 1.2 }}>
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
                  style={getBtnBase(!!onLeaveReview || !!actions.reviewUrl)}
                  disabled={!onLeaveReview && !actions.reviewUrl}
                  onClick={() => {
                    if (typeof onLeaveReview === "function") { onLeaveReview(); return; }
                    if (!actions.reviewUrl) return;
                    window.open(actions.reviewUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  Review
                </button>
                <button type="button" style={getBtnBase(canOpenDirections)} disabled={!canOpenDirections} onClick={() => openDirections(publicDetails)}>
                  Directions
                </button>
                <button
                  type="button"
                  style={getBtnBase(!!actions.phone)}
                  disabled={!actions.phone}
                  onClick={() => { if (!actions.phone) return; window.location.href = `tel:${encodeURIComponent(actions.phone)}`; }}
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
              style={{ width: "100%", borderRadius: 14, padding: "12px 12px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "#fff", outline: "none", fontWeight: 750 }}
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

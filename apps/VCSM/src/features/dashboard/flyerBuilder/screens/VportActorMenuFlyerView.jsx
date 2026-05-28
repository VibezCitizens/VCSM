import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PrintableQrSheet } from "@/features/dashboard/flyerBuilder/components/printableQr/PrintableQrSheet";
import { ClassicFlyer, PosterFlyer } from "@/features/dashboard/qrcode/adapters/qrcode.adapter";
import VportBackButton from "@/features/dashboard/shared/components/BackButton";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import { useVportDashboardDetails } from "@/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter";
import { normalizeDashboardVportDetails } from "@/features/dashboard/vport/model/dashboardVportDetails.model";
import {
  asTextValue,
  buildFlyerActions,
  buildFlyerProfile,
  createFlyerViewStyles,
} from "@/features/dashboard/flyerBuilder/model/vportActorMenuFlyerView.model";
import { useActorCanonicalSlug } from "@/features/profiles/adapters/profiles.adapter";
import { buildMenuShortDisplayUrl, isQrSafeSlug } from "@/shared/lib/qrUrlBuilders";

const PRINTABLE_VARIANTS = Object.freeze(["table", "half", "full", "sticker"]);

function isPrintableVariant(value) {
  return PRINTABLE_VARIANTS.includes(String(value || "").toLowerCase());
}

export function VportActorMenuFlyerView({
  actorId,
  variant: initialVariant = "classic",
}) {
  const navigate = useNavigate();
  const { loading, details: publicDetails } = useVportDashboardDetails(actorId);
  const [variant, setVariant] = useState(initialVariant);
  const isDesktop = useDesktopBreakpoint();
  const dashboardDetails = useMemo(
    () => normalizeDashboardVportDetails(publicDetails),
    [publicDetails]
  );
  const { canonicalSlug } = useActorCanonicalSlug(actorId);

  // UUID guard — QR code and Print must not be available until slug resolves to a safe non-UUID value.
  // Uses the canonical isQrSafeSlug from qrUrlBuilders (single source of truth — VENOM V-004, ELEK-008).
  const isQrSafe = isQrSafeSlug(canonicalSlug);

  const menuUrl = useMemo(() => {
    if (!actorId) return "";
    if (canonicalSlug) return `${window.location.origin}/profile/${canonicalSlug}/menu`;
    return `${window.location.origin}/m/${actorId}`; // fallback while slug loads
  }, [actorId, canonicalSlug]);

  const profile = useMemo(() => buildFlyerProfile(dashboardDetails), [dashboardDetails]);
  const actions = useMemo(() => buildFlyerActions(dashboardDetails), [dashboardDetails]);
  const styles = useMemo(() => createFlyerViewStyles(), []);
  const printableVariant = isPrintableVariant(variant);
  const shortUrl = useMemo(() => {
    const slug = dashboardDetails.slug;
    if (slug) return buildMenuShortDisplayUrl(slug);
    // Fallback: strip protocol from full URL when slug is not yet resolved.
    return String(menuUrl || "").replace(/^https?:\/\//i, "");
  }, [menuUrl, dashboardDetails.slug]);

  const onPrint = useCallback(() => {
    try {
      window.print();
    } catch {
      // no-op
    }
  }, []);

  const onBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    // Never navigate to /vport/${actorId} — raw UUIDs must not appear in public-facing URL paths (VENOM V-005).
    // canonicalSlug is already resolved in this view (used for menuUrl).
    // Fall back to the internal /actor/:id/menu redirect route when slug is not yet available.
    if (canonicalSlug) {
      navigate(`/profile/${canonicalSlug}`, { replace: true });
    } else {
      navigate(`/actor/${actorId}/menu`, { replace: true });
    }
  }, [navigate, actorId, canonicalSlug]);

  if (!actorId) return null;

  return (
    <div className="flyer-print-page" style={styles.page}>
      <style>
        {`
          @media print {
            html,
            body,
            #root {
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
            }

            .flyer-print-page {
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              background: #fff !important;
            }

            .flyer-toolbar-print-hide {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="flyer-toolbar-print-hide" style={styles.headerWrap}>
        <div style={styles.headerInner}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <VportBackButton isDesktop={isDesktop} onClick={onBack} style={styles.pillBtn(false, "soft")} />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {printableVariant ? (
              <>
                <button
                  type="button"
                  onClick={() => setVariant("table")}
                  style={styles.pillBtn(variant === "table", "soft")}
                >
                  Table Cards (6/page)
                </button>
                <button
                  type="button"
                  onClick={() => setVariant("half")}
                  style={styles.pillBtn(variant === "half", "soft")}
                >
                  Half Page (2/page)
                </button>
                <button
                  type="button"
                  onClick={() => setVariant("full")}
                  style={styles.pillBtn(variant === "full", "soft")}
                >
                  Full Poster
                </button>
                <button
                  type="button"
                  onClick={() => setVariant("sticker")}
                  style={styles.pillBtn(variant === "sticker", "soft")}
                >
                  Sticker Sheet (12)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setVariant("classic")}
                  style={styles.pillBtn(variant === "classic", "soft")}
                >
                  Classic
                </button>
                <button
                  type="button"
                  onClick={() => setVariant("poster")}
                  style={styles.pillBtn(variant === "poster", "soft")}
                >
                  Poster
                </button>
                <button
                  type="button"
                  onClick={() => setVariant("table")}
                  style={styles.pillBtn(false, "soft")}
                >
                  Print Layouts
                </button>
              </>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            {/* Print disabled until slug resolves — prevents UUID from being encoded in printed QR (VENOM V-004). */}
            <button type="button" onClick={onPrint} disabled={!isQrSafe} style={styles.pillBtn(false, isQrSafe ? "accent" : "soft")}>
              {isQrSafe ? "Print" : "Preparing…"}
            </button>
          </div>
        </div>
      </div>

      {/* Flyer body gated on isQrSafe — slug must resolve before QR is rendered or printed (VENOM V-004). */}
      {!isQrSafe ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          Preparing flyer…
        </div>
      ) : printableVariant ? (
        <PrintableQrSheet
          layout={variant}
          businessName={profile.displayName || "Restaurant"}
          menuUrl={menuUrl}
          link={shortUrl}
          showPrintButton={false}
        />
      ) : variant !== "poster" ? (
        <ClassicFlyer
          loading={loading}
          profile={profile}
          actions={actions}
          menuUrl={menuUrl}
          onPrint={onPrint}
          asText={asTextValue}
        />
      ) : (
        <PosterFlyer
          loading={loading}
          profile={profile}
          actions={actions}
          menuUrl={menuUrl}
          onPrint={onPrint}
          asText={asTextValue}
        />
      )}
    </div>
  );
}

export default VportActorMenuFlyerView;

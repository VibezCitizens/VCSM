import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PrintableQrSheet } from "@/features/dashboard/flyerBuilder/components/printableQr/PrintableQrSheet";
import { ClassicFlyer, PosterFlyer } from "@/features/dashboard/qrcode/adapters/qrcode.adapter";
import { VportBackButton, useDesktopBreakpoint } from "@/features/dashboard/vport/adapters/vport.adapter";
import { useVportPublicDetails } from "@/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter";
import { normalizeDashboardVportDetails } from "@/features/dashboard/vport/model/dashboardVportDetails.model";
import {
  asTextValue,
  buildFlyerActions,
  buildFlyerProfile,
  createFlyerViewStyles,
} from "@/features/dashboard/flyerBuilder/model/vportActorMenuFlyerView.model";
import { useActorCanonicalSlug } from "@/features/profiles/hooks/useActorCanonicalSlug";

const PRINTABLE_VARIANTS = Object.freeze(["table", "half", "full", "sticker"]);

function isPrintableVariant(value) {
  return PRINTABLE_VARIANTS.includes(String(value || "").toLowerCase());
}

function buildShortUrl(menuUrl, slug) {
  const cleanSlug = String(slug || "").trim();
  if (cleanSlug) return `vibezcitizens.com/menu/${cleanSlug}`;
  return String(menuUrl || "").replace(/^https?:\/\//i, "");
}

export function VportActorMenuFlyerView({
  actorId,
  variant: initialVariant = "classic",
}) {
  const navigate = useNavigate();
  const { loading, details: publicDetails } = useVportPublicDetails(actorId);
  const [variant, setVariant] = useState(initialVariant);
  const isDesktop = useDesktopBreakpoint();
  const dashboardDetails = useMemo(
    () => normalizeDashboardVportDetails(publicDetails),
    [publicDetails]
  );
  const { canonicalSlug } = useActorCanonicalSlug(actorId);

  const menuUrl = useMemo(() => {
    if (!actorId) return "";
    if (canonicalSlug) return `${window.location.origin}/profile/${canonicalSlug}/menu`;
    return `${window.location.origin}/m/${actorId}`; // fallback while slug loads
  }, [actorId, canonicalSlug]);

  const profile = useMemo(() => buildFlyerProfile(dashboardDetails), [dashboardDetails]);
  const actions = useMemo(() => buildFlyerActions(dashboardDetails), [dashboardDetails]);
  const styles = useMemo(() => createFlyerViewStyles(), []);
  const printableVariant = isPrintableVariant(variant);
  const shortUrl = useMemo(
    () => buildShortUrl(menuUrl, dashboardDetails.slug),
    [menuUrl, dashboardDetails.slug]
  );

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
    if (actorId) {
      navigate(`/vport/${actorId}`, { replace: true });
      return;
    }
    navigate(`/feed`, { replace: true });
  }, [navigate, actorId]);

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
            <button type="button" onClick={onPrint} style={styles.pillBtn(false, "accent")}>
              Print
            </button>
          </div>
        </div>
      </div>

      {printableVariant ? (
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

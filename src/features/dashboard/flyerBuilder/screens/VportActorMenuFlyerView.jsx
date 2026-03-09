import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ClassicFlyer from "@/features/dashboard/qrcode/components/flyer/ClassicFlyer";
import PosterFlyer from "@/features/dashboard/qrcode/components/flyer/PosterFlyer";
import { PrintableQrSheet } from "@/features/dashboard/flyerBuilder/PrintableQrFlyer";
import { useVportPublicDetails } from "@/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter";
import {
  asTextValue,
  buildFlyerActions,
  buildFlyerProfile,
  createFlyerViewStyles,
} from "@/features/dashboard/flyerBuilder/model/vportActorMenuFlyerView.model";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";

const PRINTABLE_VARIANTS = Object.freeze(["table", "half", "full", "sticker"]);

function isPrintableVariant(value) {
  return PRINTABLE_VARIANTS.includes(String(value || "").toLowerCase());
}

function buildQrImageUrl(menuUrl) {
  const target = String(menuUrl || "").trim();
  if (!target) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&format=png&margin=0&data=${encodeURIComponent(target)}`;
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

  const menuUrl = useMemo(() => {
    if (!actorId) return "";
    return `${window.location.origin}/m/${actorId}`;
  }, [actorId]);

  const profile = useMemo(() => buildFlyerProfile(publicDetails), [publicDetails]);
  const actions = useMemo(() => buildFlyerActions(publicDetails), [publicDetails]);
  const styles = useMemo(() => createFlyerViewStyles(), []);
  const printableVariant = isPrintableVariant(variant);
  const qrCodeUrl = useMemo(() => buildQrImageUrl(menuUrl), [menuUrl]);
  const shortUrl = useMemo(() => buildShortUrl(menuUrl, publicDetails?.slug), [menuUrl, publicDetails?.slug]);

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
    <div style={styles.page}>
      <style>
        {`
          @media print {
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
          qrUrl={qrCodeUrl}
          link={shortUrl}
          logoUrl={profile.logoUrl || ""}
          showPrintButton={false}
        />
      ) : variant !== "poster" ? (
        <ClassicFlyer
          loading={loading}
          publicDetails={publicDetails}
          profile={profile}
          actions={actions}
          menuUrl={menuUrl}
          onPrint={onPrint}
          asText={asTextValue}
        />
      ) : (
        <PosterFlyer
          loading={loading}
          publicDetails={publicDetails}
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

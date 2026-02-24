import React from "react";
import QRCode from "react-qr-code";
import {
  buildClassicFlyerStyles,
  buildPill,
  CLASSIC_FLYER_CSS,
} from "@/features/dashboard/qrcode/components/flyer/ClassicFlyer.styles";

export function ClassicFlyer({
  loading,
  publicDetails,
  profile,
  actions,
  menuUrl,
  onPrint,
  asText,
}) {
  const s = buildClassicFlyerStyles(profile);

  return (
    <div style={s.page}>
      <style>{CLASSIC_FLYER_CSS}</style>

      <div className="print-page" style={{ width: "100%", maxWidth: 980 }}>
        <div className="print-sheet classic-sheet" style={s.sheet}>
          <div className="classic-hero" style={s.hero}>
            <div style={s.heroOverlay} />
          </div>

          <div className="classic-header" style={s.header}>
            <div className="classic-avatar" style={s.avatar}>
              {!s.avatarImage ? "VC" : null}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="print-text classic-title" style={s.title}>
                {loading ? "Loading..." : profile.displayName}
              </div>

              {profile.username?.trim() ? (
                <div className="print-muted" style={s.meta}>
                  @{profile.username}
                </div>
              ) : null}

              {profile.tagline?.trim() ? (
                <div className="print-muted" style={s.tagline}>
                  {profile.tagline}
                </div>
              ) : null}
            </div>

            <div className="no-print" style={{ flexShrink: 0 }}>
              <button type="button" onClick={onPrint} style={s.printBtn}>
                Print
              </button>
            </div>
          </div>

          <div className="classic-body" style={s.body}>
            <div className="print-panel classic-left" style={s.left}>
              <div style={s.printRow}>
                <div style={{ fontSize: 16, fontWeight: 950, letterSpacing: 0.6 }} className="print-text">
                  Scan to open the menu
                </div>
              </div>

              <div className="print-muted" style={s.hint}>
                Use your phone camera or QR scanner. If QR is not available, type the link shown on the flyer.
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.2 }} className="print-muted">
                  LINK
                </div>
                <div className="print-muted" style={{ marginTop: 8 }}>
                  <div style={s.urlBox}>{menuUrl}</div>
                </div>
              </div>

              <div style={s.smallRow}>
                <a className="no-print" href={menuUrl} target="_blank" rel="noreferrer" style={buildPill(!!menuUrl)}>
                  Open Menu
                </a>

                <button
                  className="no-print"
                  type="button"
                  style={buildPill(true)}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(menuUrl);
                    } catch {
                      // no-op
                    }
                  }}
                >
                  Copy Link
                </button>

                <a
                  className="no-print"
                  href={actions.directionsUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={buildPill(!!actions.directionsUrl)}
                  onClick={(e) => {
                    if (!actions.directionsUrl) e.preventDefault();
                  }}
                >
                  Directions
                </a>

                <a
                  className="no-print"
                  href={actions.phone ? `tel:${actions.phone}` : "#"}
                  style={buildPill(!!actions.phone)}
                  onClick={(e) => {
                    if (!actions.phone) e.preventDefault();
                  }}
                >
                  Call
                </a>
              </div>

              <div style={{ marginTop: 18, height: 1, background: "rgba(255,255,255,0.08)" }} />

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.2 }} className="print-muted">
                  NOTES
                </div>
                <div className="print-muted" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.45 }}>
                  {asText(publicDetails?.flyer_note) ||
                    asText(publicDetails?.flyerNote) ||
                    "Ask staff for specials, availability, and hours."}
                </div>
              </div>
            </div>

            <div className="print-panel classic-right" style={s.right}>
              <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: 1.2 }} className="print-text">
                QR CODE
              </div>

              <div className="print-qrOuter" style={s.qrWrapOuter}>
                <div className="classic-qrInner" style={s.qrWrapInner}>
                  <div className="classic-qrSvg">
                    <QRCode value={menuUrl} size={240} />
                  </div>
                </div>
              </div>

              <div className="print-muted" style={{ fontSize: 12, textAlign: "center", lineHeight: 1.35 }}>
                {profile.displayName ? `${profile.displayName} - Menu` : "Menu"}
              </div>

              <div className="print-muted" style={s.urlBox}>
                {menuUrl}
              </div>

              <div
                className="print-muted"
                style={{ fontSize: 11, letterSpacing: 2.4, textTransform: "uppercase", opacity: 0.75 }}
              >
                Powered by Vibez Citizens
              </div>
            </div>
          </div>

          <div
            className="print-muted"
            style={{
              padding: "0 18px 18px 18px",
              fontSize: 11,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              opacity: 0.75,
              textAlign: "center",
            }}
          >
            {profile.username?.trim() ? `@${profile.username}` : "Vibez Citizens"} - Secure Vport Access
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassicFlyer;

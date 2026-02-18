import React from "react";
import QRCode from "react-qr-code";

export function ClassicFlyer({
  loading,
  publicDetails,
  profile,
  actions,
  menuUrl,
  onPrint,
  asText,
}) {
  const bannerImage = profile.bannerUrl?.trim() ? `url(${profile.bannerUrl})` : null;
  const avatarImage = profile.avatarUrl?.trim() ? `url(${profile.avatarUrl})` : null;

  const page = {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), radial-gradient(900px 700px at 55% 85%, rgba(0,153,255,0.08), transparent 60%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    padding: 18,
    overflowY: "auto",
  };

  const sheet = {
    width: "100%",
    maxWidth: 820,
    borderRadius: 28,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(12,14,24,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
  };

  const hero = {
    height: 240,
    position: "relative",
    backgroundColor: "#070812",
    backgroundImage: bannerImage
      ? bannerImage
      : "radial-gradient(900px 340px at 18% 20%, rgba(0,255,240,0.35), transparent 60%), radial-gradient(900px 340px at 82% 30%, rgba(124,58,237,0.30), transparent 62%), radial-gradient(700px 340px at 55% 90%, rgba(0,153,255,0.22), transparent 60%), linear-gradient(180deg, rgba(10,12,22,0.95), rgba(5,6,11,0.92))",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: bannerImage ? "saturate(1.05) contrast(1.05)" : "none",
  };

  const heroOverlay = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.92) 100%)",
  };

  const header = {
    position: "relative",
    zIndex: 2,
    padding: 18,
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginTop: -44,
  };

  const avatar = {
    width: 92,
    height: 92,
    borderRadius: 24,
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
    fontSize: 18,
  };

  const title = {
    fontSize: 28,
    fontWeight: 950,
    letterSpacing: 0.6,
    lineHeight: 1.05,
  };

  const meta = {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.62)",
    letterSpacing: 1.2,
  };

  const tagline = {
    marginTop: 10,
    fontSize: 14,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.35,
  };

  const body = {
    padding: 18,
    paddingTop: 6,
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    alignItems: "stretch",
  };

  const left = {
    flex: "1 1 360px",
    minWidth: 280,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
  };

  const right = {
    flex: "0 0 320px",
    minWidth: 280,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  };

  const printRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  };

  const printBtn = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const hint = {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.35,
  };

  const qrWrapOuter = {
    padding: 1,
    borderRadius: 22,
    background:
      "linear-gradient(135deg, rgba(0,255,240,0.35), rgba(124,58,237,0.28), rgba(0,153,255,0.22))",
    boxShadow:
      "0 18px 44px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset",
  };

  const qrWrapInner = {
    borderRadius: 21,
    background: "#ffffff",
    padding: 18,
  };

  const urlBox = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    wordBreak: "break-all",
    textAlign: "center",
  };

  const smallRow = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 12,
  };

  const pill = (enabled) => ({
    padding: "9px 12px",
    borderRadius: 999,
    border: enabled
      ? "1px solid rgba(255,255,255,0.14)"
      : "1px solid rgba(255,255,255,0.08)",
    background: enabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
    color: enabled ? "#fff" : "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.3,
    cursor: enabled ? "pointer" : "not-allowed",
    userSelect: "none",
    textDecoration: "none",
    whiteSpace: "nowrap",
  });

  return (
    <div style={page}>
      <style>
        {`
          @media print {
            html, body { height: auto !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-page { padding: 0 !important; background: #fff !important; }
            .print-sheet { box-shadow: none !important; border: 1px solid #ddd !important; background: #fff !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
            .print-text { color: #000 !important; }
            .print-muted { color: rgba(0,0,0,0.65) !important; }
            .print-panel { border: 1px solid #e6e6e6 !important; background: #fff !important; }
            .print-qrOuter { box-shadow: none !important; background: #fff !important; border: 1px solid #e6e6e6 !important; }
            @page { margin: 10mm; }
          }
        `}
      </style>

      <div className="print-page" style={{ width: "100%", maxWidth: 980 }}>
        <div className="print-sheet" style={sheet}>
          <div style={hero}>
            <div style={heroOverlay} />
          </div>

          <div style={header}>
            <div style={avatar}>{!avatarImage ? "VC" : null}</div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="print-text" style={title}>
                {loading ? "Loading…" : profile.displayName}
              </div>

              {profile.username?.trim() ? (
                <div className="print-muted" style={meta}>
                  @{profile.username}
                </div>
              ) : null}

              {profile.tagline?.trim() ? (
                <div className="print-muted" style={tagline}>
                  {profile.tagline}
                </div>
              ) : null}
            </div>

            <div className="no-print" style={{ flexShrink: 0 }}>
              <button type="button" onClick={onPrint} style={printBtn}>
                Print
              </button>
            </div>
          </div>

          <div style={body}>
            <div className="print-panel" style={left}>
              <div style={printRow}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 950,
                    letterSpacing: 0.6,
                  }}
                  className="print-text"
                >
                  Scan to open the menu
                </div>
              </div>

              <div className="print-muted" style={hint}>
                Use your phone camera or QR scanner. If QR is not available, type the link shown on the flyer.
              </div>

              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1.2,
                  }}
                  className="print-muted"
                >
                  LINK
                </div>
                <div className="print-muted" style={{ marginTop: 8 }}>
                  <div style={urlBox}>{menuUrl}</div>
                </div>
              </div>

              <div style={smallRow}>
                <a
                  className="no-print"
                  href={menuUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={pill(!!menuUrl)}
                >
                  Open Menu
                </a>

                <button
                  className="no-print"
                  type="button"
                  style={pill(true)}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(menuUrl);
                    } catch (_) {}
                  }}
                >
                  Copy Link
                </button>

                <a
                  className="no-print"
                  href={actions.directionsUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={pill(!!actions.directionsUrl)}
                  onClick={(e) => {
                    if (!actions.directionsUrl) e.preventDefault();
                  }}
                >
                  Directions
                </a>

                <a
                  className="no-print"
                  href={actions.phone ? `tel:${actions.phone}` : "#"}
                  style={pill(!!actions.phone)}
                  onClick={(e) => {
                    if (!actions.phone) e.preventDefault();
                  }}
                >
                  Call
                </a>
              </div>

              <div
                style={{
                  marginTop: 18,
                  height: 1,
                  background: "rgba(255,255,255,0.08)",
                }}
              />

              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1.2,
                  }}
                  className="print-muted"
                >
                  NOTES
                </div>
                <div
                  className="print-muted"
                  style={{ marginTop: 8, fontSize: 12, lineHeight: 1.45 }}
                >
                  {asText(publicDetails?.flyer_note) ||
                    asText(publicDetails?.flyerNote) ||
                    "Ask staff for specials, availability, and hours."}
                </div>
              </div>
            </div>

            <div className="print-panel" style={right}>
              <div
                style={{ fontSize: 14, fontWeight: 950, letterSpacing: 1.2 }}
                className="print-text"
              >
                QR CODE
              </div>

              <div className="print-qrOuter" style={qrWrapOuter}>
                <div style={qrWrapInner}>
                  <QRCode value={menuUrl} size={240} />
                </div>
              </div>

              <div
                className="print-muted"
                style={{ fontSize: 12, textAlign: "center", lineHeight: 1.35 }}
              >
                {profile.displayName ? `${profile.displayName} • Menu` : "Menu"}
              </div>

              <div className="print-muted" style={urlBox}>
                {menuUrl}
              </div>

              <div
                className="print-muted"
                style={{
                  fontSize: 11,
                  letterSpacing: 2.4,
                  textTransform: "uppercase",
                  opacity: 0.75,
                }}
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
            {profile.username?.trim() ? `@${profile.username}` : "Vibez Citizens"} • Secure Vport Access
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassicFlyer;

import React from "react";
import QRCode from "react-qr-code";

export function PosterFlyer({
  loading,
  publicDetails,
  profile,
  actions,
  menuUrl,
  onPrint,
  asText,
}) {
  const accent = (profile.accent || "#c23a3a").trim();
  const safeAccent = accent || "#c23a3a";

  const headlineTop = profile.flyerHeadline?.trim() || "ONLINE MENU";
  const headlineSmall =
    profile.flyerSubheadline?.trim() || "SCAN HERE TO VIEW OUR MENU ONLINE";

  const noteText =
    asText(publicDetails?.flyer_note) ||
    asText(publicDetails?.flyerNote) ||
    profile.tagline ||
    "Fresh meals, fast service, good vibes.";

  const phoneText = asText(actions.phone);
  const addressText = asText(profile.address);
  const hoursText = asText(profile.hours) || "OPEN DAILY";
  const websiteText = asText(profile.website);

  const logoUrl = asText(profile.logoUrl).trim();
  const bannerUrl = asText(profile.bannerUrl).trim();
  const food1 = asText(actions.foodImage1);
  const food2 = asText(actions.foodImage2);

  const posterPage = {
    minHeight: "100vh",
    width: "100%",
    background: "#f3f3f3",
    padding: 18,
    display: "flex",
    justifyContent: "center",
    overflowY: "auto",
  };

  const posterSheet = {
    width: "100%",
    maxWidth: 920,
    background: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
    border: "1px solid rgba(0,0,0,0.08)",
  };

  const posterInner = {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    minHeight: 720,
  };

  const leftCol = {
    padding: 26,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  };

  const rightCol = {
    background: safeAccent,
    padding: 22,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  const hero = {
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    background:
      "radial-gradient(900px 340px at 18% 20%, rgba(0,255,240,0.18), transparent 60%), radial-gradient(900px 340px at 82% 30%, rgba(124,58,237,0.16), transparent 62%), radial-gradient(700px 340px at 55% 90%, rgba(0,153,255,0.12), transparent 60%), linear-gradient(180deg, rgba(10,12,22,0.22), rgba(5,6,11,0.10))",
    border: "1px solid rgba(0,0,0,0.06)",
  };

  const heroOverlay = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.35) 100%)",
  };

  const smallTop = {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(0,0,0,0.55)",
    fontWeight: 900,
  };

  const bigHeadline = {
    fontSize: 52,
    lineHeight: 0.95,
    fontWeight: 950,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: safeAccent,
  };

  const qrBox = {
    borderRadius: 14,
    border: "2px solid rgba(0,0,0,0.08)",
    padding: 16,
    display: "grid",
    placeItems: "center",
    width: "fit-content",
    background: "#fff",
  };

  const qrLabel = {
    marginTop: 10,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: 950,
    color: "rgba(0,0,0,0.6)",
    textAlign: "center",
  };

  const ctaTitle = {
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  };

  const ctaText = {
    fontSize: 13,
    lineHeight: 1.4,
    color: "rgba(255,255,255,0.9)",
  };

  const miniCard = {
    borderRadius: 14,
    overflow: "hidden",
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.22)",
  };

  const miniImg = (url) => ({
    height: 120,
    background: url ? `url(${url})` : "rgba(0,0,0,0.12)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  });

  const footerBar = {
    marginTop: "auto",
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.25)",
    display: "grid",
    gap: 8,
    fontSize: 12,
    letterSpacing: 0.2,
  };

  const chip = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.08)",
    fontSize: 12,
    color: "rgba(0,0,0,0.7)",
    fontWeight: 800,
    width: "fit-content",
  };

  const printBtn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    // ✅ IMPORTANT: give the OUTER wrapper the .posterPage class so print CSS applies
    <div className="posterPage" style={posterPage}>
      <style>
        {`
          /* ✅ MOBILE: stack columns, scale down headline/QR, kill overflow */
          @media (max-width: 720px) {
            .posterSheet { border-radius: 16px !important; }
            .posterInner { grid-template-columns: 1fr !important; min-height: auto !important; }
            .posterLeft { padding: 16px !important; }
            .posterRight { padding: 16px !important; }
            .posterHeadline { font-size: 36px !important; }
            .posterHero { height: 120px !important; }
            .posterQR svg { width: 220px !important; height: 220px !important; }
          }

          /* ✅ EXTRA SMALL: even tighter */
          @media (max-width: 380px) {
            .posterHeadline { font-size: 32px !important; }
            .posterQR svg { width: 200px !important; height: 200px !important; }
          }

          /* ✅ PRINT: remove UI + remove gray background + remove shadow/radius */
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              background: #fff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .no-print { display: none !important; }

            .posterPage { padding: 0 !important; background: #fff !important; }

            .posterSheet {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              width: 100% !important;
              max-width: none !important;
            }

            .posterFit {
              width: 100% !important;
              height: auto !important;
            }

            @page {
              size: auto;
              margin: 8mm;
            }
          }
        `}
      </style>

      {/* keep max width wrapper if you want (not printed anyway) */}
      <div style={{ width: "100%", maxWidth: 980 }}>
        <div className="posterSheet" style={posterSheet}>
          {/* ✅ This bar will NOT print */}
          <div
            className="no-print"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 12,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>Flyer Preview</div>
            <button type="button" onClick={onPrint} style={printBtn}>
              Print
            </button>
          </div>

          <div className="posterFit posterInner" style={posterInner}>
            <div className="posterLeft" style={leftCol}>
              <div className="posterHero" style={hero}>
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="banner"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                <div style={heroOverlay} />
              </div>

              <div style={smallTop}>
                {loading ? "Loading…" : profile.displayName || "YOUR RESTAURANT"}
              </div>

              <div className="posterHeadline" style={bigHeadline}>
                {headlineTop}
              </div>

              <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="posterQR">
                  <div style={qrBox}>
                    <QRCode value={menuUrl} size={260} />
                  </div>
                  <div style={qrLabel}>Scan to view the menu</div>
                </div>

                <div style={{ minWidth: 220, maxWidth: 320 }}>
                  <div style={{ fontSize: 24, fontWeight: 950, letterSpacing: 0.4, color: "rgba(0,0,0,0.85)" }}>
                    SCAN HERE
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(0,0,0,0.55)", fontWeight: 900 }}>
                    {headlineSmall}
                  </div>

                  <div style={{ marginTop: 14, fontSize: 13, color: "rgba(0,0,0,0.65)", lineHeight: 1.5 }}>
                    {noteText}
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                    <div style={chip}>{hoursText}</div>
                    {phoneText ? <div style={chip}>{phoneText}</div> : null}
                    {addressText ? <div style={chip}>{addressText}</div> : null}
                    {websiteText ? <div style={chip}>{websiteText}</div> : null}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
                <div style={{ fontWeight: 950, letterSpacing: 1.2, textTransform: "uppercase" }}>Link</div>
                <div style={{ marginTop: 6, wordBreak: "break-all" }}>{menuUrl}</div>
              </div>
            </div>

            <div className="posterRight" style={rightCol}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={ctaTitle}>Order / View Menu</div>
                  <div style={{ marginTop: 8, ...ctaText }}>
                    Scan the QR code to browse items, prices, and specials.
                  </div>
                </div>

                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="logo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ fontWeight: 950, letterSpacing: 1.6, fontSize: 10, textTransform: "uppercase" }}>
                      LOGO
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={miniCard}>
                  <div style={miniImg(food1)} />
                  <div style={{ padding: 10, fontSize: 12, fontWeight: 900, letterSpacing: 0.4 }}>
                    Today’s Favorite
                  </div>
                </div>

                <div style={miniCard}>
                  <div style={miniImg(food2)} />
                  <div style={{ padding: 10, fontSize: 12, fontWeight: 900, letterSpacing: 0.4 }}>
                    Fresh & Delicious
                  </div>
                </div>
              </div>

              <div style={footerBar}>
                <div style={{ fontWeight: 950, letterSpacing: 1.4, textTransform: "uppercase" }}>
                  {hoursText}
                </div>
                {phoneText ? <div>Call: {phoneText}</div> : null}
                {addressText ? <div>{addressText}</div> : null}
                <div style={{ fontSize: 11, opacity: 0.9, wordBreak: "break-all" }}>{menuUrl}</div>
                <div style={{ fontSize: 10, opacity: 0.85, letterSpacing: 2.2, textTransform: "uppercase" }}>
                  Powered by Vibez Citizens
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PosterFlyer;

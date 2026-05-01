import QRCode from "react-qr-code";
import {
  chip,
  ctaText,
  ctaTitle,
  footerBar,
  getPosterFlyerAccentStyles,
  hero,
  heroOverlay,
  leftCol,
  miniCard,
  miniImg,
  posterInner,
  posterPage,
  posterSheet,
  printBtn,
  qrBox,
  qrLabel,
  smallTop,
} from "@/features/dashboard/qrcode/components/flyer/posterFlyer.styles";

export function PosterFlyer({
  loading,
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
    asText(profile.flyerNote) ||
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

  const { rightCol, bigHeadline } = getPosterFlyerAccentStyles(safeAccent);

  return (
    <div className="posterPage" style={posterPage}>
      <style>
        {`
          @media (max-width: 720px) {
            .posterSheet { border-radius: 16px !important; }
            .posterInner { grid-template-columns: 1fr !important; min-height: auto !important; }
            .posterLeft { padding: 16px !important; }
            .posterRight { padding: 16px !important; }
            .posterHeadline { font-size: 36px !important; }
            .posterHero { height: 120px !important; }
            .posterQR svg { width: 220px !important; height: 220px !important; }
          }

          @media (max-width: 380px) {
            .posterHeadline { font-size: 32px !important; }
            .posterQR svg { width: 200px !important; height: 200px !important; }
          }

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

      <div style={{ width: "100%", maxWidth: 980 }}>
        <div className="posterSheet" style={posterSheet}>
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
                    Today's Favorite
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

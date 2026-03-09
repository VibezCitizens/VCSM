import React, { useMemo } from "react";

const LAYOUT_CONFIG = Object.freeze({
  table: Object.freeze({
    count: 6,
    gridClassName: "pqs-grid--table",
    cardClassName: "pqs-card--table",
    qrSizePx: 176,
  }),
  sticker: Object.freeze({
    count: 12,
    gridClassName: "pqs-grid--sticker",
    cardClassName: "pqs-card--sticker",
    qrSizePx: 132,
  }),
  half: Object.freeze({
    count: 2,
    gridClassName: "pqs-grid--half",
    cardClassName: "pqs-card--half",
    qrSizePx: 260,
  }),
  full: Object.freeze({
    count: 1,
    gridClassName: "pqs-grid--full",
    cardClassName: "pqs-card--full",
    qrSizePx: 540,
  }),
});

function resolveLayout(layout, mode) {
  const key = String(layout || mode || "table").toLowerCase();
  return LAYOUT_CONFIG[key] ? key : "table";
}

function buildSheetItems(layoutKey) {
  const count = LAYOUT_CONFIG[layoutKey].count;
  return Array.from({ length: count }, (_, index) => ({ id: `${layoutKey}-${index + 1}` }));
}

function buildQrAlt(businessName) {
  const label = String(businessName || "Restaurant").trim() || "Restaurant";
  return `${label} QR code`;
}

function buildPrintCss() {
  return `
@page {
  size: letter portrait;
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
}

.pqs-root,
.pqs-root * {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.pqs-page-shell {
  min-height: 100vh;
  width: 100%;
  padding: 16px;
  background: #f4f4f5;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pqs-print-hide {
  width: 8.5in;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.pqs-print-button {
  border: 1px solid #111827;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: 8px;
}

.pqs-sheet-wrapper {
  width: 8.5in;
  height: 11in;
}

.pqs-sheet {
  position: relative;
  width: 8.5in;
  height: 11in;
  padding: 0.25in;
  background: #ffffff;
  margin: 0 auto;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
  page-break-after: always;
}

.pqs-grid {
  width: 100%;
  height: 100%;
  display: grid;
}

.pqs-grid--table {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 0.25in;
}

.pqs-grid--sticker {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  column-gap: 0.25in;
  row-gap: 0.166in;
}

.pqs-grid--half {
  grid-template-columns: 1fr;
  grid-template-rows: repeat(2, 1fr);
  row-gap: 0.5in;
}

.pqs-grid--full {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.pqs-item {
  width: 100%;
  height: 100%;
  break-inside: avoid;
  page-break-inside: avoid;
}

.pqs-card {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px dashed #d1d5db;
  background: #ffffff;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
}

.pqs-card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #111827;
}

.pqs-food-bg {
  position: absolute;
  inset: 0;
  opacity: 1;
  pointer-events: none;
}

.pqs-food-icon {
  position: absolute;
  color: #e6e7eb;
  line-height: 1;
  user-select: none;
}

.pqs-food-icon--1 { top: 18px; left: 18px; font-size: 26px; }
.pqs-food-icon--2 { top: 18px; left: 50%; transform: translateX(-50%); font-size: 22px; }
.pqs-food-icon--3 { top: 18px; right: 18px; font-size: 24px; }

.pqs-food-icon--4 { top: 34%; left: 16px; font-size: 18px; }
.pqs-food-icon--5 { top: 34%; right: 16px; font-size: 18px; }

.pqs-food-icon--6 { top: 48%; left: 18px; font-size: 28px; }
.pqs-food-icon--7 { top: 48%; right: 18px; font-size: 26px; }

.pqs-food-icon--8 { bottom: 120px; left: 18px; font-size: 30px; }
.pqs-food-icon--9 { bottom: 120px; right: 18px; font-size: 28px; }

.pqs-food-icon--10 { bottom: 18px; left: 18px; font-size: 34px; }
.pqs-food-icon--11 { bottom: 18px; left: 50%; transform: translateX(-50%); font-size: 18px; }
.pqs-food-icon--12 { bottom: 18px; right: 18px; font-size: 34px; }

.pqs-kicker {
  margin: 0;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  position: relative;
  z-index: 2;
}

.pqs-name {
  margin: 0;
  position: relative;
  z-index: 2;
}

.pqs-support {
  margin: 0;
  color: #111827;
  position: relative;
  z-index: 2;
}

.pqs-link {
  margin: 0;
  max-width: 100%;
  padding: 0 6px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  z-index: 2;
}

.pqs-powered {
  margin: 0;
  color: #111827;
  position: relative;
  z-index: 2;
}

.pqs-powered strong {
  font-weight: 900;
}

.pqs-qr-frame {
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.pqs-qr-image {
  display: block;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.pqs-qr-missing {
  border: 1px dashed #9ca3af;
  color: #6b7280;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.pqs-cut-note {
  position: absolute;
  z-index: 50;
  font-size: 10px;
  line-height: 1;
  color: #9ca3af;
  pointer-events: none;
}

.pqs-cut-note--tl {
  top: 0.12in;
  left: 0.12in;
}

.pqs-cut-note--tr {
  top: 0.12in;
  right: 0.12in;
}

.pqs-cut-note--bl {
  bottom: 0.12in;
  left: 0.12in;
}

.pqs-cut-note--br {
  bottom: 0.12in;
  right: 0.12in;
}

/* sticker */
.pqs-card--sticker .pqs-card-inner {
  padding: 0.08in 0.08in 0.07in;
  justify-content: center;
  gap: 2px;
}
.pqs-card--sticker .pqs-kicker {
  font-size: 13px;
  line-height: 1;
}
.pqs-card--sticker .pqs-name,
.pqs-card--sticker .pqs-link,
.pqs-card--sticker .pqs-powered,
.pqs-card--sticker .pqs-food-bg {
  display: none;
}
.pqs-card--sticker .pqs-support {
  font-size: 8px;
  line-height: 1;
}
.pqs-card--sticker .pqs-qr-frame {
  padding: 0;
  border: none;
  margin-top: 2px;
}

/* table */
.pqs-card--table .pqs-card-inner {
  padding: 0.14in 0.12in;
  justify-content: center;
  gap: 4px;
}
.pqs-card--table .pqs-kicker {
  font-size: 11px;
  line-height: 1;
}
.pqs-card--table .pqs-name {
  font-size: 18px;
  line-height: 1.05;
  font-weight: 700;
}
.pqs-card--table .pqs-support {
  font-size: 10px;
  line-height: 1.05;
}
.pqs-card--table .pqs-link,
.pqs-card--table .pqs-powered {
  font-size: 9px;
  line-height: 1;
}
.pqs-card--table .pqs-food-bg {
  display: none;
}
.pqs-card--table .pqs-qr-frame {
  padding: 0;
  border: none;
}

/* half */
.pqs-card--half .pqs-card-inner {
  padding: 0.22in 0.22in 0.2in;
  justify-content: center;
  gap: 10px;
}
.pqs-card--half .pqs-name {
  font-family: "Times New Roman", Georgia, serif;
  font-size: 34px;
  line-height: 1;
  font-weight: 500;
}
.pqs-card--half .pqs-kicker {
  font-size: 18px;
  line-height: 1.05;
}
.pqs-card--half .pqs-support {
  font-size: 14px;
  line-height: 1.15;
}
.pqs-card--half .pqs-link {
  font-size: 13px;
  line-height: 1.1;
}
.pqs-card--half .pqs-powered {
  font-size: 14px;
  line-height: 1.1;
  margin-top: 0;
}
.pqs-card--half .pqs-qr-frame {
  padding: 0;
  border: none;
}

/* full */
.pqs-card--full {
  border: none;
}
.pqs-card--full .pqs-card-inner {
  padding: 0.12in 0.18in 0.2in;
  justify-content: flex-start;
  gap: 18px;
}
.pqs-card--full .pqs-name {
  font-family: "Times New Roman", Georgia, serif;
  font-size: 58px;
  line-height: 1;
  font-weight: 500;
  margin-top: 4px;
}
.pqs-card--full .pqs-kicker {
  font-size: 30px;
  line-height: 1.05;
}
.pqs-card--full .pqs-support {
  font-size: 20px;
  line-height: 1.15;
}
.pqs-card--full .pqs-qr-frame {
  padding: 0;
  border: none;
}
.pqs-card--full .pqs-link {
  margin-top: 4px;
  font-size: 18px;
  line-height: 1.1;
}
.pqs-card--full .pqs-powered {
  margin-top: auto;
  font-size: 20px;
  line-height: 1.1;
}
.pqs-card--full .pqs-powered strong {
  font-size: 22px;
}

@media print {
  html,
  body {
    width: 8.5in;
    height: 11in;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .pqs-page-shell {
    min-height: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .pqs-print-hide {
    display: none !important;
  }

  .pqs-sheet-wrapper {
    width: 8.5in !important;
    height: 11in !important;
    margin: 0 auto !important;
  }

  .pqs-sheet {
    width: 8.5in !important;
    height: 11in !important;
    margin: 0 auto !important;
    box-shadow: none !important;
    border: none !important;
  }
}
`;
}

function renderQrNode(cleanQrUrl, qrSizePx, altText) {
  if (cleanQrUrl) {
    return (
      <img
        src={cleanQrUrl}
        alt={altText}
        className="pqs-qr-image"
        style={{ width: `${qrSizePx}px`, height: `${qrSizePx}px` }}
        loading="eager"
      />
    );
  }

  return (
    <div className="pqs-qr-missing" style={{ width: `${qrSizePx}px`, height: `${qrSizePx}px` }}>
      QR unavailable
    </div>
  );
}

function FoodPattern() {
  return (
    <div className="pqs-food-bg" aria-hidden="true">
      <span className="pqs-food-icon pqs-food-icon--1">☰</span>
      <span className="pqs-food-icon pqs-food-icon--2">◠</span>
      <span className="pqs-food-icon pqs-food-icon--3">▱</span>
      <span className="pqs-food-icon pqs-food-icon--4">◫</span>
      <span className="pqs-food-icon pqs-food-icon--5">◫</span>
      <span className="pqs-food-icon pqs-food-icon--6">◔</span>
      <span className="pqs-food-icon pqs-food-icon--7">◔</span>
      <span className="pqs-food-icon pqs-food-icon--8">◜</span>
      <span className="pqs-food-icon pqs-food-icon--9">◝</span>
      <span className="pqs-food-icon pqs-food-icon--10">◙</span>
      <span className="pqs-food-icon pqs-food-icon--11">⌔</span>
      <span className="pqs-food-icon pqs-food-icon--12">◙</span>
    </div>
  );
}

export function PrintableQrFlyer({
  layout = "table",
  mode,
  businessName = "Restaurant",
  qrUrl = "",
  qrCodeUrl = "",
  link = "",
  shortUrl = "",
}) {
  const resolvedLayout = resolveLayout(layout, mode);
  const config = LAYOUT_CONFIG[resolvedLayout];
  const cleanName = String(businessName || "Restaurant").trim() || "Restaurant";
  const cleanQrUrl = String(qrUrl || qrCodeUrl || "").trim();
  const cleanLink = String(link || shortUrl || "").trim();
  const qrAlt = buildQrAlt(cleanName);

  const isSticker = resolvedLayout === "sticker";
  const isTable = resolvedLayout === "table";
  const isHalf = resolvedLayout === "half";
  const isFull = resolvedLayout === "full";
  const isPosterLike = isHalf || isFull;

  return (
    <article className={`pqs-card ${config.cardClassName}`}>
      {isPosterLike ? <FoodPattern /> : null}

      <div className="pqs-card-inner">
        {isSticker ? (
          <>
            <p className="pqs-kicker">SCAN MENU</p>
            <div className="pqs-qr-frame">{renderQrNode(cleanQrUrl, config.qrSizePx, qrAlt)}</div>
            <p className="pqs-support">No app needed</p>
          </>
        ) : null}

        {isTable ? (
          <>
            <p className="pqs-kicker">SCAN TO VIEW MENU</p>
            <h2 className="pqs-name">{cleanName}</h2>
            <p className="pqs-support">Open on your phone</p>
            <div className="pqs-qr-frame">{renderQrNode(cleanQrUrl, config.qrSizePx, qrAlt)}</div>
            {cleanLink ? <p className="pqs-link">{cleanLink}</p> : null}
            <p className="pqs-powered">Powered by Vibez Citizens</p>
          </>
        ) : null}

        {isHalf ? (
          <>
            <h2 className="pqs-name">{cleanName}</h2>
            <p className="pqs-kicker">SCAN TO VIEW MENU</p>
            <p className="pqs-support">Open our menu on your phone</p>
            <p className="pqs-support">No app needed</p>
            <div className="pqs-qr-frame">{renderQrNode(cleanQrUrl, config.qrSizePx, qrAlt)}</div>
            {cleanLink ? <p className="pqs-link">{cleanLink}</p> : null}
            <p className="pqs-powered">
              Powered by <strong>Vibez Citizens</strong>
            </p>
          </>
        ) : null}

        {isFull ? (
          <>
            <h2 className="pqs-name">{cleanName}</h2>
            <p className="pqs-kicker">SCAN TO VIEW MENU</p>
            <p className="pqs-support">Open our menu on your phone</p>
            <p className="pqs-support">No app needed</p>
            <div className="pqs-qr-frame">{renderQrNode(cleanQrUrl, config.qrSizePx, qrAlt)}</div>
            {cleanLink ? <p className="pqs-link">{cleanLink}</p> : null}
            <p className="pqs-powered">
              Powered by <strong>Vibez Citizens</strong>
            </p>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function PrintableQrSheet({
  layout = "table",
  mode,
  businessName = "Restaurant",
  qrUrl = "",
  qrCodeUrl = "",
  link = "",
  shortUrl = "",
  showPrintButton = true,
}) {
  const resolvedLayout = resolveLayout(layout, mode);
  const config = LAYOUT_CONFIG[resolvedLayout];
  const items = useMemo(() => buildSheetItems(resolvedLayout), [resolvedLayout]);
  const printCss = useMemo(() => buildPrintCss(), []);
  const cleanQrUrl = String(qrUrl || qrCodeUrl || "").trim();
  const cleanLink = String(link || shortUrl || "").trim();
  const showCutNotes = resolvedLayout !== "full";

  return (
    <section className="pqs-root">
      <style>{printCss}</style>

      <div className="pqs-page-shell">
        {showPrintButton ? (
          <div className="pqs-print-hide">
            <button type="button" onClick={() => window.print()} className="pqs-print-button">
              Print
            </button>
          </div>
        ) : null}

        <div className="pqs-sheet-wrapper">
          <div className="pqs-sheet">
            {showCutNotes ? <div className="pqs-cut-note pqs-cut-note--tl">Cut along dotted lines</div> : null}
            {showCutNotes ? <div className="pqs-cut-note pqs-cut-note--tr">Cut along dotted lines</div> : null}
            {showCutNotes ? <div className="pqs-cut-note pqs-cut-note--bl">Cut along dotted lines</div> : null}
            {showCutNotes ? <div className="pqs-cut-note pqs-cut-note--br">Cut along dotted lines</div> : null}

            <div className={`pqs-grid ${config.gridClassName}`}>
              {items.map((item) => (
                <div key={item.id} className="pqs-item">
                  <PrintableQrFlyer
                    layout={resolvedLayout}
                    businessName={businessName}
                    qrUrl={cleanQrUrl}
                    link={cleanLink}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PrintableQrSheet;
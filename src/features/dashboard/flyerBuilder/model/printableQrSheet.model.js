export const PRINTABLE_QR_LAYOUT_CONFIG = Object.freeze({
  table: Object.freeze({
    count: 6,
    gridClassName: "pqs-grid--table",
    cardClassName: "pqs-card--table",
    qrSizePx: 204,
  }),
  sticker: Object.freeze({
    count: 12,
    gridClassName: "pqs-grid--sticker",
    cardClassName: "pqs-card--sticker",
    qrSizePx: 152,
  }),
  half: Object.freeze({
    count: 2,
    gridClassName: "pqs-grid--half",
    cardClassName: "pqs-card--half",
    qrSizePx: 308,
  }),
  full: Object.freeze({
    count: 1,
    gridClassName: "pqs-grid--full",
    cardClassName: "pqs-card--full",
    qrSizePx: 470,
  }),
});

export function resolvePrintableQrLayout(layout, mode) {
  const key = String(layout || mode || "table").toLowerCase();
  return PRINTABLE_QR_LAYOUT_CONFIG[key] ? key : "table";
}

export function buildPrintableQrSheetItems(layoutKey) {
  const count = PRINTABLE_QR_LAYOUT_CONFIG[layoutKey].count;
  return Array.from({ length: count }, (_, index) => ({ id: `${layoutKey}-${index + 1}` }));
}

export function buildPrintableQrAlt(businessName) {
  const label = String(businessName || "Restaurant").trim() || "Restaurant";
  return `${label} QR code`;
}


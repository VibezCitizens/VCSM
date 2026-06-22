export const PRINTABLE_QR_SHEET_BASE_CSS = `
@page {
  size: letter portrait;
  margin: 0.25in;
}

html,
body {
  margin: 0;
  padding: 0;
}

.pqs-root {
  --pqs-paper-width: 8.5in;
  --pqs-paper-height: 11in;
  --pqs-print-safe-margin: 0.25in;
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
  width: var(--pqs-paper-width);
  height: var(--pqs-paper-height);
}

.pqs-sheet {
  position: relative;
  width: var(--pqs-paper-width);
  height: var(--pqs-paper-height);
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
  border: 1px dashed #cfd3d9;
  background: #fff;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.pqs-card-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  color: #111827;
}

.pqs-kicker {
  margin: 0;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pqs-name {
  margin: 0;
  font-weight: 700;
  max-width: 100%;
  padding: 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.pqs-support {
  margin: 0;
  color: #1f2937;
}

.pqs-link {
  margin: 0;
  max-width: 100%;
  padding: 0 6px;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pqs-powered {
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

.pqs-powered strong {
  color: #111827;
  font-weight: 800;
}

.pqs-qr-frame {
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pqs-qr-image {
  display: block;
  width: 100%;
  height: 100%;
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
  top: 0.2in;
  left: 0.2in;
}

.pqs-cut-note--tr {
  top: 0.2in;
  right: 0.2in;
}

.pqs-cut-note--bl {
  bottom: 0.2in;
  left: 0.2in;
}

.pqs-cut-note--br {
  bottom: 0.2in;
  right: 0.2in;
}

@media print {
  html,
  body {
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    overflow: visible !important;
  }

  #root {
    display: block !important;
    width: auto !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }

  .pqs-page-shell {
    min-height: auto !important;
    padding: 0 !important;
    background: #fff !important;
    overflow: visible !important;
  }

  .pqs-print-hide {
    display: none !important;
  }

  .pqs-sheet-wrapper {
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    overflow: visible !important;
  }

  .pqs-sheet {
    width: 100% !important;
    height: calc(var(--pqs-paper-height) - (var(--pqs-print-safe-margin) * 2)) !important;
    margin: 0 !important;
    padding: 0.18in !important;
    box-shadow: none !important;
    border: none !important;
    overflow: visible !important;
    page-break-after: auto !important;
  }

  .pqs-card {
    overflow: visible !important;
  }

  .pqs-cut-note {
    display: none !important;
  }
}
`;

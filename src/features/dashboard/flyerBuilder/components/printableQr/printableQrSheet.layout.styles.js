export const PRINTABLE_QR_SHEET_LAYOUT_CSS = `
.pqs-grid--table {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 0.25in;
}

.pqs-grid--sticker {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  column-gap: 0.25in;
  row-gap: 0.166in;
}

.pqs-grid--half {
  grid-template-columns: 1fr;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  row-gap: 0.5in;
}

.pqs-grid--full {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.pqs-card--table .pqs-card-inner {
  padding: 0.11in 0.09in 0.09in;
  gap: 4px;
}
.pqs-card--table .pqs-kicker {
  font-size: 10px;
  line-height: 1;
}
.pqs-card--table .pqs-name {
  font-size: 16px;
  line-height: 1.1;
}
.pqs-card--table .pqs-link,
.pqs-card--table .pqs-powered {
  font-size: 10px;
  line-height: 1.1;
}

.pqs-card--sticker .pqs-card-inner {
  padding: 0.08in;
  gap: 3px;
}
.pqs-card--sticker .pqs-kicker {
  font-size: 8px;
  line-height: 1;
}
.pqs-card--sticker .pqs-name {
  font-size: 13px;
  line-height: 1.05;
}
.pqs-card--sticker .pqs-link,
.pqs-card--sticker .pqs-powered {
  font-size: 7px;
  line-height: 1;
}

.pqs-card--half .pqs-card-inner {
  padding: 0.22in;
  gap: 6px;
}
.pqs-card--half .pqs-kicker {
  font-size: 15px;
  line-height: 1.05;
}
.pqs-card--half .pqs-name {
  font-size: 30px;
  line-height: 1.05;
}
.pqs-card--half .pqs-link,
.pqs-card--half .pqs-powered {
  font-size: 13px;
  line-height: 1.1;
}

.pqs-card--full {
  border: 1px solid #e5e7eb;
  background: #ffffff;
}
.pqs-card--full .pqs-card-inner {
  padding: 0.32in 0.32in 0.36in;
  gap: 12px;
}
.pqs-card--full .pqs-name {
  font-family: "Times New Roman", Georgia, serif;
  font-size: 56px;
  font-weight: 500;
  line-height: 1;
  -webkit-line-clamp: 1;
}
.pqs-card--full .pqs-kicker {
  font-size: 18px;
  line-height: 1.1;
}
.pqs-card--full .pqs-support {
  font-size: 16px;
  line-height: 1.2;
}
.pqs-card--full .pqs-support--compact {
  margin-top: -6px;
}
.pqs-card--full .pqs-qr-frame {
  border: none;
  background: transparent;
  padding: 0;
}
.pqs-card--full .pqs-link {
  margin-top: 2px;
  color: #111827;
  font-size: 17px;
  line-height: 1.1;
  font-weight: 500;
}
.pqs-card--full .pqs-powered {
  margin-top: auto;
  font-size: 17px;
  line-height: 1.1;
  color: #111827;
}
`;

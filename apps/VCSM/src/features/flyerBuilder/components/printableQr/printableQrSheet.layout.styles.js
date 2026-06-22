export const PRINTABLE_QR_SHEET_LAYOUT_CSS = `
.pqs-grid--table {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 0.18in;
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
  padding: 0.1in 0.1in 0.08in;
  gap: 2px;
  justify-content: center;
}
.pqs-card--table .pqs-kicker {
  font-size: 10px;
  line-height: 1;
}
.pqs-card--table .pqs-name {
  font-size: 16px;
  line-height: 1.05;
  -webkit-line-clamp: 1;
}
.pqs-card--table .pqs-support {
  font-size: 9px;
  line-height: 1.05;
}
.pqs-card--table .pqs-link,
.pqs-card--table .pqs-powered {
  font-size: 8px;
  line-height: 1;
}
.pqs-card--table .pqs-qr-frame {
  border: none;
  background: transparent;
  padding: 0;
}

.pqs-card--sticker .pqs-card-inner {
  padding: 0.08in 0.08in 0.07in;
  gap: 2px;
  justify-content: center;
}
.pqs-card--sticker .pqs-kicker {
  font-size: 13px;
  line-height: 1;
}
.pqs-card--sticker .pqs-name,
.pqs-card--sticker .pqs-link,
.pqs-card--sticker .pqs-powered {
  display: none;
}
.pqs-card--sticker .pqs-support {
  font-size: 8px;
  line-height: 1;
}
.pqs-card--sticker .pqs-qr-frame {
  border: none;
  background: transparent;
  padding: 0;
}

.pqs-card--half .pqs-card-inner {
  padding: 0.22in;
  gap: 10px;
  justify-content: center;
}
.pqs-card--half .pqs-kicker {
  font-size: 18px;
  line-height: 1.05;
}
.pqs-card--half .pqs-name {
  font-family: "Times New Roman", Georgia, serif;
  font-size: 34px;
  line-height: 1;
  font-weight: 500;
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
  border: none;
  background: transparent;
  padding: 0;
}

.pqs-card--full {
  border: none;
  background: #ffffff;
}
.pqs-card--full .pqs-card-inner {
  padding: 0.12in 0.18in 0.2in;
  gap: 18px;
  justify-content: flex-start;
}
.pqs-card--full .pqs-name {
  font-family: "Times New Roman", Georgia, serif;
  font-size: 58px;
  font-weight: 500;
  line-height: 1;
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
.pqs-card--full .pqs-support--compact {
  margin-top: -12px;
}
.pqs-card--full .pqs-qr-frame {
  border: none;
  background: transparent;
  padding: 0;
}
.pqs-card--full .pqs-link {
  margin-top: 4px;
  color: #111827;
  font-size: 18px;
  line-height: 1.1;
}
.pqs-card--full .pqs-powered {
  margin-top: auto;
  font-size: 20px;
  line-height: 1.1;
  color: #111827;
}
.pqs-card--full .pqs-powered strong {
  font-size: 22px;
}

@media print {
  .pqs-grid--half {
    row-gap: 0.36in;
  }

  .pqs-card--half .pqs-card-inner {
    padding: 0.18in;
    gap: 8px;
  }

  .pqs-card--half .pqs-name {
    font-size: 32px;
  }

  .pqs-card--half .pqs-kicker {
    font-size: 17px;
  }

  .pqs-card--half .pqs-support,
  .pqs-card--half .pqs-powered {
    font-size: 13px;
  }

  .pqs-card--half .pqs-link {
    font-size: 12px;
  }
}
`;

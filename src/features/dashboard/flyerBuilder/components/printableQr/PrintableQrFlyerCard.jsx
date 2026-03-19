import React from "react";
import QRCode from "react-qr-code";

import {
  buildPrintableQrAlt,
  PRINTABLE_QR_LAYOUT_CONFIG,
  resolvePrintableQrLayout,
} from "@/features/dashboard/flyerBuilder/model/printableQrSheet.model";

function PrintableQrCode({ menuUrl, qrSizePx, altText }) {
  const cleanMenuUrl = String(menuUrl || "").trim();

  if (!cleanMenuUrl) {
    return (
      <div className="pqs-qr-missing" style={{ width: `${qrSizePx}px`, height: `${qrSizePx}px` }}>
        QR unavailable
      </div>
    );
  }

  return (
    <div style={{ width: `${qrSizePx}px`, height: `${qrSizePx}px` }}>
      <QRCode
        value={cleanMenuUrl}
        size={qrSizePx}
        bgColor="#FFFFFF"
        fgColor="#111827"
        level="M"
        title={altText}
        className="pqs-qr-image"
      />
    </div>
  );
}

export function PrintableQrFlyerCard({
  layout = "table",
  mode,
  businessName = "Restaurant",
  menuUrl = "",
  link = "",
  shortUrl = "",
}) {
  const resolvedLayout = resolvePrintableQrLayout(layout, mode);
  const config = PRINTABLE_QR_LAYOUT_CONFIG[resolvedLayout];
  const cleanName = String(businessName || "Restaurant").trim() || "Restaurant";
  const cleanLink = String(link || shortUrl || "").trim();
  const qrAlt = buildPrintableQrAlt(cleanName);

  const isSticker = resolvedLayout === "sticker";
  const isTable = resolvedLayout === "table";
  const isHalf = resolvedLayout === "half";
  const isFull = resolvedLayout === "full";

  return (
    <article className={`pqs-card ${config.cardClassName}`}>
      <div className="pqs-card-inner">
        {isSticker ? (
          <>
            <p className="pqs-kicker">Scan Menu</p>
            <div className="pqs-qr-frame">
              <PrintableQrCode menuUrl={menuUrl} qrSizePx={config.qrSizePx} altText={qrAlt} />
            </div>
            <p className="pqs-support">No app needed</p>
          </>
        ) : null}

        {isTable ? (
          <>
            <p className="pqs-kicker">Scan to view menu</p>
            <h2 className="pqs-name">{cleanName}</h2>
            <p className="pqs-support">Open on your phone</p>
            <div className="pqs-qr-frame">
              <PrintableQrCode menuUrl={menuUrl} qrSizePx={config.qrSizePx} altText={qrAlt} />
            </div>
            {cleanLink ? <p className="pqs-link">{cleanLink}</p> : null}
            <p className="pqs-powered">
              Powered by <strong>Vibez Citizens</strong>
            </p>
          </>
        ) : null}

        {isHalf ? (
          <>
            <h2 className="pqs-name">{cleanName}</h2>
            <p className="pqs-kicker">Scan to view menu</p>
            <p className="pqs-support">Open our menu on your phone</p>
            <p className="pqs-support pqs-support--compact">No app needed</p>
            <div className="pqs-qr-frame">
              <PrintableQrCode menuUrl={menuUrl} qrSizePx={config.qrSizePx} altText={qrAlt} />
            </div>
            {cleanLink ? <p className="pqs-link">{cleanLink}</p> : null}
            <p className="pqs-powered">
              Powered by <strong>Vibez Citizens</strong>
            </p>
          </>
        ) : null}

        {isFull ? (
          <>
            <h2 className="pqs-name">{cleanName}</h2>
            <p className="pqs-kicker">Scan to view menu</p>
            <p className="pqs-support">Open our menu on your phone</p>
            <p className="pqs-support pqs-support--compact">No app needed</p>
            <div className="pqs-qr-frame">
              <PrintableQrCode menuUrl={menuUrl} qrSizePx={config.qrSizePx} altText={qrAlt} />
            </div>
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

export default PrintableQrFlyerCard;

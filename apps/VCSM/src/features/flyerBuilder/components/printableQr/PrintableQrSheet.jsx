import React, { useMemo } from "react";

import { PrintableQrFlyerCard } from "@/features/flyerBuilder/components/printableQr/PrintableQrFlyerCard";
import { buildPrintableQrSheetCss } from "@/features/flyerBuilder/components/printableQr/printableQrSheet.styles";
import {
  buildPrintableQrSheetItems,
  PRINTABLE_QR_LAYOUT_CONFIG,
  resolvePrintableQrLayout,
} from "@/features/flyerBuilder/models/printableQrSheet.model";

function handlePrint() {
  if (typeof window === "undefined") {
    return;
  }

  window.print();
}

export function PrintableQrSheet({
  layout = "table",
  mode,
  businessName = "Restaurant",
  menuUrl = "",
  link = "",
  shortUrl = "",
  showPrintButton = true,
}) {
  const resolvedLayout = resolvePrintableQrLayout(layout, mode);
  const config = PRINTABLE_QR_LAYOUT_CONFIG[resolvedLayout];
  const items = useMemo(() => buildPrintableQrSheetItems(resolvedLayout), [resolvedLayout]);
  const printCss = useMemo(() => buildPrintableQrSheetCss(), []);
  const cleanMenuUrl = String(menuUrl || "").trim();
  const cleanLink = String(link || shortUrl || "").trim();
  const showCutNotes = resolvedLayout !== "full";

  return (
    <section className="pqs-root">
      <style>{printCss}</style>

      <div className="pqs-page-shell">
        {showPrintButton ? (
          <div className="pqs-print-hide">
            <button type="button" onClick={handlePrint} className="pqs-print-button">
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
                  <PrintableQrFlyerCard
                    layout={resolvedLayout}
                    businessName={businessName}
                    menuUrl={cleanMenuUrl}
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

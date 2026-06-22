import { PRINTABLE_QR_SHEET_BASE_CSS } from "@/features/flyerBuilder/components/printableQr/printableQrSheet.base.styles";
import { PRINTABLE_QR_SHEET_LAYOUT_CSS } from "@/features/flyerBuilder/components/printableQr/printableQrSheet.layout.styles";

export function buildPrintableQrSheetCss() {
  return `${PRINTABLE_QR_SHEET_BASE_CSS}\n${PRINTABLE_QR_SHEET_LAYOUT_CSS}`;
}


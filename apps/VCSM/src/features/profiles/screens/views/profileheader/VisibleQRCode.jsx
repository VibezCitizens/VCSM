import { QrCode } from "@/features/dashboard/qrcode/adapters/qrcode.adapter";

/**
 * VisibleQRCode
 *
 * Renders a white-background QR code inside a padded container.
 * Uses the canonical shared QrCode component — not react-qr-code directly.
 *
 * @param {string}  value — QR content (must be a resolved URL, never a raw UUID)
 * @param {number}  size  — pixel size of the QR (default 128)
 * @param {string}  label — screen-reader aria-label for the QR image
 */
export default function VisibleQRCode({ value, size = 128, label = "QR code" }) {
  return (
    <div
      className="p-4 bg-white rounded shadow"
      role="img"
      aria-label={label}
    >
      <QrCode
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
      />
    </div>
  );
}

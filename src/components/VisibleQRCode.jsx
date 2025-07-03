import QRCode from 'react-qr-code';

export default function VisibleQRCode({ value, size = 128 }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <QRCode value={value} size={size} />
    </div>
  );
}

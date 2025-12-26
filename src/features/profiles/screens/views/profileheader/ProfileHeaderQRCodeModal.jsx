import VisibleQRCode from '@/features/profiles/screens/views/profileheader/VisibleQRCode';

export default function ProfileHeaderQRCodeModal({ open, onClose, value }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/70 select-none">
        Tap anywhere to close
      </div>

      <div className="max-w-[90vw] max-h-[80vh]">
        <VisibleQRCode value={value} />
      </div>
    </div>
  );
}



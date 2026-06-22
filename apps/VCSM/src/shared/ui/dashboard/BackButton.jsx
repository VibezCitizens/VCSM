import { ChevronLeft } from "lucide-react";

export default function VportBackButton({ isDesktop = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: isDesktop ? '8px 14px' : '6px 8px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <ChevronLeft size={18} strokeWidth={2} />
      {isDesktop && <span>Back</span>}
    </button>
  );
}

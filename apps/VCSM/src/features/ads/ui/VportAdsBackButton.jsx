import { ChevronLeft } from "lucide-react";

export default function VportAdsBackButton({ isDesktop = false, onClick, style = {} }) {
  return (
    <button type="button" onClick={onClick} style={style} aria-label="Back">
      {isDesktop ? (
        "Back"
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={22} />
          <span>Back</span>
        </span>
      )}
    </button>
  );
}

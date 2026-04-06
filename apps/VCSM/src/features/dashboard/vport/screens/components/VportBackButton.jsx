import React from "react";
import { ChevronLeft } from "lucide-react";

export default function VportBackButton({ isDesktop = false, onClick, style = {} }) {
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


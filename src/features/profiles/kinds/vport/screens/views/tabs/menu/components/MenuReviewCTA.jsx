import React from "react";
import { Star } from "lucide-react";

export default function MenuReviewCTA({ onClick, label = "Review Food" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        fixed bottom-24 right-4 z-40
        flex items-center gap-2
        px-4 py-2
        rounded-full
        bg-white/10 backdrop-blur-md
        border border-white/20
        text-white text-sm font-semibold
        shadow-lg
        hover:bg-white/15
        active:scale-95
        transition-all
      "
      style={{ WebkitBackdropFilter: "blur(12px)" }}
      aria-label={label}
    >
      <Star size={16} className="text-yellow-400" />
      {label}
    </button>
  );
}

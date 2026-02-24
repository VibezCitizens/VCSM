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
        bg-sky-300/12 backdrop-blur-md
        border border-sky-300/35
        text-sky-100 text-sm font-semibold
        shadow-lg
        hover:bg-sky-300/20
        active:scale-95
        transition-all
      "
      style={{ WebkitBackdropFilter: "blur(12px)" }}
      aria-label={label}
    >
      <Star size={16} className="text-sky-300" />
      {label}
    </button>
  );
}

import React from "react";
import { Star } from "phosphor-react";

export default function SubscribeButton({
  label = "Subscribe",
  isSubscribed = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md 
        w-[140px]
        border border-black text-black font-medium bg-white 
        hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {/* fixed-width icon box */}
      <span className="inline-flex w-4 justify-center">
        <Star
          size={18}
          weight={isSubscribed ? "fill" : "regular"}
          color={isSubscribed ? "#A855F7" : "black"}
        />
      </span>

      <span>{label}</span>
    </button>
  );
}

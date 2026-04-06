// src/features/wanders/components/cardstemplates/photo/PhotoCard.preview.jsx
import React from "react";

export default function PhotoCardPreview({ data }) {
  const src = data?.imageUrl || data?.imageDataUrl || "";
  const title = (data?.title || "").trim();

  // ✅ fallback: if template message is missing, use generic message (message_text)
  const message = String(data?.message || data?.messageText || "").trim();

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
      {src ? (
        <div className="relative">
          <img src={src} alt="" className="w-full h-64 object-cover" />

          {(title || message) ? (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4">
                {title ? (
                  <div className="text-white text-base font-semibold drop-shadow">
                    {title}
                  </div>
                ) : null}

                {message ? (
                  <div className="mt-1 text-white/95 text-sm whitespace-pre-wrap leading-relaxed drop-shadow">
                    {message}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-4 text-sm text-gray-600">Pick a photo to preview.</div>
      )}
    </div>
  );
}

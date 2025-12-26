import React, { useState } from "react";

export default function MediaCarousel({ media = [] }) {
  const [index, setIndex] = useState(0);

  if (!media.length) return null;

  const current = media[index];

  const next = () =>
    setIndex((i) => (i + 1 < media.length ? i + 1 : i));

  const prev = () =>
    setIndex((i) => (i - 1 >= 0 ? i - 1 : i));

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-neutral-900">

      {/* IMAGE */}
      {current.type === "image" && (
        <img
          src={current.url}
          alt=""
          className="w-full object-cover max-h-[450px] rounded-xl"
        />
      )}

      {/* VIDEO */}
      {current.type === "video" && (
        <video
          src={current.url}
          controls
          className="w-full object-cover max-h-[450px] rounded-xl"
        />
      )}

      {/* ARROWS */}
      {media.length > 1 && (
        <>
          <button
            onClick={prev}
            className="
              absolute left-3 top-1/2 -translate-y-1/2
              bg-black/40 hover:bg-black/60
              text-white rounded-full w-8 h-8
              flex items-center justify-center
            "
          >
            ‹
          </button>

          <button
            onClick={next}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              bg-black/40 hover:bg-black/60
              text-white rounded-full w-8 h-8
              flex items-center justify-center
            "
          >
            ›
          </button>
        </>
      )}

      {/* DOTS */}
      {media.length > 1 && (
        <div className="absolute bottom-3 w-full flex justify-center gap-2">
          {media.map((_, i) => (
            <div
              key={i}
              className={`
                w-2 h-2 rounded-full
                ${i === index ? "bg-white" : "bg-white/40"}
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
}

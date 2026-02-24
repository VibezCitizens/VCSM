import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function MediaCarousel({ media = [] }) {
  const [index, setIndex] = useState(0);
  const startXRef = useRef(null);
  const deltaXRef = useRef(0);

  const items = useMemo(
    () => (Array.isArray(media) ? media.filter(Boolean) : []),
    [media]
  );
  const count = items.length;

  useEffect(() => {
    // keep index valid if media changes
    setIndex((i) => clamp(i, 0, Math.max(0, count - 1)));
  }, [count]);

  const next = useCallback(
    () => setIndex((i) => (i + 1 < count ? i + 1 : i)),
    [count]
  );

  const prev = useCallback(
    () => setIndex((i) => (i - 1 >= 0 ? i - 1 : i)),
    []
  );

  // ✅ Lazy-load: only load current +/- 1
  const shouldLoad = useCallback(
    (i) => Math.abs(i - index) <= 1,
    [index]
  );

  // Precompute what we will actually render as "current"
  // (still uses single-viewer style, but we control src loading)
  const renderNode = useMemo(() => {
    const current = items[index];
    const type = current?.type;
    const url = current?.url;

    // If for some reason we don't have url, show placeholder
    if (!url) {
      return <div className="w-full max-h-[450px] h-[350px] bg-neutral-950 animate-pulse rounded-xl" />;
    }

    if (type === "video") {
      return (
        <video
          // ✅ only set src when current is "loaded" (always true here)
          src={url}
          controls
          preload="metadata"
          className="w-full object-cover max-h-[450px] rounded-xl"
        />
      );
    }

    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-full object-cover max-h-[450px] rounded-xl"
        draggable={false}
      />
    );
  }, [items, index]);

  // ✅ Touch swipe (mobile)
  function onTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) return;
    startXRef.current = e.touches[0].clientX;
    deltaXRef.current = 0;
  }

  function onTouchMove(e) {
    if (startXRef.current == null) return;
    if (!e.touches || e.touches.length !== 1) return;

    const x = e.touches[0].clientX;
    deltaXRef.current = x - startXRef.current;
  }

  function onTouchEnd() {
    const dx = deltaXRef.current || 0;
    startXRef.current = null;
    deltaXRef.current = 0;

    // swipe threshold
    if (Math.abs(dx) < 50) return;

    if (dx < 0) next();
    else prev();
  }

  // ✅ Also support trackpad/drag with pointer events
  function onPointerDown(e) {
    // only left click / primary
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startXRef.current = e.clientX;
    deltaXRef.current = 0;
  }

  function onPointerMove(e) {
    if (startXRef.current == null) return;
    deltaXRef.current = e.clientX - startXRef.current;
  }

  function onPointerUp() {
    const dx = deltaXRef.current || 0;
    startXRef.current = null;
    deltaXRef.current = 0;

    if (Math.abs(dx) < 70) return;

    if (dx < 0) next();
    else prev();
  }

  // ✅ Preload neighbors (but don’t render them)
  // This improves perceived performance while still avoiding loading all 10.
  useEffect(() => {
    // preload images only (videos stay metadata-on-demand)
    const toPreload = [];
    for (let i = 0; i < count; i++) {
      if (!shouldLoad(i)) continue;
      const m = items[i];
      if (m?.type !== "image") continue;
      if (!m?.url) continue;
      if (i === index) continue;

      toPreload.push(m.url);
    }

    const imgs = toPreload.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      return img;
    });

    return () => {
      // no-op; browser handles cache
      void imgs;
    };
  }, [index, count, items, shouldLoad]);

  if (!count) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-neutral-900"
      onTouchStart={count > 1 ? onTouchStart : undefined}
      onTouchMove={count > 1 ? onTouchMove : undefined}
      onTouchEnd={count > 1 ? onTouchEnd : undefined}
      onPointerDown={count > 1 ? onPointerDown : undefined}
      onPointerMove={count > 1 ? onPointerMove : undefined}
      onPointerUp={count > 1 ? onPointerUp : undefined}
    >
      {/* CURRENT MEDIA */}
      {renderNode}

      {/* ✅ SWIPE INDICATOR (1 / N) */}
      {count > 1 && (
        <div className="pointer-events-none absolute top-3 right-3">
          <div className="rounded-full bg-black/60 text-white text-xs px-2.5 py-1">
            {index + 1} / {count}
          </div>
        </div>
      )}

      {/* ARROWS */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
            className="
              absolute left-3 top-1/2 -translate-y-1/2
              bg-black/40 hover:bg-black/60
              text-white rounded-full w-8 h-8
              flex items-center justify-center
            "
            aria-label="Previous media"
            type="button"
          >
            ‹
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              bg-black/40 hover:bg-black/60
              text-white rounded-full w-8 h-8
              flex items-center justify-center
            "
            aria-label="Next media"
            type="button"
          >
            ›
          </button>
        </>
      )}

      {/* DOTS */}
      {count > 1 && (
        <div className="absolute bottom-3 w-full flex justify-center gap-2">
          {items.map((m, i) => {
            // ✅ Lazy indicator: dim dots for not-loaded slides (optional visual cue)
            const loaded = shouldLoad(i);
            return (
              <div
                key={`${m?.url || "m"}-${i}`}
                className={`
                  w-2 h-2 rounded-full
                  ${i === index ? "bg-white" : loaded ? "bg-white/40" : "bg-white/20"}
                `}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

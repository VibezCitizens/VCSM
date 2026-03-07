// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\postcard\components\MediaCarousel.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function MediaCarousel({ media = [], prioritizeMedia = false }) {
  const [index, setIndex] = useState(0);
  const [currentLoaded, setCurrentLoaded] = useState(false);
  const startXRef = useRef(null);
  const deltaXRef = useRef(0);

  const items = useMemo(
    () => (Array.isArray(media) ? media.filter(Boolean) : []),
    [media]
  );
  const count = items.length;
  const current = items[index] ?? null;
  const currentType = current?.type;
  const currentUrl = current?.url ?? null;
  const hasCurrentUrl = typeof currentUrl === "string" && currentUrl.length > 0;

  useEffect(() => {
    setIndex((i) => clamp(i, 0, Math.max(0, count - 1)));
  }, [count]);

  useEffect(() => {
    setCurrentLoaded(!hasCurrentUrl);
  }, [hasCurrentUrl, index, currentUrl]);

  useEffect(() => {
    if (!hasCurrentUrl || currentType !== "image") return;
    const probe = new Image();
    probe.src = currentUrl;
    if (probe.complete) setCurrentLoaded(true);
  }, [hasCurrentUrl, currentType, currentUrl]);

  const next = useCallback(
    () => setIndex((i) => (i + 1 < count ? i + 1 : i)),
    [count]
  );

  const prev = useCallback(() => setIndex((i) => (i - 1 >= 0 ? i - 1 : i)), []);

  const shouldLoad = useCallback((i) => Math.abs(i - index) <= 1, [index]);

  const renderNode = useMemo(() => {
    const type = current?.type;
    const url = current?.url;

    if (!url) {
      return <div className="absolute inset-0 bg-neutral-950" />;
    }

    if (type === "video") {
      return (
        <video
          src={url}
          controls
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          onLoadedData={() => setCurrentLoaded(true)}
          onCanPlay={() => setCurrentLoaded(true)}
          onError={() => setCurrentLoaded(true)}
        />
      );
    }

    return (
      <img
        src={url}
        alt=""
        loading={prioritizeMedia ? "eager" : "lazy"}
        fetchPriority={prioritizeMedia ? "high" : "auto"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        onLoad={() => setCurrentLoaded(true)}
        onError={() => setCurrentLoaded(true)}
      />
    );
  }, [current, prioritizeMedia]);

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

    if (Math.abs(dx) < 50) return;
    if (dx < 0) next();
    else prev();
  }

  function onPointerDown(e) {
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

  useEffect(() => {
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
      void imgs;
    };
  }, [index, count, items, shouldLoad]);

  if (!count) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-neutral-900 touch-pan-y"
      onTouchStart={count > 1 ? onTouchStart : undefined}
      onTouchMove={count > 1 ? onTouchMove : undefined}
      onTouchEnd={count > 1 ? onTouchEnd : undefined}
      onTouchCancel={count > 1 ? onTouchEnd : undefined}
      onPointerDown={count > 1 ? onPointerDown : undefined}
      onPointerMove={count > 1 ? onPointerMove : undefined}
      onPointerUp={count > 1 ? onPointerUp : undefined}
      onPointerCancel={count > 1 ? onPointerUp : undefined}
    >
      <div className="relative w-full max-h-[450px] aspect-[4/3] bg-neutral-950">
        {renderNode}
        {!currentLoaded && (
          <div className="absolute inset-0 animate-pulse bg-neutral-950/85" />
        )}
      </div>

      {/* 1/N */}
      {count > 1 && currentLoaded && (
        <div className="pointer-events-none absolute top-3 right-3 z-10">
          <div className="rounded-full bg-black/60 text-white text-xs px-2.5 py-1">
            {index + 1} / {count}
          </div>
        </div>
      )}

      {/* arrows */}
      {count > 1 && currentLoaded && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="Next media"
            type="button"
          >
            ›
          </button>
        </>
      )}

      {/* dots */}
      {count > 1 && currentLoaded && (
        <div className="absolute bottom-3 w-full flex justify-center gap-2 z-10 pointer-events-none">
          {items.map((m, i) => {
            const loaded = shouldLoad(i);
            return (
              <div
                key={`${m?.url || "m"}-${i}`}
                className={`w-2 h-2 rounded-full ${
                  i === index ? "bg-white" : loaded ? "bg-white/40" : "bg-white/20"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

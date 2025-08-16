import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MediaCarousel({ items, itemWidth, itemHeight, renderItem }) {
  const ref = useRef(null);
  const scrollBy = (dir = 1) => {
    ref.current?.scrollBy({ left: dir * (itemWidth + 40), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div ref={ref} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-lg flex-none snap-center"
            style={{ width: itemWidth, height: itemHeight }}
          >
            {renderItem(p)}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-zinc-900/70 border border-zinc-800 rounded-full p-1"
        onClick={() => scrollBy(-1)}
        aria-label="Prev"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-900/70 border border-zinc-800 rounded-full p-1"
        onClick={() => scrollBy(1)}
        aria-label="Next"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

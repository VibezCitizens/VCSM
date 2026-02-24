// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\review\components\ReviewComposer.jsx
import React, { useMemo, useState } from "react";

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={[
            "w-9 h-9 rounded-2xl border flex items-center justify-center",
            n <= value
              ? "bg-purple-700 border-purple-500 text-white"
              : "bg-neutral-900 border-neutral-700 text-neutral-300",
          ].join(" ")}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function ReviewComposer({ submitting, dimensions, onClose, onSubmit }) {
  const initialRatings = useMemo(() => {
    const m = new Map();
    for (const d of dimensions ?? []) {
      m.set(d.dimensionKey, 5);
    }
    return m;
  }, [dimensions]);

  const [body, setBody] = useState("");
  const [ratingsMap, setRatingsMap] = useState(initialRatings);

  const ratings = useMemo(() => {
    return Array.from(ratingsMap.entries()).map(([dimensionKey, rating]) => ({
      dimensionKey,
      rating,
    }));
  }, [ratingsMap]);

  return (
    <div className="w-full rounded-2xl bg-neutral-950 border border-purple-900 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-white text-lg font-semibold">Write a review</div>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-2xl bg-neutral-900 text-white border border-neutral-700"
        >
          Close
        </button>
      </div>

      <div className="space-y-4">
        {(dimensions ?? []).map((d) => {
          const val = ratingsMap.get(d.dimensionKey) ?? 5;
          return (
            <div key={d.dimensionKey} className="flex items-center justify-between gap-4">
              <div className="text-neutral-200 min-w-[180px]">{d.label}</div>
              <Stars
                value={val}
                onChange={(next) => {
                  setRatingsMap((prev) => {
                    const copy = new Map(prev);
                    copy.set(d.dimensionKey, next);
                    return copy;
                  });
                }}
              />
            </div>
          );
        })}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write something..."
        className="
          w-full resize-none px-4 py-2 pr-10
          rounded-2xl bg-neutral-900 text-white
          border border-purple-700
          focus:ring-2 focus:ring-purple-500
        "
        rows={4}
      />

      <button
        type="button"
        disabled={submitting}
        onClick={() => onSubmit?.({ body: body.trim() || null, ratings })}
        className="w-full px-4 py-3 rounded-2xl bg-purple-700 text-white border border-purple-500 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}

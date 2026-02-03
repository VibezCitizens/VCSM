// src/features/upload/ui/SelectedThumbStrip.jsx
import { X } from "lucide-react";

export default function SelectedThumbStrip({ fileUrls, onClear, onRemoveAt }) {
  if (!fileUrls.length) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-neutral-300">
          Selected ({fileUrls.length})
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-xs text-neutral-400 hover:text-white"
        >
          Clear
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {fileUrls.map((u, idx) => (
          <div
            key={u}
            className="
              relative flex-none
              w-24 h-24
              rounded-2xl overflow-hidden
              border border-white/10
              bg-neutral-950
            "
          >
            <img
              src={u}
              alt={`preview-${idx}`}
              className="w-full h-full object-cover"
              draggable={false}
            />

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveAt(idx);
              }}
              className="
                absolute top-1.5 right-1.5
                w-7 h-7 rounded-full
                bg-black/65 hover:bg-black/85
                flex items-center justify-center
                border border-white/10
              "
              aria-label="Remove image"
            >
              <X size={16} className="text-white" />
            </button>

            <div
              className="
                absolute bottom-1.5 left-1.5
                text-[11px] px-2 py-0.5 rounded-full
                bg-black/55 text-white
                border border-white/10
              "
            >
              {idx + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

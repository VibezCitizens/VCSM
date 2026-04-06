// src/features/upload/ui/SelectedThumbStrip.jsx
import { useRef } from "react";
import { X } from "lucide-react";

export default function SelectedThumbStrip({ fileUrls, onClear, onRemoveAt }) {
  const lastActionAtRef = useRef(0);
  const ACTION_GUARD_MS = 300;

  function runGuarded(action) {
    const now = Date.now();
    if (now - lastActionAtRef.current < ACTION_GUARD_MS) return;
    lastActionAtRef.current = now;
    action?.();
  }

  if (!fileUrls.length) return null;

  return (
    <div className="upload-subcard mt-4 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-300">
          Selected ({fileUrls.length})
        </div>

        <button
          type="button"
          onClick={() => runGuarded(onClear)}
          className="text-xs text-slate-400 hover:text-slate-100"
        >
          Clear
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {fileUrls.map((u, idx) => (
          <div key={u} className="upload-thumb relative flex-none w-24 h-24 overflow-hidden">
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
                runGuarded(() => onRemoveAt(idx));
              }}
              className="upload-thumb-remove absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center"
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

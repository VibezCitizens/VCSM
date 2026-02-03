// src/features/upload/ui/UploadCard.jsx
import { MAX_VIBES_PHOTOS } from "../hooks/useMediaSelection";

export default function UploadCard({
  isVibes,
  selectedCount,
  onPick,
  inputRef,
  onChosen,
}) {
  return (
    <div
      className="
        relative
        rounded-3xl
        border border-white/10
        bg-gradient-to-b from-neutral-900/50 to-neutral-950/60
        px-6 py-8
        text-center
        cursor-pointer
        overflow-hidden
      "
      onClick={onPick}
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/*,video/*"
        multiple={isVibes}
        onChange={(e) => onChosen(e.target.files)}
      />

      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -inset-24 bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-3xl text-white/70">＋</span>
        </div>

        <div className="text-white/90 text-lg font-semibold">
          {isVibes ? "Add photos/videos (up to 10)" : "Add photo/video"}
        </div>
        <div className="text-white/50 text-sm mt-1">
          Tap to upload or drag & drop
        </div>

        {isVibes && (
          <div className="mt-3 text-xs text-white/50">
            Selected: <span className="text-white/80">{selectedCount}</span> /{" "}
            {MAX_VIBES_PHOTOS}
          </div>
        )}
      </div>
    </div>
  );
}

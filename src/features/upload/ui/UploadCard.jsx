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
        module-modern-card
        relative
        cursor-pointer
        overflow-hidden
        rounded-3xl
        px-6 py-8
        text-center
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

      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -inset-24 bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300/20 bg-slate-900/50">
          <span className="text-3xl text-slate-200">+</span>
        </div>

        <div className="text-lg font-semibold text-slate-100">
          {isVibes ? "Add photos/videos (up to 10)" : "Add photo/video"}
        </div>
        <div className="mt-1 text-sm text-slate-400">Tap to upload or drag and drop</div>

        {isVibes && (
          <div className="mt-3 text-xs text-slate-400">
            Selected: <span className="text-slate-200">{selectedCount}</span> / {MAX_VIBES_PHOTOS}
          </div>
        )}
      </div>
    </div>
  );
}

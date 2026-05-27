import { useState } from "react";
import { useTranslation } from "@i18n";
import { MAX_VIBES_PHOTOS } from "../hooks/useMediaSelection";

export default function UploadCard({
  isVibes,
  selectedCount,
  onPick,   // kept for API compatibility — label handles activation natively
  inputRef,
  onChosen,
}) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    // Only clear when the drag leaves the card entirely (not just a child boundary)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      onChosen(e.dataTransfer.files);
    }
  }

  return (
    <label
      className={`upload-card upload-card-pressable relative block overflow-hidden rounded-3xl px-6 py-8 text-center${isDragging ? ' upload-card--drag' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/*
        Invisible file input that covers the entire card.
        Using opacity-0 + absolute inset instead of display:none so that:
        - Firefox does NOT render the native "Browse… No files selected." UI
        - The element remains in the accessibility tree (focusable, keyboard-operable)
        - Drag-and-drop targets this element natively in all browsers
        The wrapping <label> activates this input on any click within the card.
      */}
      <input
        type="file"
        ref={inputRef}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        style={{ zIndex: 20 }}
        accept="image/*,video/*"
        multiple={isVibes}
        onChange={(e) => onChosen(e.target.files)}
      />

      {/* Background glow — no pointer events, sits behind content */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -inset-24 bg-purple-500/8 blur-3xl" />
      </div>

      {/*
        pointer-events-none so clicks fall through to the input overlay above,
        and drag events bubble up to the label's drag handlers.
      */}
      <div className="pointer-events-none relative z-10">
        <div className="upload-plus mx-auto mb-4">
          <span>+</span>
        </div>

        <div className="text-lg font-semibold text-white">
          {isVibes ? t('upload.addPhotosVideos', { max: MAX_VIBES_PHOTOS }) : t('upload.addPhotoVideo')}
        </div>
        <div className="mt-1 text-sm text-white/50">{t('upload.tapToUpload')}</div>

        {isVibes && (
          <div className="mt-3 text-xs text-white/50">
            {t('upload.selectedCount', { count: selectedCount, max: MAX_VIBES_PHOTOS })}
          </div>
        )}
      </div>
    </label>
  );
}

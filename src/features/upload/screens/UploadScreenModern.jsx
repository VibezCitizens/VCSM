// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\upload\screens\UploadScreenModern.jsx
import React, { useMemo, useState } from "react";

import UploadHeader from "../ui/UploadHeader";
import UploadCard from "../ui/UploadCard";
import SelectedThumbStrip from "../ui/SelectedThumbStrip";
import CaptionCard from "../ui/CaptionCard";
import PrimaryActionButton from "../ui/PrimaryActionButton";
import "@/features/ui/modern/module-modern.css";

import { useMediaSelection, MAX_VIBES_PHOTOS } from "../hooks/useMediaSelection";
import { extractMentions } from "../lib/extractMentions";

export default function UploadScreenModern({ onSubmit }) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [mode, setMode] = useState("post"); // post=vibes
  const [locationText, setLocationText] = useState("");

  // ✅ NEW: resolved mention objects (picked from typeahead)
  // Shape: { handle, actorId, kind, displayName, avatarUrl }
  const [mentionsResolved, setMentionsResolved] = useState([]);

  const media = useMediaSelection({ mode });
  const isVibes = media.isVibes;

  // UI-only: parse mentions from caption (handles only)
  const mentions = useMemo(() => extractMentions(caption), [caption]);

  function removeMention(handle) {
    // remove all occurrences of @handle (case-insensitive-ish)
    // simple UI cleanup: remove tokens "@handle"
    const re = new RegExp(`@${handle}\\b`, "gi");
    const next = caption.replace(re, "").replace(/\s{2,}/g, " ").trim();
    setCaption(next);

    // ✅ keep resolved mentions in sync
    setMentionsResolved((prev) =>
      (prev || []).filter((m) => String(m?.handle || "").toLowerCase() !== String(handle).toLowerCase())
    );
  }

  function disabledReason() {
    if (!caption.trim() && media.files.length === 0) return "Add text or media";
    return null;
  }

  async function submit() {
    if (disabledReason()) return;

    media.setError("");

    await onSubmit({
      caption,
      visibility,
      mode,

      // media
      files: media.files,
      mediaTypes: media.mediaTypes,

      // UI-only fields
      locationText,

      // ✅ send BOTH:
      // - mentions: handles (string[]) used by older flow if needed
      // - mentionsResolved: resolved actor ids for insertPostMentions
      mentions,
      mentionsResolved,
    });
  }

  function handleChangeMode(nextMode) {
    setMode(nextMode);
    media.clear();
    media.setError("");

    // ✅ mentions are caption-derived; keep caption as-is.
    // But resolved mention objects may not match new caption changes later; keep them,
    // CaptionCard will dedupe + user can remove.
  }

  return (
    <div className="module-modern-page h-full min-h-0 w-full">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col">
        <div
          className="flex-1 min-h-0 overflow-y-auto touch-pan-y px-3 pt-5 sm:px-4 sm:pt-6"
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: "calc(var(--vc-bottom-nav-total-height) + 20px)",
          }}
        >
          <div className="mx-auto w-full max-w-xl">
            <UploadHeader mode={mode} onChangeMode={handleChangeMode} />

            <UploadCard
              isVibes={isVibes}
              selectedCount={media.files.length}
              onPick={media.pick}
              inputRef={media.inputRef}
              onChosen={media.handleChosen}
            />

            <SelectedThumbStrip
              fileUrls={media.fileUrls}
              onClear={() => {
                media.setError("");
                media.clear();
              }}
              onRemoveAt={media.removeAt}
            />

            {media.error && <div className="mt-3 text-red-400 text-sm">{media.error}</div>}

            <CaptionCard
              caption={caption}
              setCaption={setCaption}
              mentions={mentionsResolved}
              setMentions={setMentionsResolved}
              onRemoveMention={removeMention}
              locationText={locationText}
              setLocationText={setLocationText}
              visibility={visibility}
              setVisibility={setVisibility}
            />

            <PrimaryActionButton label={"Spread"} disabled={!!disabledReason()} onClick={submit} />

            {isVibes && media.files.length >= MAX_VIBES_PHOTOS && (
              <div className="mt-4 text-center text-xs text-slate-500">
                You can upload up to {MAX_VIBES_PHOTOS} photos at a time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

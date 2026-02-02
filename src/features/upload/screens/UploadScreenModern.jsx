import React, { useState, useRef } from "react";
import MediaPreview from "../ui/MediaPreview";
import SegmentedButton from "../ui/SegmentedButton";
import ActorPill from "../ui/ActorPill";
import { classifyFile } from "../lib/classifyFile";

export default function UploadScreenModern({ onSubmit }) {
  const inputRef = useRef(null);

  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [mode, setMode] = useState("post");

  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");

  function handlePick() {
    inputRef.current?.click();
  }

  async function handleChosen(f) {
    if (!f) return;

    const check = classifyFile(f);
    if (check.error) {
      setError(check.error);
      return;
    }

    setError("");
    setFile(f);
    setMediaType(check.type);
    setFileUrl(URL.createObjectURL(f));
  }

  function disabledReason() {
    if (!caption.trim() && !file) return "Add text or media";
    return null;
  }

  async function submit() {
    if (disabledReason()) return;
    setError("");

    await onSubmit({
      caption,
      visibility,
      mode,
      file,
      mediaType,
    });
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
      <div className="flex flex-col items-center gap-3 mb-4">
        <ActorPill />

        <div className="flex gap-2">
          <SegmentedButton active={mode === "post"} onClick={() => setMode("post")}>
            VIBE
          </SegmentedButton>
          <SegmentedButton active={mode === "24drop"} onClick={() => setMode("24drop")}>
            24DROP
          </SegmentedButton>
          <SegmentedButton active={mode === "vdrop"} onClick={() => setMode("vdrop")}>
            VDROP
          </SegmentedButton>
        </div>
      </div>

      <div
        className="rounded-xl border border-dashed border-neutral-600 p-6 text-center bg-neutral-900 cursor-pointer"
        onClick={handlePick}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept="image/*,video/*"
          onChange={(e) => handleChosen(e.target.files?.[0])}
        />
        <div className="text-neutral-300">Click to upload or drag & drop</div>
      </div>

      <div className="mt-4">
        <MediaPreview url={fileUrl} type={mediaType} />
      </div>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={4}
        placeholder="Write a caption…"
        className="w-full mt-4 px-4 py-3 rounded-xl bg-neutral-900 text-white border border-neutral-700"
      />

      <select
        className="w-full mt-4 px-4 py-2 rounded-xl bg-neutral-900 text-white border border-neutral-700"
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
      >
        <option value="public">Public</option>
        <option value="followers">Followers</option>
        <option value="private">Private</option>
      </select>

      {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}

      <button
        disabled={!!disabledReason()}
        onClick={submit}
        className={`mt-6 w-full px-4 py-3 rounded-xl font-semibold ${
          disabledReason()
            ? "bg-neutral-700 text-neutral-400"
            : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {disabledReason() || "Publish"}
      </button>
    </div>
  );
}

import React, { useState, useRef } from "react";
import MediaPreview from "../ui/MediaPreview";
import SegmentedButton from "../ui/SegmentedButton";
import ActorPill from "../ui/ActorPill";
import { classifyFile } from "../lib/classifyFile";

const MAX_VIBES_PHOTOS = 10;

export default function UploadScreenModern({ onSubmit }) {
  const inputRef = useRef(null);

  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [mode, setMode] = useState("post"); // post=vibes

  // ✅ multi
  const [files, setFiles] = useState([]);         // File[]
  const [mediaTypes, setMediaTypes] = useState([]); // string[]
  const [fileUrls, setFileUrls] = useState([]);   // string[]
  const [error, setError] = useState("");

  function handlePick() {
    inputRef.current?.click();
  }

  function clearSelection() {
    // cleanup object urls
    fileUrls.forEach((u) => {
      try { URL.revokeObjectURL(u); } catch {}
    });
    setFiles([]);
    setMediaTypes([]);
    setFileUrls([]);
  }

  async function handleChosen(list) {
    const picked = Array.from(list || []);
    if (picked.length === 0) return;

    // rules:
    // - VIBES: up to 10 images
    // - 24drop/vdrop: keep single file behavior (current)
    const isVibes = mode === "post";

    if (!isVibes) {
      const f = picked[0];
      if (!f) return;

      const check = classifyFile(f);
      if (check.error) {
        setError(check.error);
        return;
      }

      setError("");
      clearSelection();
      setFiles([f]);
      setMediaTypes([check.type]);
      setFileUrls([URL.createObjectURL(f)]);
      return;
    }

    // VIBES: images only, up to 10
    const images = picked.filter((f) => String(f?.type || "").startsWith("image/"));
    if (images.length === 0) {
      setError("VIBES: please select images only (up to 10).");
      return;
    }

    if (images.length > MAX_VIBES_PHOTOS) {
      setError(`You can upload up to ${MAX_VIBES_PHOTOS} photos at a time.`);
      return;
    }

    // validate each with classifyFile
    const nextFiles = [];
    const nextTypes = [];
    const nextUrls = [];

    for (const f of images) {
      const check = classifyFile(f);
      if (check.error) {
        setError(check.error);
        // cleanup created URLs so far
        nextUrls.forEach((u) => {
          try { URL.revokeObjectURL(u); } catch {}
        });
        return;
      }
      if (check.type !== "image") {
        setError("VIBES: only images are allowed for multi-upload.");
        nextUrls.forEach((u) => {
          try { URL.revokeObjectURL(u); } catch {}
        });
        return;
      }

      nextFiles.push(f);
      nextTypes.push(check.type);
      nextUrls.push(URL.createObjectURL(f));
    }

    setError("");
    clearSelection();
    setFiles(nextFiles);
    setMediaTypes(nextTypes);
    setFileUrls(nextUrls);
  }

  function disabledReason() {
    if (!caption.trim() && files.length === 0) return "Add text or media";
    return null;
  }

  async function submit() {
    if (disabledReason()) return;
    setError("");

    await onSubmit({
      caption,
      visibility,
      mode,
      files,       // ✅ now array
      mediaTypes,  // ✅ now array
    });
  }

  const isVibes = mode === "post";

  return (
    <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
      <div className="flex flex-col items-center gap-3 mb-4">
        <ActorPill />

        <div className="flex gap-2">
          <SegmentedButton active={mode === "post"} onClick={() => { setMode("post"); clearSelection(); }}>
            VIBE
          </SegmentedButton>
          <SegmentedButton active={mode === "24drop"} onClick={() => { setMode("24drop"); clearSelection(); }}>
            24DROP
          </SegmentedButton>
          <SegmentedButton active={mode === "vdrop"} onClick={() => { setMode("vdrop"); clearSelection(); }}>
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
          multiple={isVibes} // ✅ allow multi only for VIBES
          onChange={(e) => handleChosen(e.target.files)}
        />
        <div className="text-neutral-300">
          {isVibes ? "Click to upload (up to 10 photos) or drag & drop" : "Click to upload or drag & drop"}
        </div>
      </div>

      {/* ✅ Preview */}
      <div className="mt-4">
        {fileUrls.length <= 1 ? (
          <MediaPreview url={fileUrls[0] || ""} type={mediaTypes[0] || null} />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {fileUrls.map((u, idx) => (
              <div key={u} className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                <img src={u} alt={`preview-${idx}`} className="w-full h-28 object-cover" />
              </div>
            ))}
          </div>
        )}
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

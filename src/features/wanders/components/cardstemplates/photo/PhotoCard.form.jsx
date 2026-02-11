// src/features/wanders/components/cardstemplates/photo/PhotoCard.form.jsx
import React, { useRef, useState } from "react";

export default function PhotoCardForm({ data, setData, ui }) {
  const [imageError, setImageError] = useState(null);
  const fileRef = useRef(null);

  const onPickImage = () => {
    setImageError(null);
    fileRef.current?.click?.();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // allow re-picking same file later
    e.target.value = "";

    if (!file.type?.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageError("Image is too large (max 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === "string" ? reader.result : null;

      setData((prev) => ({
        ...prev,
        imageFile: file,             // keep if you want later
        imageDataUrl: imageDataUrl,  // ✅ preview uses this
      }));
    };
    reader.onerror = () => {
      setImageError("Could not read that file. Try another image.");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageError(null);
    setData((prev) => ({
      ...prev,
      imageFile: null,
      imageDataUrl: null,
      imageUrl: "", // keep consistent if you later upload
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={ui.labelBase}>Title</label>
        <input
          className={ui.inputBase}
          value={data?.title || ""}
          onChange={(e) => setData((p) => ({ ...p, title: e.target.value }))}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className={ui.labelBase}>Message</label>
        <textarea
          className={ui.textareaBase}
          value={data?.message || ""}
          onChange={(e) => setData((p) => ({ ...p, message: e.target.value }))}
          placeholder="Write something…"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <label className={`${ui.labelBase} mb-0`}>Photo</label>

          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={onPickImage}
              className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-200"
            >
              {data?.imageDataUrl ? "Change photo" : "Add photo"}
            </button>

            {data?.imageDataUrl ? (
              <button
                type="button"
                onClick={removeImage}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        {imageError ? (
          <div className="mt-2 text-xs text-red-600">{imageError}</div>
        ) : null}

        {data?.imageDataUrl ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <img
              src={data.imageDataUrl}
              alt="Preview"
              className="w-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

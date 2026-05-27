import React from "react";
import {
  MOTHERS_DAY_BACKGROUND_OPTIONS,
  MOTHERS_DAY_CTA_OPTIONS,
  MOTHERS_DAY_PALETTE_OPTIONS,
  normalizeCtaType,
} from "./mothersDay.shared";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export function MothersDayPremiumForm({ data, setData, ui }) {
  const fileRef = React.useRef(null);
  const [localImageError, setLocalImageError] = React.useState("");

  const label =
    ui?.labelBase ||
    "block text-[13px] font-semibold tracking-[0.01em] text-gray-900 mb-1.5";
  const input =
    ui?.inputBase ||
    "w-full rounded-2xl border px-4 py-3 text-[15px] leading-6 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] transition duration-150 hover:border-gray-300 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-black/10";
  const textarea =
    ui?.textareaBase || `${input} align-top resize-none min-h-[120px]`;
  const select = ui?.selectBase || input;

  const ctaType = normalizeCtaType(data?.ctaType, "none");

  const onPickImage = () => {
    setLocalImageError("");
    fileRef.current?.click?.();
  };

  const onFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setLocalImageError("Please choose an image file.");
      return;
    }

    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      setLocalImageError("Image is too large (max 4MB).");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setData((prev) => ({
        ...prev,
        imageFile: file,
        imageDataUrl: dataUrl || null,
      }));
    } catch {
      setLocalImageError("Could not load that image.");
    }
  };

  const removeImage = () => {
    setLocalImageError("");
    setData((prev) => ({
      ...prev,
      imageFile: null,
      imageDataUrl: null,
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <label className={label}>To</label>
        <input
          type="text"
          placeholder="Recipient name (optional)"
          className={input}
          value={data.toName}
          onChange={(e) => setData((prev) => ({ ...prev, toName: e.target.value }))}
        />
      </div>

      {!data.sendAnonymously ? (
        <div>
          <label className={label}>From</label>
          <input
            type="text"
            placeholder="Your name"
            className={input}
            value={data.fromName}
            onChange={(e) => setData((prev) => ({ ...prev, fromName: e.target.value }))}
          />
        </div>
      ) : null}

      <div>
        <label className={label}>Title</label>
        <input
          type="text"
          placeholder="Happy Mother's Day"
          className={input}
          value={data.title}
          onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <label className={label}>Subtitle</label>
        <input
          type="text"
          placeholder="A short elegant line"
          className={input}
          value={data.subtitle}
          onChange={(e) => setData((prev) => ({ ...prev, subtitle: e.target.value }))}
        />
      </div>

      <div>
        <label className={label}>Message</label>
        <textarea
          className={textarea}
          placeholder="Write your premium card message..."
          value={data.message}
          onChange={(e) => setData((prev) => ({ ...prev, message: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Background</label>
          <select
            className={select}
            value={data.background}
            onChange={(e) => setData((prev) => ({ ...prev, background: e.target.value }))}
          >
            {MOTHERS_DAY_BACKGROUND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Palette</label>
          <select
            className={select}
            value={data.palette}
            onChange={(e) => setData((prev) => ({ ...prev, palette: e.target.value }))}
          >
            {MOTHERS_DAY_PALETTE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className={`${label} mb-0`}>Hero image</label>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            <button
              type="button"
              onClick={onPickImage}
              className="rounded-xl border border-white/15 bg-black/5 px-3 py-1.5 text-xs font-semibold text-gray-800 transition hover:bg-black/10"
            >
              {data?.imageDataUrl ? "Change image" : "Upload image"}
            </button>
            {data?.imageDataUrl ? (
              <button
                type="button"
                onClick={removeImage}
                className="rounded-xl border border-white/15 bg-transparent px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-black/5"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        <input
          type="text"
          className={input}
          placeholder="https://example.com/hero-image.jpg (optional)"
          value={data.imageUrl || ""}
          onChange={(e) => setData((prev) => ({ ...prev, imageUrl: e.target.value }))}
        />

        {localImageError ? <div className="mt-2 text-xs text-rose-500">{localImageError}</div> : null}

        {data?.imageDataUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/15 bg-black/10">
            <img src={data.imageDataUrl} alt="Hero preview" className="h-32 w-full object-cover" />
          </div>
        ) : null}
      </div>

      <div>
        <label className={label}>CTA type</label>
        <select
          className={select}
          value={ctaType}
          onChange={(e) => setData((prev) => ({ ...prev, ctaType: e.target.value }))}
        >
          {MOTHERS_DAY_CTA_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {ctaType !== "none" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>CTA label</label>
            <input
              type="text"
              className={input}
              placeholder="View Offer"
              value={data.ctaLabel}
              onChange={(e) => setData((prev) => ({ ...prev, ctaLabel: e.target.value }))}
            />
          </div>
          <div>
            <label className={label}>CTA URL</label>
            <input
              type="text"
              className={input}
              placeholder="/vport/your-slug/card or https://..."
              value={data.ctaUrl}
              onChange={(e) => setData((prev) => ({ ...prev, ctaUrl: e.target.value }))}
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className={label}>VPORT slug (optional)</label>
        <input
          type="text"
          className={input}
          placeholder="john-flowers"
          value={data.vportSlug}
          onChange={(e) => setData((prev) => ({ ...prev, vportSlug: e.target.value }))}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!data.sendAnonymously}
          onChange={(e) => setData((prev) => ({ ...prev, sendAnonymously: e.target.checked }))}
        />
        <span className="text-sm text-gray-800">Send anonymously</span>
      </label>
    </div>
  );
}

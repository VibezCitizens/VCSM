import React from "react";

import {
  MOTHERS_DAY_BACKGROUND_OPTIONS,
  MOTHERS_DAY_CTA_OPTIONS,
  MOTHERS_DAY_PALETTE_OPTIONS,
  buildMotherDayPayload,
  normalizeCtaType,
  resolveMotherDayPaletteClasses,
  safeTrim,
} from "./mothersDay.shared";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export const mothersDayPremiumTemplate = {
  id: "mothers_day_premium",
  cardType: "mothers_day",
  hideTemplatePicker: false,

  defaultData: {
    toName: "",
    fromName: "",
    title: "Happy Mother’s Day",
    subtitle: "A beautiful day to celebrate the heart of the family.",
    message: "Thank you for your love, strength, and care. Today is for you. 💐",
    background: "midnight-bloom",
    palette: "amethyst-floral",
    sendAnonymously: false,

    imageFile: null,
    imageUrl: "",
    imageDataUrl: null,

    ctaType: "none",
    ctaLabel: "",
    ctaUrl: "",
    vportSlug: "",
    campaign: "mothers_day_2026",
  },

  toPayload(data) {
    return buildMotherDayPayload({
      data,
      templateKey: this.id,
      kind: "mothers_day",
      fallbackTitle: "Happy Mother’s Day",
      fallbackBackground: "midnight-bloom",
      fallbackPalette: "amethyst-floral",
      fallbackCtaType: "none",
    });
  },

  Form({ data, setData, ui }) {
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
            placeholder="Happy Mother’s Day"
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
                className="hidden"
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
  },

  Preview({ data }) {
    const palette = resolveMotherDayPaletteClasses(data?.palette);

    const title = safeTrim(data?.title) || "Happy Mother’s Day";
    const subtitle = safeTrim(data?.subtitle);
    const message = safeTrim(data?.message) || "Your premium Mother’s Day message appears here.";
    const ctaType = normalizeCtaType(data?.ctaType || data?.cta?.type, "none");
    const ctaLabel = safeTrim(data?.ctaLabel || data?.cta?.label) || "View Offer";
    const hero =
      safeTrim(data?.imageDataUrl) ||
      safeTrim(data?.image_data_url) ||
      safeTrim(data?.hero_image_url) ||
      safeTrim(data?.imageUrl) ||
      safeTrim(data?.image_url) ||
      "";

    return (
      <div className={`rounded-2xl border p-5 shadow-md min-h-[320px] flex flex-col justify-between overflow-hidden ${palette.shell}`}>
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette.badge}`}>
              Mother’s Day Premium
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Vibez</div>
          </div>

          {hero ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/15">
              <img src={hero} alt="Hero preview" className="h-32 w-full object-cover" />
            </div>
          ) : null}

          <h2 className={`mt-4 text-2xl font-semibold leading-tight ${palette.title}`}>{title}</h2>
          {subtitle ? <div className={`mt-2 text-sm ${palette.subtitle}`}>{subtitle}</div> : null}

          <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-4">
            <p className={`whitespace-pre-wrap text-sm leading-6 ${palette.body}`}>{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <div className={`text-sm font-medium ${palette.subtitle}`}>
            {data?.sendAnonymously || !safeTrim(data?.fromName)
              ? "— With love"
              : `— ${safeTrim(data?.fromName)}`}
          </div>

          {ctaType !== "none" ? (
            <div className="rounded-lg border border-pink-300/40 bg-pink-500/25 px-3 py-1.5 text-xs font-semibold text-pink-50">
              {ctaLabel}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
};


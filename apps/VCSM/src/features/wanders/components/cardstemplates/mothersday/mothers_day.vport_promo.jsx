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

export const mothersDayVportPromoTemplate = {
  id: "mothers_day_vport_promo",
  cardType: "mothers_day",
  hideTemplatePicker: false,

  defaultData: {
    toName: "",
    fromName: "",
    title: "Mother’s Day Special 💐",
    subtitle: "Celebrate with a local VPORT offer.",
    message: "A thoughtful gift is one tap away. Explore this Mother’s Day promotion.",
    background: "petal-glow",
    palette: "sunset-orchid",
    sendAnonymously: false,

    ctaType: "visit_vport",
    ctaLabel: "View Offer",
    ctaUrl: "",
    vportSlug: "",
    campaign: "mothers_day_2026",
  },

  toPayload(data) {
    return buildMotherDayPayload({
      data,
      templateKey: this.id,
      kind: "mothers_day",
      fallbackTitle: "Mother’s Day Special 💐",
      fallbackBackground: "petal-glow",
      fallbackPalette: "sunset-orchid",
      fallbackCtaType: "visit_vport",
    });
  },

  Form({ data, setData, ui }) {
    const label =
      ui?.labelBase ||
      "block text-[13px] font-semibold tracking-[0.01em] text-gray-900 mb-1.5";
    const input =
      ui?.inputBase ||
      "w-full rounded-2xl border px-4 py-3 text-[15px] leading-6 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] transition duration-150 hover:border-gray-300 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-black/10";
    const textarea =
      ui?.textareaBase || `${input} align-top resize-none min-h-[120px]`;
    const select = ui?.selectBase || input;

    const ctaType = normalizeCtaType(data?.ctaType, "visit_vport");
    const previewPromoLink = safeTrim(data?.vportSlug)
      ? `/vport/${safeTrim(data.vportSlug).toLowerCase()}/card`
      : "";

    return (
      <div className="space-y-5">
        <div>
          <label className={label}>Business / Sender name</label>
          <input
            type="text"
            className={input}
            placeholder="John’s Flowers"
            value={data.fromName}
            onChange={(e) => setData((prev) => ({ ...prev, fromName: e.target.value }))}
          />
        </div>

        <div>
          <label className={label}>Title</label>
          <input
            type="text"
            className={input}
            placeholder="Mother’s Day Special"
            value={data.title}
            onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div>
          <label className={label}>Subtitle</label>
          <input
            type="text"
            className={input}
            placeholder="Warm promo subtitle"
            value={data.subtitle}
            onChange={(e) => setData((prev) => ({ ...prev, subtitle: e.target.value }))}
          />
        </div>

        <div>
          <label className={label}>Promo message</label>
          <textarea
            className={textarea}
            placeholder="Describe your Mother’s Day offer..."
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
          <label className={label}>VPORT slug</label>
          <input
            type="text"
            className={input}
            placeholder="john-flowers"
            value={data.vportSlug}
            onChange={(e) => setData((prev) => ({ ...prev, vportSlug: e.target.value }))}
          />
          <div className="mt-2 text-xs text-gray-500">
            When present, CTA will point to: {previewPromoLink || "/vport/:slug/card"}
          </div>
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
              <label className={label}>CTA URL override</label>
              <input
                type="text"
                className={input}
                placeholder={ctaType === "visit_vport" ? "/vport/:slug/card" : "https://..."}
                value={data.ctaUrl}
                onChange={(e) => setData((prev) => ({ ...prev, ctaUrl: e.target.value }))}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  },

  Preview({ data }) {
    const palette = resolveMotherDayPaletteClasses(data?.palette);
    const title = safeTrim(data?.title) || "Mother’s Day Special 💐";
    const subtitle = safeTrim(data?.subtitle);
    const message = safeTrim(data?.message) || "Your VPORT promo message preview appears here.";
    const ctaType = normalizeCtaType(data?.ctaType, "visit_vport");
    const ctaLabel = safeTrim(data?.ctaLabel) || "View Offer";
    const hasCta = ctaType !== "none";

    return (
      <div className={`rounded-2xl border p-5 shadow-md min-h-[300px] flex flex-col justify-between ${palette.shell}`}>
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-100">
              Mother’s Day • VPORT Promo
            </div>
            <div className="text-[11px] font-semibold tracking-[0.08em] text-white/60 uppercase">
              {safeTrim(data?.fromName) || "VPORT"}
            </div>
          </div>

          <h2 className={`mt-4 text-2xl font-semibold leading-tight ${palette.title}`}>{title}</h2>
          {subtitle ? <div className={`mt-2 text-sm ${palette.subtitle}`}>{subtitle}</div> : null}

          <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-4">
            <p className={`whitespace-pre-wrap text-sm leading-6 ${palette.body}`}>{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <div className={`text-xs font-medium ${palette.subtitle}`}>
            {safeTrim(data?.vportSlug) ? `/vport/${safeTrim(data.vportSlug).toLowerCase()}/card` : "Set VPORT slug"}
          </div>

          {hasCta ? (
            <div className="rounded-lg border border-pink-300/40 bg-pink-500/25 px-3 py-1.5 text-xs font-semibold text-pink-50">
              {ctaLabel}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
};


import React from "react";

import {
  TA_BACKGROUND_OPTIONS,
  TA_CTA_OPTIONS,
  TA_PALETTE_OPTIONS,
  buildTeacherAppreciationPayload,
  normalizeCtaType,
  resolveTeacherAppreciationPaletteClasses,
  safeTrim,
} from "./teacherAppreciation.shared";

export const teacherAppreciationVportPromoTemplate = {
  id: "teacher_appreciation_vport_promo",
  cardType: "teacher_appreciation",
  hideTemplatePicker: false,

  defaultData: {
    fromName: "",
    title: "Teacher Appreciation Special",
    subtitle: "Show this card to claim the offer.",
    message:
      "We celebrate the teachers who shape our community. Present this card at checkout to receive your exclusive Teacher Appreciation discount.",
    background: "soft-glow",
    palette: "amber-warm",
    sendAnonymously: false,

    ctaType: "visit_vport",
    ctaLabel: "Claim Offer",
    ctaUrl: "",
    vportSlug: "",
    campaign: "teacher_appreciation_2026",
  },

  toPayload(data) {
    return buildTeacherAppreciationPayload({
      data,
      templateKey: this.id,
      kind: "teacher_appreciation",
      fallbackTitle: "Teacher Appreciation Special",
      fallbackBackground: "soft-glow",
      fallbackPalette: "amber-warm",
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
      ? `/vport/${safeTrim(data.vportSlug).toLowerCase().replace(/[^a-z0-9-]/g, "")}/card`
      : "";

    return (
      <div className="space-y-5">
        <div>
          <label className={label}>Business / Sender name</label>
          <input
            type="text"
            className={input}
            placeholder="ABC Bookstore"
            value={data.fromName}
            onChange={(e) => setData((prev) => ({ ...prev, fromName: e.target.value }))}
          />
        </div>

        <div>
          <label className={label}>Title</label>
          <input
            type="text"
            className={input}
            placeholder="Teacher Appreciation Special"
            value={data.title}
            onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div>
          <label className={label}>Subtitle</label>
          <input
            type="text"
            className={input}
            placeholder="Show this card to claim the offer."
            value={data.subtitle}
            onChange={(e) => setData((prev) => ({ ...prev, subtitle: e.target.value }))}
          />
        </div>

        <div>
          <label className={label}>Promo message</label>
          <textarea
            className={textarea}
            placeholder="Describe the offer or discount for teachers..."
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
              {TA_BACKGROUND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
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
              {TA_PALETTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
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
            placeholder="abc-bookstore"
            value={data.vportSlug}
            onChange={(e) => setData((prev) => ({ ...prev, vportSlug: e.target.value }))}
          />
          <div className="mt-2 text-xs text-gray-500">
            CTA will point to:{" "}
            <span className="font-medium">{previewPromoLink || "/vport/:slug/card"}</span>
          </div>
        </div>

        <div>
          <label className={label}>CTA type</label>
          <select
            className={select}
            value={ctaType}
            onChange={(e) => setData((prev) => ({ ...prev, ctaType: e.target.value }))}
          >
            {TA_CTA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
                placeholder="Claim Offer"
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
    const palette = resolveTeacherAppreciationPaletteClasses(data?.palette);
    const title = safeTrim(data?.title) || "Teacher Appreciation Special";
    const subtitle = safeTrim(data?.subtitle) || "Show this card to claim the offer.";
    const message = safeTrim(data?.message) || "Your VPORT promo message preview appears here.";
    const ctaType = normalizeCtaType(data?.ctaType, "visit_vport");
    const ctaLabel = safeTrim(data?.ctaLabel) || "Claim Offer";
    const vportSlug = safeTrim(data?.vportSlug).toLowerCase().replace(/[^a-z0-9-]/g, "");
    const hasCta = ctaType !== "none";

    return (
      <div
        className={`rounded-2xl border p-5 shadow-md min-h-[300px] flex flex-col justify-between ${palette.shell}`}
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette.badge}`}
            >
              🍎 Teacher Appreciation · VPORT
            </div>
            <div className="text-[11px] font-semibold tracking-[0.08em] text-white/55 uppercase">
              {safeTrim(data?.fromName) || "VPORT"}
            </div>
          </div>

          <h2 className={`mt-4 text-2xl font-semibold leading-tight ${palette.title}`}>{title}</h2>
          <div className={`mt-1 text-sm ${palette.subtitle}`}>{subtitle}</div>

          <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-4">
            <p className={`whitespace-pre-wrap text-sm leading-6 ${palette.body}`}>{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <div className={`text-xs font-medium ${palette.subtitle} truncate`}>
            {vportSlug ? `/vport/${vportSlug}/card` : "Set VPORT slug"}
          </div>

          {hasCta ? (
            <div className="rounded-lg border border-amber-300/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-50 shrink-0">
              {ctaLabel}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
};

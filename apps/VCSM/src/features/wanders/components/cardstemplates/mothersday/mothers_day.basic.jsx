import React from "react";

import {
  MOTHERS_DAY_BACKGROUND_OPTIONS,
  MOTHERS_DAY_PALETTE_OPTIONS,
  buildMotherDayPayload,
  resolveMotherDayPaletteClasses,
} from "./mothersDay.shared";

export const mothersDayBasicTemplate = {
  id: "mothers_day_basic",
  cardType: "mothers_day",
  hideTemplatePicker: false,

  defaultData: {
    toName: "",
    fromName: "",
    title: "Happy Mother’s Day",
    subtitle: "Sending love and gratitude.",
    message: "Wishing you joy, peace, and beautiful moments today.",
    background: "floral-soft",
    palette: "violet-rose",
    sendAnonymously: false,
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
      fallbackBackground: "floral-soft",
      fallbackPalette: "violet-rose",
      fallbackCtaType: "none",
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
            placeholder="A short warm line"
            className={input}
            value={data.subtitle}
            onChange={(e) => setData((prev) => ({ ...prev, subtitle: e.target.value }))}
          />
        </div>

        <div>
          <label className={label}>Message</label>
          <textarea
            className={textarea}
            placeholder="Write your message..."
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
    const title = data?.title?.trim() || "Happy Mother’s Day";
    const subtitle = data?.subtitle?.trim() || "";
    const message = data?.message?.trim() || "Your card message preview appears here.";
    const toLine = data?.toName?.trim() ? `To ${data.toName.trim()}` : "For someone special";
    const fromLine =
      data?.sendAnonymously || !data?.fromName?.trim()
        ? "— With love"
        : `— ${data.fromName.trim()}`;

    return (
      <div className={`rounded-2xl border p-5 shadow-md min-h-[280px] flex flex-col justify-between ${palette.shell}`}>
        <div>
          <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette.badge}`}>
            Mother’s Day
          </div>

          <div className="mt-4">
            <div className={`text-xs font-semibold uppercase tracking-[0.12em] ${palette.subtitle}`}>
              {toLine}
            </div>
            <h2 className={`mt-2 text-2xl font-semibold ${palette.title}`}>{title}</h2>
            {subtitle ? <div className={`mt-2 text-sm ${palette.subtitle}`}>{subtitle}</div> : null}
          </div>

          <div className="mt-4 rounded-xl border border-white/15 bg-black/20 p-4">
            <p className={`whitespace-pre-wrap text-sm leading-6 ${palette.body}`}>{message}</p>
          </div>
        </div>

        <div className={`mt-6 text-sm font-medium ${palette.subtitle}`}>{fromLine}</div>
      </div>
    );
  },
};


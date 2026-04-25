import React from "react";

import {
  TA_BACKGROUND_OPTIONS,
  TA_PALETTE_OPTIONS,
  buildTeacherAppreciationPayload,
  resolveTeacherAppreciationPaletteClasses,
  safeTrim,
} from "./teacherAppreciation.shared";

export const teacherAppreciationBasicTemplate = {
  id: "teacher_appreciation_basic",
  cardType: "teacher_appreciation",
  hideTemplatePicker: false,

  defaultData: {
    teacherName: "",
    fromName: "",
    title: "Thank You, Teacher",
    subtitle: "Your dedication makes a difference every day.",
    message:
      "Thank you for your patience, passion, and care. You inspire more than you know.",
    background: "warm-classroom",
    palette: "gold-purple",
    sendAnonymously: false,
    campaign: "teacher_appreciation_2026",
  },

  toPayload(data) {
    return buildTeacherAppreciationPayload({
      data,
      templateKey: this.id,
      kind: "teacher_appreciation",
      fallbackTitle: "Thank You, Teacher",
      fallbackBackground: "warm-classroom",
      fallbackPalette: "gold-purple",
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
          <label className={label}>Teacher name</label>
          <input
            type="text"
            placeholder="Ms. Johnson (optional)"
            className={input}
            value={data.teacherName}
            onChange={(e) => setData((prev) => ({ ...prev, teacherName: e.target.value }))}
          />
        </div>

        {!data.sendAnonymously ? (
          <div>
            <label className={label}>From</label>
            <input
              type="text"
              placeholder="Your name or student's name"
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
            placeholder="Thank You, Teacher"
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
            placeholder="Write your thank-you message..."
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
    const palette = resolveTeacherAppreciationPaletteClasses(data?.palette);
    const title = safeTrim(data?.title) || "Thank You, Teacher";
    const subtitle = safeTrim(data?.subtitle);
    const message = safeTrim(data?.message) || "Your card message preview appears here.";
    const teacherName = safeTrim(data?.teacherName);
    const toLine = teacherName ? `To ${teacherName}` : "To an amazing teacher";
    const fromLine =
      data?.sendAnonymously || !safeTrim(data?.fromName)
        ? "— With gratitude"
        : `— ${safeTrim(data?.fromName)}`;

    return (
      <div
        className={`rounded-2xl border p-5 shadow-md min-h-[280px] flex flex-col justify-between ${palette.shell}`}
      >
        <div>
          <div
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette.badge}`}
          >
            🍎 Teacher Appreciation
          </div>

          <div className="mt-4">
            <div
              className={`text-xs font-semibold uppercase tracking-[0.12em] ${palette.subtitle}`}
            >
              {toLine}
            </div>
            <h2 className={`mt-2 text-2xl font-semibold leading-tight ${palette.title}`}>
              {title}
            </h2>
            {subtitle ? (
              <div className={`mt-2 text-sm ${palette.subtitle}`}>{subtitle}</div>
            ) : null}
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

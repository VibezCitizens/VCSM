import React from "react";

export const valentinesMinimalTemplate = {
  id: "valentines-minimal",
  cardType: "valentines",
  hideTemplatePicker: false,

  defaultData: {
    toName: "",
    fromName: "",
    message: "❤️",
    sendAnonymously: false,
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

    return (
      <div className="space-y-5">
        <div>
          <label className={label}>To</label>
          <input
            type="text"
            placeholder="Recipient name"
            className={input}
            value={data.toName}
            onChange={(e) => setData((p) => ({ ...p, toName: e.target.value }))}
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
              onChange={(e) => setData((p) => ({ ...p, fromName: e.target.value }))}
            />
          </div>
        ) : null}

        <div>
          <label className={label}>Message</label>
          <textarea
            placeholder="Keep it short..."
            className={textarea}
            value={data.message}
            onChange={(e) => setData((p) => ({ ...p, message: e.target.value }))}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.sendAnonymously}
            onChange={(e) => setData((p) => ({ ...p, sendAnonymously: e.target.checked }))}
          />
          <span className="text-sm text-gray-800">Send anonymously</span>
        </label>
      </div>
    );
  },

  Preview({ data }) {
    const to = data.toName?.trim() ? data.toName.trim() : "Valentine";
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-10 shadow-sm min-h-[260px] flex flex-col justify-center text-center">
        <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Valentine • Minimal
        </div>
        <div className="mt-4 text-2xl font-semibold text-gray-900">{to}</div>
        <div className="mt-6 text-4xl leading-none">
          {data.message?.trim() ? data.message : "❤️"}
        </div>
        <div className="mt-8 text-sm text-gray-500">
          {!data.sendAnonymously && data.fromName?.trim()
            ? `— ${data.fromName.trim()}`
            : "— Secret admirer"}
        </div>
      </div>
    );
  },
};

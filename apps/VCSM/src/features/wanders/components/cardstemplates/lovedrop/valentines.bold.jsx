import React from "react";

export const valentinesBoldTemplate = {
  id: "valentines-bold",
  cardType: "valentines",
  hideTemplatePicker: false,

  defaultData: {
    toName: "",
    fromName: "",
    message: "YOU + ME = ❤️",
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
            placeholder="Make it loud..."
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
    const to = data.toName?.trim() ? data.toName.trim() : "VALENTINE";
    return (
      <div className="rounded-2xl bg-black text-white p-6 shadow-sm min-h-[260px] flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-white/70 uppercase">
            Valentine • Bold
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight">{to}</h2>
          <div className="mt-5 rounded-xl bg-white/10 border border-white/10 p-4">
            <p className="whitespace-pre-wrap text-white text-lg font-semibold">
              {data.message || "TYPE SOMETHING BIG."}
            </p>
          </div>
        </div>

        <div className="mt-6 text-sm text-white/70">
          {!data.sendAnonymously && data.fromName?.trim()
            ? `— ${data.fromName.trim()}`
            : "— Secret admirer"}
        </div>
      </div>
    );
  },
};

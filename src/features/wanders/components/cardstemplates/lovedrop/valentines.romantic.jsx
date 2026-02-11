import React from "react";

export const valentinesRomanticTemplate = {
  id: "valentines-romantic",
  cardType: "valentines",
  hideTemplatePicker: false,

  defaultData: {
    toName: "",
    fromName: "",
    message: "Happy Valentine’s Day ❤️",
    sendAnonymously: false,
  },

  Form({ data, setData, ui }) {
    const label = ui?.labelBase || "block text-sm font-medium text-gray-800 mb-1.5";
    const input = ui?.inputBase || "w-full rounded-xl border bg-gray-100 px-3.5 py-2.5 text-[15px] leading-6 shadow-sm border-gray-300 text-gray-900 placeholder:text-gray-500 transition duration-150 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 focus:bg-gray-100";
    const textarea = ui?.textareaBase || `${input} resize-none`;

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
            placeholder="Write your Valentine’s message..."
            className={`${textarea} min-h-[120px]`}
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
    const title = data.toName?.trim()
      ? `To ${data.toName.trim()} 💘`
      : "Happy Valentine’s Day 💘";

    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm min-h-[260px] flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="mt-4 rounded-xl bg-gradient-to-b from-rose-50 to-white p-4 border border-rose-100">
            <p className="text-gray-800 whitespace-pre-wrap">
              {data.message || "Your Valentine’s message preview will appear here..."}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {!data.sendAnonymously && data.fromName?.trim() ? (
            <p className="text-sm text-gray-500">— {data.fromName.trim()}</p>
          ) : (
            <p className="text-sm text-gray-400">— Secret admirer</p>
          )}
        </div>
      </div>
    );
  },
};

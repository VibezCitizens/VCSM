// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\cardstemplates\generic.minimal.jsx
import React from "react";

export const genericMinimalTemplate = {
  id: "generic-minimal",
  cardType: "generic",
  hideTemplatePicker: true,

  defaultData: {
    fromName: "",
    message: "",
    sendAnonymously: false,
  },

  // Converts this template's form state into the payload shape your submit handler can send.
  // Mirrors the keys used by your existing backend flow (kind, toName, fromName, messageText, etc.).
  toPayload(data) {
    const fromName = data?.sendAnonymously ? "" : (data?.fromName || "");
    const messageText = data?.message || "";

    return {
      kind: "wanders",
      toName: "",
      fromName,
      messageText,
      templateKey: this.id,
      isAnonymous: !!data?.sendAnonymously,
      customization: {},
    };
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
        {/* From */}
        {!data.sendAnonymously ? (
          <div>
            <label className={label}>From</label>
            <input
              type="text"
              placeholder="Your name"
              className={input}
              value={data.fromName}
              onChange={(e) =>
                setData((prev) => ({ ...prev, fromName: e.target.value }))
              }
            />
          </div>
        ) : null}

        {/* Message */}
        <div>
          <label className={label}>Message</label>
          <textarea
            placeholder="Write your message..."
            className={textarea}
            value={data.message}
            onChange={(e) =>
              setData((prev) => ({ ...prev, message: e.target.value }))
            }
          />
        </div>

        {/* Anonymous toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.sendAnonymously}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                sendAnonymously: e.target.checked,
              }))
            }
          />
          <span className="text-sm text-gray-800">Send anonymously</span>
        </label>
      </div>
    );
  },

  Preview({ data }) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md min-h-[250px] flex flex-col justify-between">
        <p className="text-gray-800 whitespace-pre-wrap">
          {data.message || "Your message preview will appear here..."}
        </p>

        {!data.sendAnonymously && data.fromName?.trim() ? (
          <p className="text-sm text-gray-500 mt-6">— {data.fromName.trim()}</p>
        ) : (
          <p className="text-sm text-gray-400 mt-6">— Anonymous</p>
        )}
      </div>
    );
  },
};

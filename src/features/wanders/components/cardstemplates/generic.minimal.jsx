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

  Form({ data, setData }) {
    return (
      <div className="space-y-4">
        {/* From */}
        {!data.sendAnonymously && (
          <input
            type="text"
            placeholder="Your name"
            className="input input-bordered w-full"
            value={data.fromName}
            onChange={(e) => setData((prev) => ({ ...prev, fromName: e.target.value }))}
          />
        )}

        {/* Message */}
        <textarea
          placeholder="Write your message..."
          className="textarea textarea-bordered w-full min-h-[120px]"
          value={data.message}
          onChange={(e) => setData((prev) => ({ ...prev, message: e.target.value }))}
        />

        {/* Anonymous toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.sendAnonymously}
            onChange={(e) => setData((prev) => ({ ...prev, sendAnonymously: e.target.checked }))}
          />
          <span>Send anonymously</span>
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

        {!data.sendAnonymously && data.fromName && (
          <p className="text-sm text-gray-500 mt-6">— {data.fromName}</p>
        )}
      </div>
    );
  },
};

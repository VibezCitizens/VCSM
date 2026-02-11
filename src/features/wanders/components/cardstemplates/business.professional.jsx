// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\cardstemplates\business.professional.jsx
import React from "react";

export const businessProfessionalTemplate = {
  id: "business-professional",
  cardType: "business",
  hideTemplatePicker: true,

  defaultData: {
    toName: "",
    fromName: "",
    company: "",
    message: "Thank you for your time — looking forward to staying in touch.",
    sendAnonymously: false,
  },

  // Convert template form state into backend payload shape
  toPayload(data) {
    const fromName = data?.sendAnonymously ? "" : (data?.fromName || "");
    const messageText = data?.message || "";

    return {
      kind: "business",
      toName: data?.toName || "",
      fromName,
      messageText,
      templateKey: this.id,
      isAnonymous: !!data?.sendAnonymously,
      customization: {
        company: data?.company || "",
      },
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
        {/* To */}
        <div>
          <label className={label}>To</label>
          <input
            type="text"
            placeholder="Recipient name"
            className={input}
            value={data.toName}
            onChange={(e) =>
              setData((prev) => ({ ...prev, toName: e.target.value }))
            }
          />
        </div>

        {/* From + Company */}
        {!data.sendAnonymously ? (
          <>
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

            <div>
              <label className={label}>Company</label>
              <input
                type="text"
                placeholder="Company (optional)"
                className={input}
                value={data.company}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, company: e.target.value }))
                }
              />
            </div>
          </>
        ) : null}

        {/* Message */}
        <div>
          <label className={label}>Message</label>
          <textarea
            placeholder="Write your note..."
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
    const title = data?.toName?.trim()
      ? `To ${data.toName.trim()}`
      : "Business Note";

    return (
      <div className="bg-white rounded-xl p-6 shadow-md min-h-[250px] flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-gray-800 whitespace-pre-wrap">
              {data.message || "Your business note preview will appear here..."}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {!data.sendAnonymously &&
          (data.fromName?.trim() || data.company?.trim()) ? (
            <p className="text-sm text-gray-500">
              — {data.fromName?.trim() || "Anonymous"}
              {data.company?.trim() ? `, ${data.company.trim()}` : ""}
            </p>
          ) : (
            <p className="text-sm text-gray-400">— Anonymous</p>
          )}
        </div>
      </div>
    );
  },
};

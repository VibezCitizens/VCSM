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

  Form({ data, setData }) {
    return (
      <div className="space-y-4">
        {/* To */}
        <div className="space-y-1">
          <label className="text-sm opacity-70">To</label>
          <input
            type="text"
            placeholder="Recipient name"
            className="input input-bordered w-full"
            value={data.toName}
            onChange={(e) =>
              setData((prev) => ({ ...prev, toName: e.target.value }))
            }
          />
        </div>

        {/* From + Company */}
        {!data.sendAnonymously && (
          <>
            <div className="space-y-1">
              <label className="text-sm opacity-70">From</label>
              <input
                type="text"
                placeholder="Your name"
                className="input input-bordered w-full"
                value={data.fromName}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, fromName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm opacity-70">Company</label>
              <input
                type="text"
                placeholder="Company (optional)"
                className="input input-bordered w-full"
                value={data.company}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, company: e.target.value }))
                }
              />
            </div>
          </>
        )}

        {/* Message */}
        <div className="space-y-1">
          <label className="text-sm opacity-70">Message</label>
          <textarea
            placeholder="Write your note..."
            className="textarea textarea-bordered w-full min-h-[120px]"
            value={data.message}
            onChange={(e) =>
              setData((prev) => ({ ...prev, message: e.target.value }))
            }
          />
        </div>

        {/* Anonymous toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
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
          <span>Send anonymously</span>
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
            (data.fromName?.trim() || data.company?.trim()) && (
              <p className="text-sm text-gray-500">
                — {data.fromName?.trim() || "Anonymous"}
                {data.company?.trim() ? `, ${data.company.trim()}` : ""}
              </p>
            )}

          {data.sendAnonymously && (
            <p className="text-sm text-gray-400">— Anonymous</p>
          )}
        </div>
      </div>
    );
  },
};

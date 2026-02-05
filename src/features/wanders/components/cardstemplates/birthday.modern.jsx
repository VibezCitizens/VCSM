// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\cardstemplates\birthday.modern.jsx
import React from "react";

export const birthdayModernTemplate = {
  id: "birthday-modern",
  cardType: "birthday",
  hideTemplatePicker: false,

  defaultData: {
    toName: "",
    fromName: "",
    message: "Wishing you the happiest birthday! 🎉",
    accent: "confetti", // confetti | balloons | cake
    sendAnonymously: false,
  },

  // Convert template form state into backend payload shape
  toPayload(data) {
    const fromName = data?.sendAnonymously ? "" : (data?.fromName || "");
    const messageText = data?.message || "";

    return {
      kind: "birthday",
      toName: data?.toName || "",
      fromName,
      messageText,
      templateKey: this.id,
      isAnonymous: !!data?.sendAnonymously,
      customization: {
        accent: data?.accent || "confetti",
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

        {/* From */}
        {!data.sendAnonymously && (
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
        )}

        {/* Accent */}
        <div className="space-y-1">
          <label className="text-sm opacity-70">Style</label>
          <select
            className="select select-bordered w-full"
            value={data.accent}
            onChange={(e) =>
              setData((prev) => ({ ...prev, accent: e.target.value }))
            }
          >
            <option value="confetti">Confetti</option>
            <option value="balloons">Balloons</option>
            <option value="cake">Cake</option>
          </select>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label className="text-sm opacity-70">Message</label>
          <textarea
            placeholder="Write your birthday message..."
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
    const headerIcon =
      data?.accent === "balloons"
        ? "🎈"
        : data?.accent === "cake"
        ? "🎂"
        : "🎉";

    const title = data?.toName?.trim()
      ? `Happy Birthday, ${data.toName.trim()}!`
      : "Happy Birthday!";

    return (
      <div className="bg-white rounded-xl p-6 shadow-md min-h-[250px] flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <span className="text-2xl">{headerIcon}</span>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-gray-800 whitespace-pre-wrap">
              {data.message || "Your birthday message preview will appear here..."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6">
          {!data.sendAnonymously && data.fromName?.trim() && (
            <p className="text-sm text-gray-500">— {data.fromName.trim()}</p>
          )}

          {data.sendAnonymously && (
            <p className="text-sm text-gray-400">— Someone who cares</p>
          )}
        </div>
      </div>
    );
  },
};

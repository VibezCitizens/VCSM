// src/features/cards/model/cardPayload.js
export function buildCardPayload(draft) {
  const messageText =
    (draft?.messageText ?? draft?.message ?? "").trim() || null;

  return {
    kind: String(draft.kind || "wanders"), // "wanders" | "business" | "valentine" | "birthday" | ...
    templateKey: String(draft.templateKey || "classic"),
    isAnonymous: !!draft.isAnonymous,
    message: {
      toName: (draft.toName || "").trim() || null,
      fromName: (draft.fromName || "").trim() || null,
      messageText,
      // optional future fields:
      // subject, title, etc.
    },
    customization: {
      ...(draft.customization || {}),
      // optional: colors/fonts/layout options
    },
    assets: {
      // optional future: photos, stickers, audio, etc.
      // photos: [{ url, path, width, height }]
    },
  };
}

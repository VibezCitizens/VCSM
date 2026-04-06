// src/features/wanders/core/hooks/mailboxExperience/mailboxExperience.helpers.js
// ============================================================================
// MAILBOX EXPERIENCE — PURE HELPERS
// No React. No Supabase. No controllers.
// ============================================================================

export function resolveInitialFolder(mode) {
  const m = String(mode || "").trim().toLowerCase();
  if (m === "sent" || m === "outbox") return "outbox";
  return "inbox";
}

export function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  let s = value.trim();
  if (!s) return null;

  for (let i = 0; i < 2; i++) {
    try {
      const parsed = JSON.parse(s);

      if (parsed && typeof parsed === "object") return parsed;

      if (typeof parsed === "string") {
        s = parsed.trim();
        if (!s) return null;
        continue;
      }

      return null;
    } catch {
      return null;
    }
  }

  return null;
}

export function normalizeList(items) {
  if (Array.isArray(items)) return items;
  if (Array.isArray(items?.data)) return items.data;
  if (Array.isArray(items?.items)) return items.items;
  return [];
}

export function filterMailboxItems(items, search) {
  const q = (search || "").trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const card = item?.card ?? {};
    const msg = String(card?.messageText ?? card?.message_text ?? "").toLowerCase();

    const customizationRaw =
      card?.customization ??
      card?.customization_json ??
      card?.customizationJson ??
      null;

    const customization = safeParseJson(customizationRaw) ?? customizationRaw ?? {};

    const fromName = String(customization?.fromName ?? customization?.from_name ?? "").toLowerCase();
    const toName = String(customization?.toName ?? customization?.to_name ?? "").toLowerCase();
    const templateKey = String(card?.templateKey ?? card?.template_key ?? "").toLowerCase();

    return msg.includes(q) || fromName.includes(q) || toName.includes(q) || templateKey.includes(q);
  });
}

export function buildSelectedCardForDetail(selectedItem) {
  if (!selectedItem) return null;

  const rawCard = selectedItem?.card ?? null;
  if (!rawCard) return null;

  const customizationRaw =
    rawCard?.customization ??
    rawCard?.customization_json ??
    rawCard?.customizationJson ??
    null;

  const customizationParsed = safeParseJson(customizationRaw) ?? customizationRaw ?? {};
  const customization =
    customizationParsed && typeof customizationParsed === "object" ? customizationParsed : {};

  const templateKey = rawCard?.templateKey ?? rawCard?.template_key ?? "";

  if (String(templateKey).startsWith("photo.")) {
    const imageUrl =
      customization?.imageUrl ??
      customization?.image_url ??
      rawCard?.imageUrl ??
      rawCard?.image_url ??
      "";

    const title = customization?.title ?? "";
    const message =
      customization?.message ??
      rawCard?.message ??
      rawCard?.messageText ??
      rawCard?.message_text ??
      "";

    const mergedCustomization = {
      ...customization,
      imageUrl: imageUrl || null,
      image_url: imageUrl || null,
    };

    return {
      ...rawCard,
      templateKey,
      template_key: templateKey,
      customization: mergedCustomization,
      title,
      message,
      messageText: rawCard?.messageText ?? rawCard?.message_text ?? message,
    };
  }

  return {
    ...rawCard,
    templateKey,
    template_key: templateKey,
    customization,
  };
}

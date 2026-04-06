export function isValidHttpUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateAdDraft(draft) {
  const errors = {};

  if (!String(draft?.title || "").trim()) {
    errors.title = "Title is required.";
  }

  if (draft?.destinationUrl && !isValidHttpUrl(draft.destinationUrl)) {
    errors.destinationUrl = "Destination URL must start with https:// or http://";
  }

  if (draft?.mediaUrl && !isValidHttpUrl(draft.mediaUrl)) {
    errors.mediaUrl = "Media URL must start with https:// or http://";
  }

  if (Number(draft?.budget || 0) < 0) {
    errors.budget = "Budget cannot be negative.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

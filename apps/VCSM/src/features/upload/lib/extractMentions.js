// src/features/upload/lib/extractMentions.js
// Extract @mentions from text, returns unique lowercase handles (without @).
// Keeps it UI-only and deterministic.
export function extractMentions(text = "") {
  const matches = text.match(/@([a-zA-Z0-9_.-]{1,32})/g) || [];
  const handles = matches.map((m) => m.slice(1).toLowerCase());
  return [...new Set(handles)];
}

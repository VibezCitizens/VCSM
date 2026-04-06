// src/features/wanders/core/hooks/mailboxExperience/mailboxExperience.selection.js
// ============================================================================
// MAILBOX EXPERIENCE — SELECTION HELPERS (PURE)
// ============================================================================

export function selectFirstIdIfMissing(selectedId, items) {
  if (selectedId) return selectedId;
  if (!items?.length) return null;
  return String(items[0].id);
}

export function reconcileSelection(selectedId, items) {
  if (!selectedId) return selectFirstIdIfMissing(null, items);
  const stillExists = items.some((it) => String(it.id) === String(selectedId));
  if (stillExists) return selectedId;
  return selectFirstIdIfMissing(null, items);
}

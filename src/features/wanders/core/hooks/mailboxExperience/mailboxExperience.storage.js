// src/features/wanders/core/hooks/mailboxExperience/mailboxExperience.storage.js
// ============================================================================
// MAILBOX EXPERIENCE — STORAGE (SAFE)
// Pure wrappers around browser storage access.
// ============================================================================

export function safeLocalStorageGet(key) {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

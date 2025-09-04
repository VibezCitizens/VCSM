// src/features/chat/utils/ensureVportManager.js
// Manager system removed. Keep this shim so existing imports don't break.
// Always returns true to allow starting VPORT conversations without manager checks.

export async function ensureVportManager(_vportId) {
  if (import.meta?.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[ensureVportManager] manager checks disabled (shim returns true)');
  }
  return true;
}

export default ensureVportManager;

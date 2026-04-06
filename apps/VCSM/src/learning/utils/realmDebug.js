function readStorageFlag(key) {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function normalizeError(error) {
  if (!error) return null;

  return {
    name: error.name ?? null,
    message: error.message ?? null,
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    status: error.status ?? null,
  };
}

function sanitize(payload) {
  if (payload instanceof Error) {
    return normalizeError(payload);
  }

  if (!payload || typeof payload !== "object") {
    return payload ?? null;
  }

  const normalized = { ...payload };

  if ("error" in normalized) {
    normalized.error = normalizeError(normalized.error);
  }

  return normalized;
}

export function isRealmDebugEnabled() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_LEARNING_DEBUG_REALMS === "1") {
    return true;
  }

  return readStorageFlag("learning:debug:realms") === "1";
}

export function shouldBreakOnRealmDebug() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_LEARNING_DEBUG_REALMS_BREAK === "1") {
    return true;
  }

  return readStorageFlag("learning:debug:realms:break") === "1";
}

export function logRealmDebug(scope, event, payload = null) {
  if (!isRealmDebugEnabled()) {
    return;
  }

  console.debug(`[learning:realm] ${scope} ${event}`, sanitize(payload));

  if (shouldBreakOnRealmDebug()) {
    debugger;
  }
}

export default logRealmDebug;

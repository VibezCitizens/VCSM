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

export function normalizeError(error) {
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

export function sanitize(payload, seen = new WeakSet()) {
  if (payload instanceof Error) {
    return normalizeError(payload);
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitize(item, seen));
  }

  if (!payload || typeof payload !== "object") {
    return payload ?? null;
  }

  if (seen.has(payload)) {
    return "[Circular]";
  }

  seen.add(payload);

  const normalized = {};

  for (const [key, value] of Object.entries(payload)) {
    normalized[key] = sanitize(value, seen);
  }

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

export function isLearningErrorDebugEnabled() {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    return true;
  }

  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_LEARNING_DEBUG_ERRORS === "1") {
    return true;
  }

  return readStorageFlag("learning:debug:errors") === "1";
}

export function normalizeLearningError(error, fallback = {}) {
  const base =
    error && typeof error === "object"
      ? sanitize(error)
      : {};

  const trace = Array.isArray(base.trace)
    ? base.trace.map((entry) => sanitize(entry))
    : [];

  const relatedErrors = Array.isArray(base.relatedErrors)
    ? base.relatedErrors.map((entry) => normalizeLearningError(entry))
    : [];

  return {
    name: base.name ?? fallback.name ?? "LearningError",
    message:
      base.message ??
      fallback.message ??
      "An unexpected learning error occurred",
    code: base.code ?? fallback.code ?? null,
    details: base.details ?? fallback.details ?? null,
    hint: base.hint ?? fallback.hint ?? null,
    status: base.status ?? fallback.status ?? null,
    context: base.context ?? sanitize(fallback.context ?? null),
    trace,
    relatedErrors,
  };
}

export function createLearningTrace(scope, context = {}) {
  return sanitize({
    scope,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export function withLearningErrorContext(
  error,
  {
    scope,
    message = null,
    code = null,
    status = null,
    context = null,
  } = {},
) {
  const normalized = normalizeLearningError(error, {
    message,
    code,
    status,
    context,
  });

  return {
    ...normalized,
    message: normalized.message ?? message ?? "An unexpected learning error occurred",
    code: normalized.code ?? code ?? null,
    status: normalized.status ?? status ?? null,
    context: normalized.context ?? sanitize(context),
    trace: scope
      ? [...normalized.trace, createLearningTrace(scope, context ?? {})]
      : normalized.trace,
  };
}

export function createLearningError({
  name = "LearningError",
  message = "An unexpected learning error occurred",
  code = null,
  details = null,
  hint = null,
  status = null,
  context = null,
  trace = [],
  relatedErrors = [],
} = {}) {
  return {
    name,
    message,
    code,
    details,
    hint,
    status,
    context: sanitize(context),
    trace: Array.isArray(trace) ? trace.map((entry) => sanitize(entry)) : [],
    relatedErrors: Array.isArray(relatedErrors)
      ? relatedErrors.map((entry) => normalizeLearningError(entry))
      : [],
  };
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

function coerceText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

const DIAG_SEED_MISSING_CODE = "DIAG_SEED_MISSING";

export function isPermissionDenied(error) {
  const code = coerceText(error?.code);
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return code === "42501" || message.includes("permission denied");
}

export function isRlsDenied(error) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return isPermissionDenied(error) || message.includes("row-level security");
}

export function isMissingRpc(error) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return (
    message.includes("could not find the function") ||
    message.includes("function") && message.includes("does not exist") ||
    message.includes("rpc") && message.includes("not found")
  );
}

export function isMissingRelation(error) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
}

export function isMissingColumn(error) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return message.includes("column") && message.includes("does not exist");
}

export function isForeignKeyViolation(error) {
  const code = coerceText(error?.code);
  const message = `${error?.message ?? ""}`.toLowerCase();
  return code === "23503" || message.includes("foreign key");
}

export function isUniqueViolation(error) {
  const code = coerceText(error?.code);
  const message = `${error?.message ?? ""}`.toLowerCase();
  return code === "23505" || message.includes("duplicate key") || message.includes("unique");
}

export function createSeedMissingError(message, context = null) {
  const error = new Error(message);
  error.code = DIAG_SEED_MISSING_CODE;
  error.isSeedMissing = true;
  error.context = context ?? null;
  return error;
}

export function isSeedMissingError(error) {
  const code = coerceText(error?.code);
  if (error?.isSeedMissing === true) return true;
  return code === DIAG_SEED_MISSING_CODE;
}

export function toDiagnosticsError(error) {
  if (!error) return null;

  const normalized = {
    name: coerceText(error?.name) ?? "Error",
    message: coerceText(error?.message) ?? "Unknown error",
    code: coerceText(error?.code),
    details: coerceText(error?.details),
    hint: coerceText(error?.hint),
    status: coerceText(error?.status),
    isPermissionDenied: isPermissionDenied(error),
    isRlsDenied: isRlsDenied(error),
    isMissingRpc: isMissingRpc(error),
    isMissingRelation: isMissingRelation(error),
    isMissingColumn: isMissingColumn(error),
    isForeignKeyViolation: isForeignKeyViolation(error),
    isUniqueViolation: isUniqueViolation(error),
    isSeedMissing: isSeedMissingError(error),
  };

  if (error?.context) {
    normalized.context = error.context;
  }

  if (error?.stack) {
    normalized.stack = String(error.stack)
      .split("\n")
      .slice(0, 8)
      .join("\n");
  }

  return normalized;
}

export function unwrapSupabase(result, fallbackLabel = "Supabase operation failed") {
  if (!result || typeof result !== "object") {
    throw new Error(`${fallbackLabel}: empty result`);
  }

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

export async function trySupabase(label, fn) {
  try {
    const value = await fn();
    return {
      ok: true,
      skipped: false,
      label,
      value,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      label,
      value: null,
      error: toDiagnosticsError(error),
    };
  }
}

export function makeSkipped(message, extra = null) {
  return {
    skipped: true,
    data: extra ? { reason: message, ...extra } : { reason: message },
  };
}

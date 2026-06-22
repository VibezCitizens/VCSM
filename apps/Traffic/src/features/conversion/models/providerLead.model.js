const DEFAULT_MESSAGE = "Hi, I'm interested in your services.";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value) {
  return UUID_RE.test(String(value ?? "").trim());
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = toText(value);
    if (text) return text;
  }
  return "";
}

export function createProviderLeadInitialValues() {
  return {
    name: "",
    phone: "",
    email: "",
    message: DEFAULT_MESSAGE
  };
}

export function formatProviderLeadPhoneInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function mapProviderLeadUserToPrefill(user) {
  const actorId = pickFirstText(
    user?.user_metadata?.actor_id,
    user?.user_metadata?.actorId,
    user?.app_metadata?.actor_id,
    user?.app_metadata?.actorId,
    user?.app_metadata?.claims?.actor_id,
    user?.app_metadata?.claims?.actorId
  );

  return {
    actorId: isUuid(actorId) ? actorId : null,
    name: pickFirstText(
      user?.user_metadata?.name,
      user?.user_metadata?.full_name,
      user?.user_metadata?.display_name
    ),
    email: pickFirstText(user?.email, user?.user_metadata?.email)
  };
}

export function normalizeProviderLeadDraft(input = {}) {
  return {
    providerSlug: toText(input.providerSlug).toLowerCase(),
    actorId: isUuid(input.actorId) ? input.actorId : null,
    name: toText(input.name),
    phone: toText(input.phone) || null,
    email: toText(input.email) || null,
    message: toText(input.message),
    userAgent: toText(input.userAgent) || null,
    providerName: toText(input.providerName),
    profileHref: toText(input.profileHref)
  };
}

export function validateProviderLeadDraft(draft) {
  const fieldErrors = {};

  if (!draft.name) {
    fieldErrors.name = "Name is required.";
  }

  if (!draft.message) {
    fieldErrors.message = "Message is required.";
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors
  };
}

export function isCardUnavailableError(error) {
  return String(error?.message ?? "").includes("CARD_UNAVAILABLE");
}

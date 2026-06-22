export function validateModerationRequest(request) {
  const expectedToken = process.env.TRAZE_ANSWERS_MODERATION_TOKEN;
  if (!expectedToken) {
    return {
      ok: false,
      status: 503,
      error: "Answers moderation is not configured."
    };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const providedToken = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!providedToken || providedToken !== expectedToken) {
    return {
      ok: false,
      status: 401,
      error: "Answers moderation token is invalid."
    };
  }

  return { ok: true };
}

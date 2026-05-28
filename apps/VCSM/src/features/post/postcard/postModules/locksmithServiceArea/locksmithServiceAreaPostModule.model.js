export function parseLocksmithServiceAreaPostModule(text, payload = null) {
  const rawText = text ?? "";
  const actorName =
    rawText.split("\n")[0].replace(/^.+?\bat\s+/i, "").trim() || null;

  if (payload !== null && ("label" in payload || "city" in payload)) {
    const locationText =
      payload.label ||
      [payload.city, payload.stateCode].filter(Boolean).join(", ") ||
      null;
    return {
      actorName,
      locationText,
      isEmergencyCovered: payload.isEmergencyCovered === true,
    };
  }

  const lines = rawText.split("\n");
  const servingLine = lines.find((l) => /^Now serving:/i.test(l));
  const locationText = servingLine
    ? servingLine.replace(/^Now serving:\s*/i, "").trim()
    : null;
  const isEmergencyCovered = lines.some((l) => /emergency service available/i.test(l));

  return { actorName, locationText, isEmergencyCovered };
}

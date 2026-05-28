export function parseBarbershopPortfolioPostModule(text, payload = null) {
  const rawText = text ?? "";
  const actorName =
    rawText.replace(/^New portfolio work added by\s*/i, "").split("\n")[0].trim() || null;

  if (payload !== null && "portfolioTitle" in payload) {
    return {
      actorName,
      portfolioTitle: payload.portfolioTitle ?? null,
      vportKind: payload.vportKind ?? null,
    };
  }

  const portfolioTitle = rawText.split("\n\n").slice(1).join("\n\n").trim() || null;
  return { actorName, portfolioTitle, vportKind: null };
}

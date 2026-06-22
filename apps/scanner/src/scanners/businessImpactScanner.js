export function scanBusinessImpact(maps) {
  const findingByBehavior = groupBy(maps.findingMap.findings, "behaviorId");
  const policyByBehavior = groupBy(maps.policyMap.policies, "behaviorId");
  const businessImpact = maps.behaviorSurfaceMap.behaviorSurfaces.map((surface) => {
    const text = JSON.stringify(surface).toLowerCase();
    const categories = [];
    if (/email|message|conversation|chat|notification/.test(text)) categories.push("communication/email");
    if (/booking|schedule|calendar|availability|slot/.test(text)) categories.push("booking/scheduling");
    if (/owner|actor_owners|calleractor|ownership/.test(text)) categories.push("ownership");
    if (/public|anonymous|edge|rpc/.test(text)) categories.push("public surface");
    if (/lead|profile|phone|email|customer|conversation|message/.test(text)) categories.push("PII");
    if (/price|payment|revenue|booking|service/.test(text)) categories.push("money/revenue");
    if (/moderation|block|report|review|trust/.test(text)) categories.push("moderation/trust");
    categories.push("native migration sensitivity");

    const findings = findingByBehavior.get(surface.behaviorId) ?? [];
    const policies = policyByBehavior.get(surface.behaviorId) ?? [];
    const businessImpactLevel = classifyImpact(categories, findings, policies);
    return {
      behaviorId: surface.behaviorId,
      feature: surface.feature,
      module: surface.module,
      categories: [...new Set(categories)],
      businessImpact: businessImpactLevel,
      evidence: [`categories: ${[...new Set(categories)].join(", ")}`]
    };
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    businessImpact
  };
}

function classifyImpact(categories, findings, policies) {
  if (findings.some((finding) => finding.severity === "CRITICAL") || categories.includes("PII") && categories.includes("public surface")) return "CRITICAL";
  if (findings.some((finding) => finding.severity === "HIGH") || categories.includes("money/revenue") || categories.includes("ownership")) return "HIGH";
  if (policies.length || categories.length >= 2) return "MEDIUM";
  return "LOW";
}

function groupBy(items, key) {
  const grouped = new Map();
  for (const item of items ?? []) {
    const value = item[key];
    if (!value) continue;
    grouped.set(value, [...(grouped.get(value) ?? []), item]);
  }
  return grouped;
}

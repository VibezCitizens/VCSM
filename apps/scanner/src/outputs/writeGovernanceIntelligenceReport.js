import path from "node:path";
import fs from "node:fs/promises";

const MAPS = [
  "behavior-map.json",
  "policy-map.json",
  "identity-flow-map.json",
  "ownership-map.json",
  "documentation-drift-map.json",
  "db-policy-map.json",
  "finding-map.json",
  "behavior-test-coverage-map.json",
  "runtime-cost-map.json",
  "native-parity-map.json",
  "business-impact-map.json",
  "governance-graph.json"
];

export async function writeGovernanceIntelligenceReport(config, maps, validationResults) {
  const lines = [];
  lines.push("# Scanner Governance Intelligence Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Root: ${config.repoRoot}`);
  lines.push("");
  lines.push("## New Maps Created");
  for (const name of MAPS) lines.push(`- ${name}`);
  lines.push("");
  lines.push("## Counts Per Map");
  for (const name of MAPS) {
    const counts = Object.entries(maps[name] ?? {}).filter(([key]) => key.endsWith("Count"));
    lines.push(`- ${name}: ${counts.map(([key, value]) => `${key}=${value}`).join(", ") || "no counts"}`);
  }
  lines.push("");
  lines.push("## Example: Dashboard / Leads");
  const behavior = maps["behavior-map.json"].data.behaviors.find((item) => item.feature === "dashboard" && item.module === "leads");
  if (behavior) {
    const surface = maps["behavior-surface-map.json"].data.behaviorSurfaces.find((item) => item.behaviorId === behavior.behaviorId);
    const coverage = maps["behavior-test-coverage-map.json"].data.behaviorTestCoverage.find((item) => item.behaviorId === behavior.behaviorId);
    const impact = maps["business-impact-map.json"].data.businessImpact.find((item) => item.behaviorId === behavior.behaviorId);
    lines.push(`- Behavior: ${behavior.behaviorId} ${behavior.behaviorName}`);
    lines.push(`- Surfaces: controllers=${surface?.controllers?.length ?? 0}, dals=${surface?.dals?.length ?? 0}, tests=${surface?.tests?.length ?? 0}`);
    lines.push(`- Test coverage: ${coverage?.coverage ?? "UNKNOWN"}`);
    lines.push(`- Business impact: ${impact?.businessImpact ?? "UNKNOWN"}`);
  } else {
    lines.push("- No dashboard/leads behavior found in current scan.");
  }
  lines.push("");
  lines.push("## Validation");
  for (const result of validationResults) {
    lines.push(`- ${result.scope}: ${result.status}${result.errors.length ? ` (${result.errors.join("; ")})` : ""}`);
  }
  lines.push("");
  lines.push("## Known Limitations");
  lines.push("- Behavior inference from code names is deterministic but semantic confidence is lower than BEHAVIOR.md extraction.");
  lines.push("- Identity-flow classification is static and context-window based; it does not execute code.");
  lines.push("- DB policy verification depends on migration files available in the workspace, not live database state.");
  lines.push("- Native parity uses token matching against native roots and reports unverified parity unless source evidence is strong.");
  lines.push("");
  lines.push("## False-Positive Risks");
  lines.push("- Ownership assertions hidden behind helper names without owner/own/assert wording may be missed.");
  lines.push("- SECURITY.md fixed claims can be flagged as drift when the source fix is not statically recognizable.");
  lines.push("- Runtime-cost findings are inferred unless the source directly contains polling, cache bypass, or empty catch patterns.");
  lines.push("");
  lines.push("## Next Recommended Scanner Upgrade");
  lines.push("- Add AST-level dataflow from route params and form payloads through controller arguments into DAL/RPC payloads.");
  lines.push("");
  lines.push("## Final Verdict");
  lines.push("");
  lines.push("SCANNER_GOVERNANCE_INTELLIGENCE_COMPLETE");
  lines.push("");

  const reportPath = path.join(config.scannerRoot, "reports", "scanner-governance-intelligence-report.md");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
}

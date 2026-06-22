import { docsForBehavior, severityFromText, statusFromText } from "./governanceUtils.js";

const FINDING_ID = /\b([A-Z]{2,12}-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d{1,4}|[A-Z]+-\d{4}-\d{2}-\d{2}-\d{3})\b/g;

export function scanFindings(docs, maps) {
  const findings = [];

  for (const doc of docs.filter((item) => item.document === "SECURITY.md" || item.file.includes("/outputs/"))) {
    for (const finding of extractFindingsFromDoc(doc)) {
      const behavior = nearestBehavior(doc, maps.behaviorMap.behaviors);
      findings.push({
        findingId: finding.findingId,
        feature: doc.feature,
        module: doc.module ?? doc.feature,
        behaviorId: behavior?.behaviorId ?? null,
        severity: finding.severity,
        status: normalizeStatus(finding.status),
        sourceCommand: sourceCommandFromFile(doc.file),
        sourceDocument: doc.file,
        evidence: finding.evidence,
        owner: finding.owner ?? null,
        requiredFollowUp: finding.requiredFollowUp ?? inferFollowUp(finding)
      });
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    findings: dedupeFindings(findings)
  };
}

function extractFindingsFromDoc(doc) {
  const findings = [];
  for (const line of doc.lines) {
    const ids = [...line.matchAll(FINDING_ID)].map((match) => match[1]);
    for (const id of ids) {
      findings.push({
        findingId: id,
        severity: severityFromText(line),
        status: statusFromText(line),
        evidence: [line.trim()],
        requiredFollowUp: /route|fix|follow|db|carnage|venom|test/i.test(line) ? line.trim() : null
      });
    }
  }
  return findings;
}

function nearestBehavior(doc, behaviors) {
  return behaviors.find((behavior) => behavior.feature === doc.feature && behavior.module === (doc.module ?? doc.feature))
    ?? behaviors.find((behavior) => behavior.feature === doc.feature)
    ?? null;
}

function sourceCommandFromFile(file) {
  const command = file.match(/\/(Venom|Elektra|Blackwidow|Kraven|Thor|Hawkeye|DB|ARCHITECT)\//i)?.[1];
  if (command) return command.toUpperCase();
  if (file.endsWith("SECURITY.md")) return "SECURITY_DOC";
  return "UNKNOWN";
}

function normalizeStatus(status) {
  if (status === "CLOSED") return "FIXED";
  return status;
}

function inferFollowUp(finding) {
  if (finding.status === "OPEN" || finding.status === "BLOCKED") return "review and assign owner";
  if (finding.status === "FIXED") return "verify source and tests";
  return "track governance decision";
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.findingId}:${finding.sourceDocument}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

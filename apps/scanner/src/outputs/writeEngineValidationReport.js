import fs from "node:fs/promises";
import path from "node:path";

export async function writeEngineValidationReport(config, validation) {
  const reportPath = path.join(config.scannerRoot, "reports", "engine-validation-report.md");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, renderReport(validation), "utf8");
}

function renderReport(validation) {
  return `# Engine Validation Report

Generated: ${new Date().toISOString()}

## Schema Results

| Scope | Status | Errors |
|---|---|---|
${validation.schemaResults.map((entry) => `| ${entry.scope} | ${entry.status} | ${entry.errors.join("; ") || "None"} |`).join("\n")}

## Ownership Results

| Engine | Score | Status | Warnings |
|---|---:|---|---|
${validation.ownershipResults.map((entry) => `| ${entry.engine} | ${entry.score} | ${entry.status} | ${entry.warnings.join("; ") || "None"} |`).join("\n")}

## Security Results

| Engine | Risk | Writes | RPCs | Edge Functions | External APIs | Status |
|---|---|---:|---:|---:|---:|---|
${validation.securityResults.map((entry) => `| ${entry.engine} | ${entry.riskTier} | ${entry.writes} | ${entry.rpcs} | ${entry.edgeFunctions} | ${entry.externalApis} | ${entry.status} |`).join("\n")}

## Readiness Results

| Engine | Score | Ownership | Consumers | Tests | Security | Entrypoints |
|---|---:|---:|---:|---:|---:|---:|
${validation.readinessResults.map((entry) => `| ${entry.engine} | ${entry.score} | ${entry.components.ownership} | ${entry.components.consumers} | ${entry.components.tests} | ${entry.components.security} | ${entry.components.entrypoints} |`).join("\n")}

## Command Readiness

| Command | Engine Maps Ready |
|---|---|
| ARCHITECT | Yes |
| VENOM | Yes |
| BLACKWIDOW | Yes |
| ELEKTRA | Yes |
| DR. STRANGE | Yes |
| THOR | Yes |
`;
}

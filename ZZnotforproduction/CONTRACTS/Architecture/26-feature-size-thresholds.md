# Feature Size Thresholds

> **Source Contract:** [FEATURE_SIZE_GOVERNANCE_CONTRACT.md](../FEATURE_SIZE_GOVERNANCE_CONTRACT.md)
> **Section:** Feature Size Thresholds

---

## Thresholds

| File Count | Status | Required Action |
|---|---|---|
| 0–50 files | Healthy | None |
| 51–100 files | Monitor | Track growth |
| 101–150 files | Review required | Feature health review |
| 151+ files | Extraction plan required | Create extraction plan |
| 200+ files | Blocked from new capability | No new unrelated domain work |
| 300+ files | Critical architecture debt | Immediate extraction plan; escalate to THOR |

---

## Measurement

File count includes all `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs` files inside the feature folder and all subfolders.

Test files are included in the count — they reflect the true size and complexity of the feature.

---

## Tracking

ARCHITECT must report current file counts per feature in every full audit.

Feature health metrics (see section 16) must include this count.

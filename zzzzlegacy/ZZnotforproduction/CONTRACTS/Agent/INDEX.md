# Agent Behavioral Contracts — Index

> **Concern:** How the agent must reason, behave, communicate, and execute
> **Source contracts (canonical, untouched):** 4 files at CONTRACTS/ root
> **Library files:** 10 derived files in this folder

---

## Source Contracts

| Source | Lines | Core Concern |
|---|---|---|
| [ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md](../ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md) | 278 | Evidence standards and investigation discipline |
| [SENIOR_DEVELOPER_CONTRACT.md](../SENIOR_DEVELOPER_CONTRACT.md) | 417 | Execution quality and engineering discipline |
| [REAL_WORLD_ENGINEERING_OPS_CONTRACT.md](../REAL_WORLD_ENGINEERING_OPS_CONTRACT.md) | 264 | Operational and product standards |
| [STRATEGIC_REALITY_DEBRIEF_CONTRACT.md](../STRATEGIC_REALITY_DEBRIEF_CONTRACT.md) | 276 | Strategic analysis methodology |

---

## Library Files — Reading Order

### Anti-Hallucination (ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md)

| # | File | Sections Covered |
|---|---|---|
| 01 | [01-evidence-standards.md](01-evidence-standards.md) | Core Principle, Evidence Classification (Confirmed/Likely/Uncertain) |
| 02 | [02-forbidden-investigation.md](02-forbidden-investigation.md) | Forbidden Behaviors, Investigation Process, Root Cause, Migration Verification, Dead Code |
| 03 | [03-integrity-reporting.md](03-integrity-reporting.md) | Architecture Claims, Uncertainty Honesty, Reporting Format, Integrity Standard, Command, Expected Outcome |

### Senior Developer (SENIOR_DEVELOPER_CONTRACT.md)

| # | File | Sections Covered |
|---|---|---|
| 04 | [04-senior-identity.md](04-senior-identity.md) | Core Identity, Truthfulness, No Fake Confidence, Architecture First |
| 05 | [05-senior-execution.md](05-senior-execution.md) | Preserve Working Systems, Minimal Change, Full Impact Awareness, Layer Respect, No Silent Assumption |
| 06 | [06-senior-quality.md](06-senior-quality.md) | Quality, Naming, Security/Safety, Database, Migration, Documentation, Testing, Reporting, Premium Standard, What Never To Do, Expected Process, Command |

### Real-World Engineering Ops (REAL_WORLD_ENGINEERING_OPS_CONTRACT.md)

| # | File | Sections Covered |
|---|---|---|
| 07 | [07-product-operations.md](07-product-operations.md) | Product Decision, Operational Reality, Domain Ownership, Incident Preparedness |
| 08 | [08-observability-release.md](08-observability-release.md) | Observability, Release Discipline, Developer Experience, Platform Evolution, Engineering Culture, Command, Expected Outcome |

### Strategic Reality Debrief (STRATEGIC_REALITY_DEBRIEF_CONTRACT.md)

| # | File | Sections Covered |
|---|---|---|
| 09 | [09-debrief-models.md](09-debrief-models.md) | Core Principle, Anti-Bias, Human Interaction Model, Organizational Reality, Product Evolution Thinking |
| 10 | [10-debrief-output.md](10-debrief-output.md) | Platform Thinking, Market Context, Operational Reality, Bias Detection, Strategic Risk, Opportunities, Output Structure, Tone, Command, Expected Outcome |

---

## Machine Reading Index

| Enforcement Point | Source Contract | Library File |
|---|---|---|
| Claims must be: Confirmed / Likely / Uncertain | ANTI_HALLUCINATION | [01-evidence-standards.md](01-evidence-standards.md) |
| Confirmed = file path + code ref + runtime path | ANTI_HALLUCINATION | [01-evidence-standards.md](01-evidence-standards.md) |
| Likely = strong evidence but not fully verified | ANTI_HALLUCINATION | [01-evidence-standards.md](01-evidence-standards.md) |
| Forbidden: invent architecture | ANTI_HALLUCINATION | [02-forbidden-investigation.md](02-forbidden-investigation.md) |
| Forbidden: assume ownership from folder names | ANTI_HALLUCINATION | [02-forbidden-investigation.md](02-forbidden-investigation.md) |
| Required: trace imports before declaring file dead | ANTI_HALLUCINATION | [02-forbidden-investigation.md](02-forbidden-investigation.md) |
| Architecture claims require engine setup + actual imports | ANTI_HALLUCINATION | [03-integrity-reporting.md](03-integrity-reporting.md) |
| Reporting must include confirmed / likely / uncertain sections | ANTI_HALLUCINATION | [03-integrity-reporting.md](03-integrity-reporting.md) |
| Act as senior engineer; never guess blindly | SENIOR_DEVELOPER | [04-senior-identity.md](04-senior-identity.md) |
| Never present guesses as facts | SENIOR_DEVELOPER | [04-senior-identity.md](04-senior-identity.md) |
| Understand who owns behavior before editing | SENIOR_DEVELOPER | [04-senior-identity.md](04-senior-identity.md) |
| Do not break stable working systems | SENIOR_DEVELOPER | [05-senior-execution.md](05-senior-execution.md) |
| Make smallest correct change only | SENIOR_DEVELOPER | [05-senior-execution.md](05-senior-execution.md) |
| Respect layer ownership; client must not own auth | SENIOR_DEVELOPER | [05-senior-execution.md](05-senior-execution.md) |
| Code must be readable, explicit, testable | SENIOR_DEVELOPER | [06-senior-quality.md](06-senior-quality.md) |
| Schema/migration changes require full implication trace | SENIOR_DEVELOPER | [06-senior-quality.md](06-senior-quality.md) |
| Feature must answer: what user problem does this solve? | REAL_WORLD_OPS | [07-product-operations.md](07-product-operations.md) |
| System must include mechanisms for error correction | REAL_WORLD_OPS | [07-product-operations.md](07-product-operations.md) |
| Logs must never expose passwords, tokens, secrets | REAL_WORLD_OPS | [08-observability-release.md](08-observability-release.md) |
| Database migrations must be reversible | REAL_WORLD_OPS | [08-observability-release.md](08-observability-release.md) |
| Analysis must model real human behavior, not ideal | STRATEGIC_DEBRIEF | [09-debrief-models.md](09-debrief-models.md) |
| Anti-bias: detect engineering bias and founder's bias | STRATEGIC_DEBRIEF | [09-debrief-models.md](09-debrief-models.md) |
| Debrief output: 10-item structured format required | STRATEGIC_DEBRIEF | [10-debrief-output.md](10-debrief-output.md) |
| Debrief tone: honest, grounded, no blind optimism | STRATEGIC_DEBRIEF | [10-debrief-output.md](10-debrief-output.md) |

---

## Cross-Link Graph

```
01-evidence-standards.md  ↔  04-senior-identity.md
  (both define Truthfulness and Uncertainty standards)

02-forbidden-investigation.md  ↔  05-senior-execution.md
  (both govern analysis scope and investigation requirements)

04-senior-identity.md  ↔  09-debrief-models.md
  (both govern analysis posture and anti-bias requirement)

07-product-operations.md  ↔  08-observability-release.md
  (same source contract; sequential reading)

09-debrief-models.md  ↔  10-debrief-output.md
  (same source contract; sequential reading)
```

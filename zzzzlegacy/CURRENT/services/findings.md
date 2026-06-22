# TriPoint — Findings Log

**Last updated:** 2026-05-28 — ELEKTRA DEFERRED; prior VENOM + BLACKWIDOW findings recorded

---

## ELEKTRA Status

**DEFERRED** — No Edge Function source code exists in the repository. ELEKTRA cannot trace source→sink chains on non-existent code. Scan will run once the TriPoint Edge Function is committed.

See: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_tripoint.md`

---

## Open Findings (VENOM + BLACKWIDOW — spec-level)

| ID | Severity | Source | Description | Status |
|---|---|---|---|---|
| BW-TRIPOINT-001 | HIGH BYPASSED | BW 2026-05-27 | Anon key extractable from browser bundle | OPEN — no implementation to patch |
| BW-TRIPOINT-002 | HIGH BYPASSED | BW 2026-05-27 | Actor UUID in public URL | OPEN — no implementation to patch |
| BW-TRIPOINT-003 | MEDIUM BYPASSED | BW 2026-05-27 | Reviews PII world-readable | OPEN |
| BW-TRIPOINT-004 | MEDIUM BYPASSED | BW 2026-05-27 | GPS + IP data world-readable | OPEN |
| BW-TRIPOINT-005 | MEDIUM BYPASSED | BW 2026-05-27 | CORS wildcard | OPEN |

---

## Pre-Audit Risk Notes

- External domain permanently caches VCSM actor data
- Any exposed raw ID becomes permanently public
- CORS misconfiguration would allow unauthorized cross-origin reads

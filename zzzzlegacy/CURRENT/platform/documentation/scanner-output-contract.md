# Scanner Output Contract

**Ticket:** TICKET-SCANNER-COMMAND-PREFLIGHT-0001
**Status:** ACTIVE
**Version:** 1.0
**Created:** 2026-06-02
**Category Key:** platform-documentation

---

## Purpose

Defines the mandatory output blocks that every command consuming scanner maps
must include in its governance report. These blocks create traceability between
scanner signals and command findings, enabling future scanner versions and other
commands to audit provenance.

---

## Two Required Blocks

Every command that consumed scanner maps must emit both blocks in its output:

1. `## Scanner Inputs` — documents which maps were loaded and their state
2. `## Scanner Signals` — documents which scanner signals were used to produce findings

---

## Block 1 — Scanner Inputs

```markdown
## Scanner Inputs

| Map | Path | Generated At | Age | Freshness State | Used |
|---|---|---|---|---|---|
| feature-map | apps/scanner/maps/feature-map.json | 2026-06-02T23:07:18Z | 4h | FRESH | YES |
| write-surface-map | apps/scanner/maps/write-surface-map.json | 2026-06-02T23:07:18Z | 4h | FRESH | YES |
| callgraph | apps/scanner/maps/callgraph.json | 2026-06-02T23:07:18Z | 4h | FRESH | YES |
| test-map | apps/scanner/maps/test-map.json | 2026-06-02T23:07:18Z | 4h | FRESH | NO — not needed for this scope |

Scanner Version: 1.1.0
Overall Preflight State: FRESH
Preflight Action: PASSED
```

### Field Definitions

| Field | Required | Description |
|---|---|---|
| Map | YES | Short map name matching command-preflight-matrix.md |
| Path | YES | Relative path from workspace root |
| Generated At | YES | ISO 8601 timestamp from map root `generatedAt` |
| Age | YES | Human-readable age at time of command run (e.g. 4h, 2d) |
| Freshness State | YES | FRESH / STALE / EXPIRED per scanner-freshness-contract.md |
| Used | YES | YES / NO — whether the map was actually queried for findings |

The Scanner Inputs block must list ALL maps the command is configured to require,
even if they were not used for a given run. "Used: NO" with a reason is valid.

---

## Block 2 — Scanner Signals

```markdown
## Scanner Signals

| Signal | Source Map | Map Entry Path | Confidence | Verified Against Source | Notes |
|---|---|---|---|---|---|
| Write surface: bookings INSERT at dal/createBooking.dal.js | write-surface-map | data.writeSurfaces[42] | HIGH | YES — file read at line 18 | Auth check absent |
| Route /dashboard/vport/:id — access: protected | route-map | data.routes[88] | HIGH | YES — route file read | Auth guard confirmed |
| RPC: create_booking at vc schema | rpc-map | data.rpcs[7] | HIGH | NO | Used as lead only |
| Security path: /vport/:id → createBooking → INSERT | security-path-map | data.securityPaths[201] | LOW | YES | Ownership check missing |
```

### Field Definitions

| Field | Required | Description |
|---|---|---|
| Signal | YES | Human-readable description of what the scanner found |
| Source Map | YES | Which map the signal came from |
| Map Entry Path | YES | Dot-notation path into the map JSON (e.g. `data.writeSurfaces[42]`) |
| Confidence | YES | The scanner's confidence for this entry (HIGH/MEDIUM/LOW/BLOCKED) |
| Verified Against Source | YES | YES (with file + line) / NO (scanner-only lead) |
| Notes | YES | What the verification revealed, or why source was not read |

### Verification Format

When `Verified Against Source: YES`, the Notes field must include:
```
YES — [file path] read at line [N]: [what was found]
```

Example:
```
YES — apps/VCSM/src/features/booking/dal/createBooking.dal.js read at line 18:
      No ownership check before INSERT
```

When `Verified Against Source: NO`:
```
NO — scanner lead only; requires human source inspection before emitting as finding
```

---

## Finding Provenance Tag

Every finding in a command's output must carry one provenance tag:

| Tag | Meaning | Allowed Severity |
|---|---|---|
| `[SOURCE_VERIFIED]` | Source file read; finding confirmed in actual code | Any severity |
| `[SCANNER_LEAD]` | Scanner signal used as lead; source not read | Up to HIGH (never CRITICAL) |
| `[SCANNER_LOW_CONF]` | Scanner confidence = LOW; source not read | Up to MEDIUM (never HIGH or CRITICAL) |
| `[SCANNER_STALE]` | Map was STALE when signal was extracted | Up to MEDIUM; CRITICAL requires FRESH |

### Severity Caps by Provenance

| Provenance Tag | MAX Allowed Severity |
|---|---|
| SOURCE_VERIFIED | CRITICAL |
| SCANNER_LEAD | HIGH |
| SCANNER_LOW_CONF | MEDIUM |
| SCANNER_STALE | MEDIUM |

A command that emits a CRITICAL finding without `[SOURCE_VERIFIED]` violates
the scanner trust contract. The finding is invalid and must be rejected by THOR.

---

## Full Example — VENOM Output Block

```markdown
## Scanner Inputs

| Map | Path | Generated At | Age | Freshness State | Used |
|---|---|---|---|---|---|
| write-surface-map | apps/scanner/maps/write-surface-map.json | 2026-06-02T23:07:18Z | 6h | FRESH | YES |
| security-path-map | apps/scanner/maps/security-path-map.json | 2026-06-02T23:07:18Z | 6h | FRESH | YES |
| rpc-map | apps/scanner/maps/rpc-map.json | 2026-06-02T23:07:18Z | 6h | FRESH | YES |
| edge-function-map | apps/scanner/maps/edge-function-map.json | 2026-06-02T23:07:18Z | 6h | FRESH | YES |
| route-map | apps/scanner/maps/route-map.json | 2026-06-02T23:07:18Z | 6h | FRESH | YES |
| write-execution-map | apps/scanner/maps/write-execution-map.json | 2026-06-02T23:07:18Z | 6h | FRESH | YES |
| rpc-execution-map | apps/scanner/maps/rpc-execution-map.json | 2026-06-02T23:07:18Z | 6h | FRESH | NO — no RPC scope in this run |
| edge-execution-map | apps/scanner/maps/edge-execution-map.json | 2026-06-02T23:07:18Z | 6h | FRESH | NO — edge functions out of scope |

Scanner Version: 1.1.0
Overall Preflight State: FRESH
Preflight Action: PASSED

## Scanner Signals

| Signal | Source Map | Map Entry Path | Confidence | Verified Against Source | Notes |
|---|---|---|---|---|---|
| Write surface: bookings INSERT at createBooking.dal.js | write-surface-map | data.writeSurfaces[88] | HIGH | YES — line 24 | No actor ownership check before INSERT — VEN-BOOK-001 |
| Security path: /dashboard/vport/:id → bookings INSERT — access: protected | security-path-map | data.securityPaths[201] | LOW | YES — createBooking.controller.js line 31 | Auth present but no vport ownership verification — VEN-BOOK-002 |
| RPC: create_booking at vc schema — caller: createBookingRpc | rpc-map | data.rpcs[12] | HIGH | NO | Lead only — requires DB RLS inspection |
```

---

## Minimal Block — SCANNER_ENHANCED Commands

For commands where scanner is enhancement (not required), a shorter block is acceptable:

```markdown
## Scanner Context

Scanner maps loaded: YES
Maps used: feature-map (FRESH, 6h old)
Preflight state: FRESH
Signal count: 3 feature existence signals — all HIGH confidence, no source verification needed
```

---

## Integration With THOR

THOR reads Scanner Inputs and Scanner Signals blocks from all specialist command
outputs during the release evaluation. THOR checks:

1. All required maps were FRESH (or STALE with documented warning) for each command
2. All CRITICAL findings carry `[SOURCE_VERIFIED]`
3. No HIGH findings carry `[SCANNER_LOW_CONF]`
4. Scanner version is consistent across all specialist outputs

If any of these checks fail, THOR adds a SCANNER_PROVENANCE_GAP to the Risk
Acceptance Register. For P0 features, a SCANNER_PROVENANCE_GAP is a release blocker.

---

*Generated: 2026-06-02 | Ticket: TICKET-SCANNER-COMMAND-PREFLIGHT-0001*

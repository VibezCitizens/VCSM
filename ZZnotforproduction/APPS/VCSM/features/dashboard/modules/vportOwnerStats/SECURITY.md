# Security Posture — vportOwnerStats

Last Updated: 2026-06-04
Highest Open Severity: NONE
THOR Release Blocker: NO

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

### Open Findings

| Finding | Severity | Status | Summary |
|---|---|---|---|
| VEN-VPORTOS-001 | MEDIUM | PATCHED | `listVportBookingsForProfileDayDAL` SELECT reduced to `"id"` only. Customer PII (`customer_name`, `customer_note`, `customer_actor_id`) no longer loaded on this path. |
| VEN-VPORTOS-002 | LOW | PATCHED | Lifecycle guard added in controller after profile resolution: `if (!profile.is_active \|\| profile.is_deleted) throw new Error("VPORT profile is not available.")` |

### Confirmed Safe

| Surface | Evidence |
|---|---|
| callerActorId required, sourced from authenticated session | VportProfileViewScreen:185 `callerActorId={viewerActorId}` — viewerActorId from identity hook |
| assertActorOwnsVportActorController — kind check before self-shortcut | assertActorOwnsVportActor.controller.js:28 — `kind === "user"` unconditional before line 34 |
| actor_owners DB lookup with is_void check | controller.js:43-49 — ownerLink && ownerLink.is_void !== true |
| target actor is_void check | controller.js:52-54 — targetActor.is_void !== true |
| No write surfaces, no RPCs, no edge functions | Scanner: 0 write surfaces; 0 RPCs; source confirmed |
| Cancelled/no-show bookings excluded | listVportBookingsForProfileDayDAL.js:14 `.not("status","in",'("cancelled","no_show")')` |
| Staff active filter at controller layer | controller.js:59-61 `m.is_active !== false && m.meta?.status === "linked"` |
| Zero-resource short-circuit | controller.js:50-57 — booking DALs skipped when resourceIds.length === 0 |

### Prior Patched Findings

| Finding | Severity | Status |
|---|---|---|
| VEN-DASH-001 | HIGH | PATCHED / SOURCE VERIFIED — callerActorId now required and session-derived |
| ELEK-003 | HIGH | PATCHED / SOURCE VERIFIED — source binding verified |
| BLOCK-DASH-005 | P0 | PATCHED / SOURCE VERIFIED — assertActorOwnsVportActorController fires before all reads |

### Follow-Up Required

- DAL: Change `listVportBookingsForProfileDayDAL` select to `"id"` only (VEN-VPORTOS-001)
- Controller: Add `if (!profile.is_active || profile.is_deleted) throw` after profile resolution (VEN-VPORTOS-002)
- SPIDER-MAN: Add regression test — controller returns only `{ todayCount, upcomingCount, activeBarbers }`, no raw booking data

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-04
ELEKTRA Status: COMPLETE

### Open Findings

| Finding | Severity | Status | Summary |
|---|---|---|---|
| ELEK-2026-06-04-001 | LOW | PATCHED | Lifecycle guard added in controller: `if (!profile.is_active \|\| profile.is_deleted) throw new Error("VPORT profile is not available.")` — source verified. |
| ELEK-2026-06-04-002 | INFO | PATCHED | `SELECT_COLS` reduced to `"id"` in `listVportBookingsForProfileDayDAL`. No customer PII loaded on this path. |

### False Positives Rejected (5)

- IDOR via callerActorId — session-derived, not user input — REJECTED
- IDOR via actorId route param — assertActorOwnsVportActorController fully blocks — REJECTED
- staff meta.status bypass — meta is DB-written JSON, not user-controlled — REJECTED
- resourceIds enumeration — profileId is server-resolved after ownership check — REJECTED
- Zero-resource short-circuit bypass — resourceIds are DB rows, not user-controlled — REJECTED

### Prior Patched Findings

| Finding | Severity | Status |
|---|---|---|
| ELEK-003 | HIGH | PATCHED / SOURCE VERIFIED — callerActorId bound to session; assertActorOwnsVportActorController fires before reads |

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

### Adversarial Results Summary

| Scenario | Result | Severity |
|---|---|---|
| Cross-actor ownership bypass (13 attack vectors) | BLOCKED — assertActorOwnsVportActorController holds across all vectors | N/A |
| VPORT-kind actor as requester | BLOCKED — kind check unconditional before self-shortcut (ELEK-004 patch confirmed) | N/A |
| Revoked requester / stale ownerLink / is_void target actor | BLOCKED — all is_void checks present | N/A |
| Null actorId / null callerActorId injection | BLOCKED — controller + hook dual guard | N/A |
| Cancelled/no-show booking count inflation | BLOCKED — DB-level filter in DAL | N/A |
| Write surface abuse | BLOCKED — 0 write surfaces confirmed by scanner + source | N/A |
| Profile lifecycle bypass (owner reads deleted VPORT) | PARTIAL — ownership holds; lifecycle guard absent | LOW |

### BLACKWIDOW Findings

| Finding | Severity | Status | Summary |
|---|---|---|---|
| BW-VPORTOS-001 | LOW | HARDENED | Lifecycle guard patched + TESTREQ-BW-vportOwnerStats-001 passing (2 tests: is_active: false + is_deleted: true). |

### §9 Invariant Coverage

All 10 §9 Must Never Happen invariants attacked and confirmed BLOCKED. No invariant was BYPASSED.

### THOR Impact

CLEAR — no BYPASSED findings. BW-VPORTOS-001 is LOW/PARTIAL, not a THOR blocker.

### New SPIDER-MAN Requirement

| TESTREQ | Validates | Status |
|---|---|---|
| TESTREQ-BW-vportOwnerStats-001 | Controller throws for is_active: false / is_deleted: true profile | MISSING |

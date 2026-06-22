# Security Posture — identity

Last Updated: 2026-06-05
Highest Open Severity: HIGH
THOR Release Blocker: YES — ELEK-2026-06-05-001, ELEK-2026-06-05-002, ELEK-2026-06-05-003, ELEK-2026-06-05-004
Cross-ref blockers (VENOM/BW): VEN-IDENTITY-002, VEN-IDENTITY-003, BW-IDENT-001, BW-IDENT-002, BW-IDENT-006, BW-IDENT-011

---

## VENOM STATUS
VENOM Last Run: 2026-06-05
VENOM Status: COMPLETE

7 findings: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW, 2 CLOSED

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| VEN-IDENTITY-001 | HIGH | CLOSED 2026-06-05 | BEHAVIOR.md authored by LOGAN 2026-06-05 — §5 constraints and §9 invariants now formally documented. THOR BLOCKER removed. |
| VEN-IDENTITY-002 | HIGH | OPEN — THOR BLOCKER | Self-heal path bypasses platform access gate — revoked users may re-provision via ensureVcsmPlatformBootstrap. No revoked-status check before bootstrap call. useIdentityResolutionEffect.hook.js:89-123. |
| VEN-IDENTITY-003 | HIGH | OPEN — THOR BLOCKER (UPGRADED from MEDIUM) | Null _engineMeta.userId silently skips cross-user commit guard. `if (identityUserId && ...)` passes when null. §9 INVARIANT-3 violation. useIdentityResolutionEffect.hook.js:152-153. |
| VEN-IDENTITY-004 | MEDIUM | OPEN | Engine 120s result cache is SPA-safe only — latent SSR cross-session leakage risk. |
| VEN-IDENTITY-005 | MEDIUM | CLOSED (VCSM SCOPE) | Wentrex resolver finding — not applicable to VCSM. vcsmIdentity.resolver.js always returns roleKeys:[]; no org membership queries exist in VCSM. |
| VEN-IDENTITY-006 | MEDIUM | OPEN — NEW | Sensitive PII (email, birthdate, age, sex, isAdult) included in mapProfileActor / identity model state. Accessible via useIdentityDetailsDeprecated() export. identity.model.js:47-49. |
| VEN-IDENTITY-007 | LOW | OPEN — NEW | refreshVcActorDirectory / refreshActorDirectoryRow accept arbitrary actorId with no ownership check at DAL, controller, or adapter layer. Defense deferred entirely to DB RPC. |

Output: ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/05/Venom/2026-06-05_10-00_venom_identity-security-review.md
Prior Output: ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_identity-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-05
ELEKTRA Status: COMPLETE

8 findings: 0 CRITICAL, 4 HIGH, 2 MEDIUM, 2 LOW
False Positives Rejected: 1
THOR Blockers: ELEK-2026-06-05-001, ELEK-2026-06-05-002, ELEK-2026-06-05-003, ELEK-2026-06-05-004
ELEKTRA Recommendation: FAIL

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-2026-06-05-001 | HIGH | OPEN — THOR BLOCKER | Self-heal path re-provisions revoked users — no access-status check before bootstrapIdentitySelfHeal. identitySelfHeal.controller.js:13-14. Confirms VEN-IDENTITY-002, BW-IDENT-006. Patch requires new readUserAppAccessStatusDAL + REVOKED_ACCOUNT_SENTINEL. |
| ELEK-2026-06-05-002 | HIGH | OPEN — THOR BLOCKER | Null _engineMeta.userId silently bypasses cross-user commit guard — `if (identityUserId && ...)` passes when null. useIdentityResolutionEffect.hook.js:152-153. Confirms VEN-IDENTITY-003, BW-IDENT-002(a). Patch: invert condition to `if (!identityUserId \|\| ...)`. |
| ELEK-2026-06-05-003 | HIGH | OPEN — THOR BLOCKER | Bootstrap controller accepts caller-supplied actorId without ownership check — null check only; no session binding; no vc.actor_owners verification. ensureVcsmPlatformBootstrap.controller.js:31-34 → provision.rpc.dal.js:33-38. Confirms BW-IDENT-001. Patch requires assertActorOwnedByUserDAL. |
| ELEK-2026-06-05-004 | HIGH | OPEN — THOR BLOCKER | commitIdentity has no cross-user check — switchActor path bypasses useIdentityResolutionEffect guard entirely; _engineMeta not attached by loadIdentityForActorId; hydration store poisoning chain confirmed. identityContext.jsx:40-61, 85-95. Confirms BW-IDENT-002(b), BW-IDENT-011. Patch: add cross-user guard in commitIdentity + attach _engineMeta.userId in switchActorController. |
| ELEK-2026-06-05-005 | MEDIUM | OPEN | Adapter exports raw controller functions — violates VCSM adapter boundary rule. identityOps.adapter.js:1-2. Confirms BW-IDENT-010. Patch: replace with useIdentityOps hook export only. |
| ELEK-2026-06-05-006 | MEDIUM | OPEN | PII (email, birthdate, age, sex, isAdult) in identity model state — accessible via useIdentityDetailsDeprecated(). identity.model.js:47-49, identityContext.jsx:183-185. Confirms VEN-IDENTITY-006. |
| ELEK-2026-06-05-007 | LOW | OPEN | readUserActorByProfileIdDAL missing is_deleted=false filter — may provision deleted actors before DELETED_ACCOUNT_SENTINEL triggers logout. identity.read.dal.js:157-169. Confirms BW-IDENT-012. |
| ELEK-2026-06-05-008 | LOW | OPEN | switchActorController TypeError at :44 before null guard — non-fatal; normal path protected by identityContext:69 guard. Confirms BW-IDENT-005. |

Output: ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/05/Elektra/2026-06-05_11-00_elektra_identity-precision-scan.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-05
BLACKWIDOW Status: COMPLETE

12 findings: 0 CRITICAL, 4 HIGH, 3 MEDIUM, 3 LOW, 2 CLOSED

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-IDENT-001 | HIGH | Bootstrap RPC ownership pre-check absent — ensureVcsmPlatformBootstrap accepts arbitrary actorId via useIdentityOps hook and identityOps.adapter; DB RPC is sole backstop (unverified) | PARTIAL | OPEN — THOR BLOCKER |
| BW-IDENT-002 | HIGH | Null _engineMeta.userId bypasses cross-user guard (null conditional); AND: switchActor path commits identity via commitIdentity() with NO cross-user check at all (structural gap) | BYPASSED [SOURCE_VERIFIED] | OPEN — THOR BLOCKER |
| BW-IDENT-003 | MEDIUM | Actor-kind gate selector-only — kind enforcement absent at identity controller; consuming feature (booking) controller responsible | PARTIAL | OPEN |
| BW-IDENT-004 | MEDIUM | refreshActorDirectoryRow accepts arbitrary actorId at all app layers — DB RPC sole backstop | PARTIAL | OPEN |
| BW-IDENT-005 | LOW | Null actorId TypeError at switchActorController:44 before guard — non-fatal; caller guard in identityContext protects normal path | PARTIAL (non-fatal) | OPEN |
| BW-IDENT-006 | HIGH | Revoked user self-heal replay — engine returns null → self-heal triggered → bootstrap called with no access status check; DELETED handled (sentinel), REVOKED has no equivalent sentinel | PARTIAL | OPEN — THOR BLOCKER |
| BW-IDENT-007 | LOW | refreshVcActorDirectory exposed via useIdentityOps with no ownership guard at any app layer — DB RPC sole backstop | PARTIAL | OPEN |
| BW-IDENT-008 | INFO | No raw UUID in public URL surfaces — toPublicIdentity actor-first only; getProfilePath returns /profile/self | BLOCKED | CLOSED |
| BW-IDENT-009 | HIGH | BEHAVIOR.md was PLACEHOLDER — now ACTIVE (authored 2026-06-05 by LOGAN); §9 invariants formally documented | N/A | CLOSED |
| BW-IDENT-010 | MEDIUM | Controller functions exported directly from identityOps.adapter.js — violates adapter boundary rule (adapters must not export controllers) | PARTIAL | OPEN — NEW |
| BW-IDENT-011 | HIGH | Hydration store poisoned when BW-IDENT-002 bypass succeeds — commitIdentity calls upsertActors with no cross-user guard; resolves with BW-IDENT-002 fix | PARTIAL (chained) | OPEN — NEW |
| BW-IDENT-012 | LOW | Self-heal calls provision_vcsm_identity for soft-deleted actors unnecessarily — readUserActorByProfileIdDAL missing is_deleted=false filter; final result correct (logout via DELETED_ACCOUNT_SENTINEL) | PARTIAL (non-security) | OPEN — NEW |

THOR Release Blockers: BW-IDENT-001, BW-IDENT-002, BW-IDENT-006, BW-IDENT-011 (chained from BW-IDENT-002)

Output: ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/05/BlackWidow/2026-06-05_10-30_blackwidow_identity-adversarial-review.md
Prior Output: ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_identity-adversarial-review.md

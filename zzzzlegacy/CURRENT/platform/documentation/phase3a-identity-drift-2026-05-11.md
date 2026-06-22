# Logan Phase 3a — Identity System Drift Report

**Date:** 2026-05-11
**Scope:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/identity/` — all 17 docs
**Method:** Read all 17 docs + read key engine and app code files
**Code Roots Inspected:**
- `engines/identity/src/controller/` (resolveAuthenticatedContext, switchActiveActor)
- `apps/VCSM/src/state/identity/` (identityContext, identity.controller, identityStorage)
- `apps/VCSM/src/features/auth/` (authCallback.controller, login.controller)
- `apps/VCSM/src/features/dashboard/vport/` (new files on current branch)

---

## Doc Inventory

| # | File | Last Updated | Status | Drift Severity |
|---|------|-------------|--------|----------------|
| 1 | vcsm.identity.auth-pipeline.md | April 25, 2026 | ALIGNED | — |
| 2 | vcsm.identity.email-flows.md | April 25, 2026 | ALIGNED | — |
| 3 | vcsm.identity.engine-architecture.md | April 9, 2026 | ALIGNED | — |
| 4 | vcsm.identity.actor-switch-pipeline.md | April 9, 2026 | MINOR DRIFT | LOW |
| 5 | vcsm.identity.actor-directory-projection.md | April 6, 2026 | NEEDS_VERIFICATION | — |
| 6 | vcsm.identity.actor-hydration-audit.md | May 2, 2026 | ALIGNED | — |
| 7 | vcsm.identity.citizen-to-vport-switch.md | April 9, 2026 | MINOR DRIFT | LOW |
| 8 | vcsm.identity.context-file-map.md | April 5, 2026 | ALIGNED | — |
| 9 | vcsm.identity.login-pipeline-trace.md | April 9, 2026 | ALIGNED | — |
| 10 | vcsm.identity.vport-creation-audit.md | April 5, 2026 | ALIGNED | — |
| 11 | vcsm.identity.account-settings-tab.md | May 2, 2026 | ALIGNED | — |
| 12 | vcsm.identity.citizen-soft-delete.md | May 2, 2026 | ALIGNED | — |
| 13 | vcsm.identity.vport-access-block.md | April 20, 2026 | ALIGNED | — |
| 14 | vcsm.identity.actor-hydration-pipeline-audit.md | April 4, 2026 | STALE | HIGH |
| 15 | vcsm.identity.context-forensic-review.md | April 1, 2026 | STALE | HIGH |
| 16 | vcsm.identity.migration-checklist.md | April 1, 2026 | STALE | MEDIUM |
| 17 | vcsm.identity.invite-pipeline.md | April 25, 2026 | NEEDS_VERIFICATION | LOW |

**Summary:** 10 ALIGNED · 2 MINOR DRIFT · 2 NEEDS_VERIFICATION · 3 STALE · 0 CRITICAL

---

## Drift Findings

---

### F-3a-01 — `invalidateIdentityResultCache()` missing from actor-switch-pipeline.md

**Finding ID:** F-3a-01
**Doc:** `vcsm/identity/vcsm.identity.actor-switch-pipeline.md`
**Code:** `engines/identity/src/controller/switchActiveActor.controller.js`
**Drift Status:** MINOR DRIFT
**Drift Severity:** LOW

**Current doc behavior (Step 3 in switch sequence):**
```
engineSwitchActiveActor({ userAppAccountId, actorLinkId })
  → UPDATE platform.user_app_preferences SET active_actor_link_id
  → emit EVENTS.ACTOR_SWITCHED
```

**Actual code behavior (switchActiveActor.controller.js lines 43-50):**
```js
await dalSetActiveActorLink({ userAppAccountId, actorLinkId })
invalidateIdentityResultCache()   // ← MISSING FROM DOC
const activeActor = ActorLinkModel(row)
emit(EVENTS.ACTOR_SWITCHED, { ... })
```

**Risk:** Doc readers don't know the 120s result cache is busted on switch. If someone adds a code path that depends on the cache persisting after switch, they'll misunderstand the system.

**Recommended fix:** Add `invalidateIdentityResultCache()` as step 3.5 in the engine preference write section. Note: "Busts the 120s result cache in resolveAuthenticatedContext so the next resolve re-reads platform state with the new active actor."

---

### F-3a-02 — Same gap in citizen-to-vport-switch.md

**Finding ID:** F-3a-02
**Doc:** `vcsm/identity/vcsm.identity.citizen-to-vport-switch.md`
**Code:** `engines/identity/src/controller/switchActiveActor.controller.js`
**Drift Status:** MINOR DRIFT
**Drift Severity:** LOW

**Current doc (Phase 3 — Engine Preference Write):**
Shows 4 validation checks → `dalSetActiveActorLink` UPSERT → `emit ACTOR_SWITCHED`.

**Actual code:** Same as F-3a-01 — `invalidateIdentityResultCache()` is called between the write and the emit.

**Recommended fix:** Add a line after the UPSERT SQL block in Phase 3: "Engine then calls `invalidateIdentityResultCache()` — busts the 120s result cache so the next `resolveAuthenticatedContext` call (e.g., the subsequent `loadIdentityForActorId`) re-reads from DB with the updated preference."

---

### F-3a-03 — actor-hydration-pipeline-audit.md is STALE (pre-migration state)

**Finding ID:** F-3a-03
**Doc:** `vcsm/identity/vcsm.identity.actor-hydration-pipeline-audit.md`
**Code:** `engines/identity/src/`, `apps/VCSM/src/state/identity/`
**Drift Status:** STALE
**Drift Severity:** HIGH

**Current doc behavior:** Describes an intermediate migration state from April 4, 2026. References:
- `features/identity/dal/platformIdentity.read.dal.js` — `dalGetVcsmAppAccount`, `dalListVcActorLinks`, `dalGetVcsmPreferences`
- `features/identity/dal/actorLink.dal.js` — `dalEnsureVcActorLink`, `dalSetVcActorAppAccount`
- Self-heal as calling `dalEnsureVcActorLink` to create actor links

**Actual code behavior (current):**
- `platformIdentity.read.dal.js` no longer drives the pipeline — the identity engine's `resolveAuthenticatedContext` controller does
- `dalEnsureVcActorLink` no longer exists in the self-heal path (self-heal calls `provision_vcsm_identity` RPC which still doesn't create actor links — that gap is documented in `vcsm.identity.vport-creation-audit.md`)
- The full pipeline is documented accurately in `vcsm.identity.actor-hydration-audit.md` (May 2) and `vcsm.identity.login-pipeline-trace.md`

**Risk:** A developer reading this doc would follow a code path that no longer exists and would implement changes against the wrong DAL files.

**Recommended action:** Archive this doc. Add a header note: "SUPERSEDED — See vcsm.identity.actor-hydration-audit.md and vcsm.identity.login-pipeline-trace.md for current state."

---

### F-3a-04 — context-forensic-review.md is STALE (pre-migration file snapshot)

**Finding ID:** F-3a-04
**Doc:** `vcsm/identity/vcsm.identity.context-forensic-review.md`
**Code:** `apps/VCSM/src/state/identity/identityContext.jsx`
**Drift Status:** STALE
**Drift Severity:** HIGH

**Current doc behavior:** Forensic review of `identityContext.jsx` from April 1, 2026. Describes the file as 91 lines with:
- `useIdentity()` returning `{ identity, loading, identityLoading, setIdentity, switchActor }`
- Single main effect on `[authLoading, user?.id]`
- Simple linear flow: load → set

**Actual code behavior (current):**
- `identityContext.jsx` is now 437+ lines (based on line references throughout multiple docs)
- Has `_resolveVersion` version guard (module-level counter)
- Has ownership guard (`_engineMeta.userId !== user.id`)
- Has `blockedVport` computed field exposed in context
- Has self-heal bootstrap sequence (phases 10-11 of login pipeline)
- Has `invalidateIdentityResultCache()` integration

**Risk:** The doc describes the old pre-identity-engine version of the file. Any debugging or architecture work using this doc as reference will be completely wrong.

**Recommended action:** Archive this doc. It served its purpose as a forensic baseline for the migration. Current state is in `vcsm.identity.context-file-map.md` and `vcsm.identity.login-pipeline-trace.md`.

---

### F-3a-05 — migration-checklist.md status not updated post-migration

**Finding ID:** F-3a-05
**Doc:** `vcsm/identity/vcsm.identity.migration-checklist.md`
**Code:** Identity engine + app integration (fully complete)
**Drift Status:** STALE
**Drift Severity:** MEDIUM

**Current doc status:** "Plan approved, not yet executed" (April 1, 2026).

**Actual state:** The migration described is complete. The identity engine is fully integrated into VCSM. Platform schema rows are being read, actor links are stored, preferences drive actor selection, the self-heal path provisions missing rows. Phases 0-5 are effectively done.

**Risk:** Low — no one should be executing this checklist against the live codebase. But it's misleading if read during an audit or onboarding.

**Recommended action:** Update the header to "Status: COMPLETE — migration executed April 2026." Or archive it with a note that it was the pre-execution planning artifact and is superseded by the engine architecture doc.

---

### F-3a-06 — invite-pipeline.md NEEDS_VERIFICATION (post-refactor)

**Finding ID:** F-3a-06
**Doc:** `vcsm/identity/vcsm.identity.invite-pipeline.md`
**Code:** `apps/VCSM/src/features/invite/controller/invite.controller.js`
**Drift Status:** NEEDS_VERIFICATION
**Drift Severity:** LOW

**Context:** Git commit `6883f4c` / `f2e57fe` — "refactor: invite flow to product-based system, remove auth invites" — landed after the doc's April 25 update. The commit message says auth invites were removed.

**Current doc behavior:** The invite pipeline doc (Version 2, April 25) may describe auth invites that have since been removed.

**Code inspected:** `invite.controller.js` only has `ctrlSendCitizenInvite` which validates email + inviterType and delegates to `sendCitizenInviteDAL`. The "auth invites" removal is significant — if the doc describes an auth invite path that no longer exists, it's stale.

**What was NOT confirmed:** Which specific parts of the invite doc were removed. The doc needs to be re-read against the post-refactor code.

**Recommended action:** Read the current `invite.controller.js`, `sendCitizenInviteDAL`, and the invite feature folder fully. Compare against the doc and update accordingly. This is a Phase 3b or dedicated follow-up task.

---

### F-3a-07 — Undocumented code: checkVportOwnership.controller.js + useVportOwnership.js

**Finding ID:** F-3a-07
**Doc:** None
**Code:** `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js` (NEW)
          `apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js` (NEW)
**Drift Status:** DOC MISSING
**Drift Severity:** MEDIUM

**What the gap is:** The current branch `vport-booking-feed-security-updates` introduced two new files with no corresponding Logan documentation:
- `checkVportOwnership.controller.js` — a controller for verifying VPORT ownership (security-critical)
- `useVportOwnership.js` — hook that consumes the ownership controller

These are security-relevant files in the VPORT booking/team area. No existing Logan doc in `vcsm/identity/` or `vports/` covers this new ownership check pattern.

**Risk:** Security controllers without documentation create a maintenance gap. If the ownership check logic has invariants (e.g., "always verify actor_owners, never trust client-supplied vportId"), those are invisible to future developers.

**Recommended action:** After the branch is merged or reviewed, create a Logan entry (or expand `vcsm.identity.vport-access-block.md`) documenting the ownership controller's security invariants. This belongs in the current branch's review scope — not retroactively patched.

---

## Fixes Applicable Now (Minor Drift)

Two fixes can be applied immediately — both are additive (adding missing steps to existing docs):

### Fix 1: actor-switch-pipeline.md — add invalidateIdentityResultCache step

In the "Full sequence" section, between step 3 (engine switch) and step 4 (hydration):

```
├─ 3. engineSwitchActiveActor({ userAppAccountId, actorLinkId })
│     → validate 4 checks (exists, owned, active, switchable)
│     → UPSERT platform.user_app_preferences
│     → invalidateIdentityResultCache()    ← ADD THIS
│     → emit EVENTS.ACTOR_SWITCHED
│
├─ 4. loadIdentityForActorId(targetActorId)
```

### Fix 2: citizen-to-vport-switch.md — add invalidateIdentityResultCache in Phase 3

After the SQL block showing the UPSERT, add:

```
After writing preferences, the engine calls invalidateIdentityResultCache().
This busts the 120s result cache in resolveAuthenticatedContext so the next
resolve (Phase 4's loadIdentityForActorId) reads fresh platform state.
```

---

## Action Items

| Priority | Action | Target Doc | Applies Now? |
|---|---|---|---|
| HIGH | Archive + note: actor-hydration-pipeline-audit.md | vcsm/identity/ | Yes |
| HIGH | Archive + note: context-forensic-review.md | vcsm/identity/ | Yes |
| MEDIUM | Update status: migration-checklist.md | vcsm/identity/ | Yes |
| LOW | Add `invalidateIdentityResultCache()` step | actor-switch-pipeline.md | Yes |
| LOW | Add `invalidateIdentityResultCache()` step | citizen-to-vport-switch.md | Yes |
| LOW | Verify invite-pipeline.md vs post-refactor code | vcsm/identity/ | Phase 3b |
| MEDIUM | Document checkVportOwnership ownership invariants | vports/ or new doc | After branch merge |
| NEEDS_VERIFICATION | actor-directory-projection.md — read search code | vcsm/identity/ | Phase 3b |

---

## What Is Solid

The following docs are high-quality, current, and tightly match the code:

- **login-pipeline-trace.md** — 14-phase, code-derived trace with exact file paths, line numbers, and table names. Most detailed doc in the codebase.
- **actor-hydration-audit.md** — Full hydration dependency graph. Updated May 2 with commitIdentity seeding useActorStore. Code and doc match.
- **citizen-soft-delete.md** — 4-version history, Phase 1 + 2, Edge Function security invariants documented.
- **context-file-map.md** — Complete file map + call graph. Security guards documented.
- **vport-access-block.md** — blockedVport system, route guard invariants, no redirect loop invariant.
- **vport-creation-audit.md** — Known gaps explicitly documented (provision_vcsm_identity link gap), April 5 fix confirmed.
- **account-settings-tab.md** — Two-step delete UX, dual-mode design, fully current.

---

## Phase 3b Scope (next)

- `vcsm/identity/vcsm.identity.invite-pipeline.md` — verify vs post-refactor code
- `vcsm/identity/vcsm.identity.actor-directory-projection.md` — read search DAL + explore screen code
- `vports/` — all vport docs vs code
- `vcsm/booking/` — booking pipeline doc vs booking code (including current branch changes)

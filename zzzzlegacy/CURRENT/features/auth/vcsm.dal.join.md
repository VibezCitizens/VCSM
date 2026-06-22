# VCSM DAL — `join`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/join/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 3 |
| Exported functions | 5 |
| Tables accessed | 3 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `barberVport.read.dal.js`

**Path:** `features/join/dal/barberVport.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `findBarberVportForUserDAL` | `read` | `profiles`, `profile_categories` |
| `readBarberVportByOwnerUserIdDAL` | `read` | `profiles`, `profile_categories` |

### `joinAuth.dal.js`

**Path:** `features/join/dal/joinAuth.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `signUpForInviteDAL` | `unknown` | — |

### `joinInvite.dal.js`

**Path:** `features/join/dal/joinInvite.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `acceptJoinResourceDAL` | `read` · `update` | `resources` |
| `fetchJoinResourceByIdDAL` | `read` · `update` | `resources` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `profile_categories` | READ | `findBarberVportForUserDAL`, `readBarberVportByOwnerUserIdDAL` |
| `profiles` | READ | `findBarberVportForUserDAL`, `readBarberVportByOwnerUserIdDAL` |
| `resources` | UPDATE | `acceptJoinResourceDAL`, `fetchJoinResourceByIdDAL` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `barberVport.read.dal.js`

**Direct callers:**

- `joinBarbershopAccount.controller.js` _Controller_
- `joinBarbershopQr.controller.js` _Controller_

**Full call chain to screen:**

```
`barberVport.read.dal.js` → `joinBarbershopAccount.controller.js` → `useJoinBarbershop.js` → `JoinBarbershopScreen.jsx`
```

### `joinAuth.dal.js`

**Direct callers:**

- `joinBarbershopAccount.controller.js` _Controller_

**Full call chain to screen:**

```
`joinAuth.dal.js` → `joinBarbershopAccount.controller.js` → `useJoinBarbershop.js` → `JoinBarbershopScreen.jsx`
```

### `joinInvite.dal.js`

**Direct callers:**

- `joinBarbershopAccount.controller.js` _Controller_
- `joinBarbershopQr.controller.js` _Controller_

**Full call chain to screen:**

```
`joinInvite.dal.js` → `joinBarbershopAccount.controller.js` → `useJoinBarbershop.js` → `JoinBarbershopScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✗ MISSING | — |
| **Controller** | ✓ PRESENT | `joinBarbershopAccount.controller.js`, `joinBarbershopQr.controller.js` |
| **Adapter** | ✗ MISSING | — |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useJoinBarbershop.js` |
| **Component** | ✗ MISSING | — |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✓ PRESENT | `JoinBarbershopScreen.jsx` |

### Controller

_Business rules, ownership, permissions — no React_

- `features/join/controllers/joinBarbershopAccount.controller.js`
- `features/join/controllers/joinBarbershopQr.controller.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/join/hooks/useJoinBarbershop.js`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/join/screens/JoinBarbershopScreen.jsx`

### Missing Layers

- 🔴 **Model** — not detected in static scan
- 🟡 **Adapter** — not detected in static scan
- 🟡 **Service** — not detected in static scan
- 🟡 **Component** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`  
_Auditor:_ ARCHITECT

---

### Verdict: No Confirmed Dead Code

All 5 exported functions are wired and actively called. No deletion candidates.

| Function | Status | Evidence |
|---|---|---|
| `readBarberVportByOwnerUserIdDAL` | LIVE | Called twice in `joinBarbershopAccount.controller.js` |
| `findBarberVportForUserDAL` | LIVE | Called in `joinBarbershopQr.controller.js` → `useJoinBarbershop.js` |
| `signUpForInviteDAL` | LIVE | Called in `joinBarbershopAccount.controller.js` |
| `fetchJoinResourceByIdDAL` | LIVE | Called in both `joinBarbershopAccount.controller.js` and `joinBarbershopQr.controller.js` |
| `acceptJoinResourceDAL` | LIVE | Called 3× in `joinBarbershopAccount.controller.js`, 2× in `joinBarbershopQr.controller.js` |

---

### Structural Finding #1 — Doc call chains missing the QR path

**Affected sections:** `barberVport.read.dal.js` call chain, `joinInvite.dal.js` call chain  
**Classification:** DOC INACCURACY  

**Evidence:**
- `joinBarbershopQr.controller.js` calls both `findBarberVportForUserDAL` (from `barberVport.read.dal.js`) and `fetchJoinResourceByIdDAL` + `acceptJoinResourceDAL` (from `joinInvite.dal.js`)
- The call chain sections above only show the invite path (`joinBarbershopAccount.controller.js`) — the QR path is entirely missing from both chains
- Full verified chain for QR path:

```
barberVport.read.dal.js → joinBarbershopQr.controller.js → useJoinBarbershop.js → JoinBarbershopScreen.jsx
joinInvite.dal.js       → joinBarbershopQr.controller.js → useJoinBarbershop.js → JoinBarbershopScreen.jsx
```

**Risk:** LOW — no runtime impact. Doc understates the fanout of both DAL files.  
**Recommended action:** Update call chain sections to include QR path callers.  
**Handoffs:** LOGAN (doc correction)

---

### Structural Finding #2 — `barberVport.read.dal.js` scopes by `userId` not `actorId`

**File:** `features/join/dal/barberVport.read.dal.js`  
**Classification:** IDENTITY CONTRACT EXCEPTION — acceptable in join pre-provisioning context  

**Evidence:**
- Both `readBarberVportByOwnerUserIdDAL` and `findBarberVportForUserDAL` query `profiles` + `profile_categories` filtered by `owner_user_id` (auth user UUID)
- Neither function uses `actorId` scoping
- File imports from `vportClient` instead of `supabaseClient`

**Why this is acceptable here:** The join flow is a pre-provisioning path — the user may not yet have a VCSM actor identity. Resolving which Vport a user owns requires looking up by their auth `userId` before `actorId` is available. This is a legitimate boundary case.

**Risk:** LOW — scoped to the join entry point only. Not a pattern that should spread outside `features/join/`.  
**Recommended action:** Add an inline comment to both functions noting the pre-provisioning exception to prevent the `userId` scoping pattern from being copied into post-auth features.  
**Handoffs:** VENOM (confirm the boundary exception is intentional and scoped)

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| Doc call chains missing QR path for 2 DAL files | DOC INACCURACY | P3 |
| `barberVport.read.dal.js` uses `userId` scoping on `profiles` | IDENTITY CONTRACT EXCEPTION (acceptable) | P3 |

**Confirmed dead functions:** 0  
**Doc function count:** ACCURATE (5 — all referenced)

---

## Layer Consumer Map

_Audited:_ 2026-05-11  
_Method:_ Static import trace — full upward traversal from each DAL file through Controller → Hook → Screen → Router  
_Auditor:_ ARCHITECT

---

> ## ⚠️ FEATURE IS UNROUTED
>
> `JoinBarbershopScreen.jsx` is not registered in any route file, lazy loader (`lazyApp.jsx`, `lazyPublic.jsx`), or router config. No `/join` route exists in `app/routes/`. The entire join feature stack — DAL, controllers, hook, screen, and components — is built but unreachable.

---

### DAL → Controller

| DAL File | Controllers That Import It |
|---|---|
| `barberVport.read.dal.js` | `joinBarbershopAccount.controller.js` (`readBarberVportByOwnerUserIdDAL` — called ×2), `joinBarbershopQr.controller.js` (`findBarberVportForUserDAL`) |
| `joinAuth.dal.js` | `joinBarbershopAccount.controller.js` (`signUpForInviteDAL`) |
| `joinInvite.dal.js` | `joinBarbershopAccount.controller.js` (`fetchJoinResourceByIdDAL`, `acceptJoinResourceDAL` ×3), `joinBarbershopQr.controller.js` (`fetchJoinResourceByIdDAL`, `acceptJoinResourceDAL` ×2) |

---

### Controller → Hook

Both controllers are consumed exclusively by `useJoinBarbershop.js`. No other hook or file imports from either controller.

| Controller | Exported Functions Used | Imported By |
|---|---|---|
| `joinBarbershopAccount.controller.js` | `loadInviteForJoin`, `checkJoinAuthState`, `signUpForBarbershopInvite`, `loginForInvite`, `autoResumeInviteOnboarding`, `createBarberVportAndAccept`, `useExistingBarberVportAndAccept` | `useJoinBarbershop.js` |
| `joinBarbershopQr.controller.js` | `loadQrJoin`, `findCurrentUserBarberVport`, `acceptQrJoin`, `createBarberVportAndAcceptQr` | `useJoinBarbershop.js` |

---

### Hook Cross-Feature Dependencies

`useJoinBarbershop.js` is the most dependency-heavy file in this feature. It pulls from 4 separate sources outside `features/join/`:

| Import | Source | Path Type |
|---|---|---|
| `useIdentityOps` | `@/features/identity/adapters/identity.adapter` | Correct — via adapter |
| `useIdentity` | `@/state/identity/identityContext` | **Direct import — bypasses adapter** (`identity.adapter.js` re-exports `useIdentity`, but the hook skips the adapter and imports from the state module directly) |
| `useAuthOps` | `@/features/auth/adapters/auth.adapter` | Correct — via adapter |
| `useVportCoreOps` | `@/features/vport/adapters/vport.public.adapter` | Correct — via adapter |

**Boundary note:** `useIdentity` should be imported from `@/features/identity/adapters/identity.adapter`, not directly from `@/state/identity/identityContext`. Three of four cross-feature imports follow the adapter contract; this one does not.

---

### Hook → Screen

| Hook | Screen That Imports It |
|---|---|
| `useJoinBarbershop.js` (exports `useJoinBarbershop`, `VIEWS`) | `JoinBarbershopScreen.jsx` (sole consumer) |

---

### Screen → Route

| Screen | Route Registration | Status |
|---|---|---|
| `JoinBarbershopScreen.jsx` | Not found in `lazyApp.jsx`, `lazyPublic.jsx`, `app.routes.jsx`, or any route file | **UNROUTED** |

No `/join` or `/join/:token` path exists anywhere in `app/routes/`. The screen is a dead end — it exists, renders, but has no entry point from the router.

---

### Model Layer

No model files detected in `features/join/`. Architecture Pipeline correctly marks Model as MISSING. DAL results (`profile_categories`, `profiles`, `resources`) are consumed raw by controllers — no shape transform layer exists.

---

### Component Layer — Exists but Missing from Pipeline

The Architecture Pipeline marks Component as MISSING, but 3 component files exist:

| File | Role |
|---|---|
| `features/join/screens/components/JoinLoginForm.jsx` | Login form rendered inside `JoinBarbershopScreen` |
| `features/join/screens/components/JoinSignupForm.jsx` | Signup form rendered inside `JoinBarbershopScreen` |
| `features/join/screens/components/JoinPrimitives.jsx` | Shared UI primitives for join flow |
| `features/join/screens/components/joinStyles.js` | Style constants for join screens |

All components are internal to `JoinBarbershopScreen` — no external consumers.

---

### Full Stack Summary

```
barberVport.read.dal.js ──┐
joinAuth.dal.js           ├──→ joinBarbershopAccount.controller.js ──┐
joinInvite.dal.js         ├──→ joinBarbershopAccount.controller.js ──┤
                          └──→ joinBarbershopQr.controller.js        ├──→ useJoinBarbershop.js ──→ JoinBarbershopScreen.jsx ──→ (NO ROUTE)
                                                                      └──→ joinBarbershopQr.controller.js ──┘
```

---

### Architecture Pipeline — Corrected

| Layer | Actual Status | Evidence |
|---|---|---|
| DAL | PRESENT | 3 files, 5 functions — all live |
| Model | MISSING | No model files in `features/join/` |
| Controller | PRESENT | `joinBarbershopAccount.controller.js`, `joinBarbershopQr.controller.js` |
| Adapter | MISSING | No adapter file in `features/join/` — feature is consumed directly, not exposed cross-feature |
| Hook | PRESENT | `useJoinBarbershop.js` |
| Component | PRESENT (undetected by scanner) | `JoinLoginForm.jsx`, `JoinSignupForm.jsx`, `JoinPrimitives.jsx`, `joinStyles.js` |
| View Screen | MISSING | No separate view screen — screen and view are combined in `JoinBarbershopScreen.jsx` |
| Final Screen | PRESENT | `JoinBarbershopScreen.jsx` |
| Route | **MISSING** | No route file, no lazy registration, no `/join` path |

---

### Findings Summary

| Finding | Classification | Priority |
|---|---|---|
| `JoinBarbershopScreen.jsx` not registered in any route or lazy loader | **UNROUTED FEATURE** | P0 — confirm with IRONMAN |
| `useJoinBarbershop.js` imports `useIdentity` directly from state context, bypassing adapter | BOUNDARY INCONSISTENCY | P2 |
| Component layer exists but was missed by Architecture Pipeline scanner | DOC INACCURACY | P3 |

**Handoffs:** IRONMAN (confirm join feature disposition — is this deferred, cancelled, or pending route wire-up?), WOLVERINE (wire `/join/:token` route if confirmed active), SENTRY (direct state import in hook)

---

## Avengers Assembly Report — 2026-05-11

**Run Summary**

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | User — `/AvengersAssemble` scoped to this document |
| Application Scope | VCSM |
| Document Scope | `vcsm.dal.join.md` — join DAL alignment pass |
| Passes Completed | ARCHITECT · VENOM · LOGAN · review-contract · Session-Summary Structure |
| Branch | `vport-booking-feed-security-updates` |
| Commits verified | `8baf6d5` (2026-05-10) — touched 3 join files post-doc-generation |

---

### ARCHITECT

**Status: DRIFT FOUND**

| Finding | Severity | Detail |
|---|---|---|
| `Tables Accessed` row for `readBarberVportByOwnerUserIdDAL` is wrong | MODERATE | The doc lists both `findBarberVportForUserDAL` and `readBarberVportByOwnerUserIdDAL` as accessing `profiles, profile_categories`. Verified: `readBarberVportByOwnerUserIdDAL` queries only `profiles` (single `.from("profiles")` with no join). Only `findBarberVportForUserDAL` uses a `profile_categories` join. The `profile_categories` column in that table row should be restricted to `findBarberVportForUserDAL` only. |
| `joinInvite.dal.js` select columns changed | LOW | In commit `8baf6d5`, `profile_id` was removed from `RESOURCE_COLS` — it is no longer returned as an explicit column (though still used as the join key). The doc does not document column-level selects for this DAL, so no direct table is wrong, but the current column set is narrower than when the doc was written. |
| New cross-feature dependency in controller | MODERATE | `joinBarbershopAccount.controller.js` now imports `recordSignupConsent` from `@/features/legal/adapters/legal.adapter`. This dependency is absent from the doc — neither the Layer Consumer Map nor the Call Chains section mention any legal adapter dependency. |
| Route status | ALIGNED | Confirmed unrouted. No `/join` path found in `lazyApp.jsx`, `lazyPublic.jsx`, `app.routes.jsx`, or any route file. Feature remains fully built but unreachable from the router. |
| File tree | ALIGNED | 11 files confirmed. All match the doc exactly. |
| DAL file count | ALIGNED | 3 confirmed. |
| Function count | ALIGNED | 5 confirmed, all live. |
| Component layer | ALIGNED | 4 files confirmed: `JoinLoginForm.jsx`, `JoinSignupForm.jsx`, `JoinPrimitives.jsx`, `joinStyles.js`. |
| External consumers | ALIGNED | Zero. No imports from outside `features/join/` confirmed. |

---

### VENOM

**Status: DRIFT FOUND**

| Finding | Severity | Detail |
|---|---|---|
| `joinAuth.dal.js` operations label "unknown" masks an auth write | HIGH | `signUpForInviteDAL` calls `supabase.auth.signUp()` — this is a **Supabase Auth account creation** call (auth write), not an unknown operation. This is the only function in the join feature that creates a new auth identity. Labelling it "unknown" understates its security surface. The doc's Tables column correctly shows `—` (not a table operation) but the Operations column must say `AUTH WRITE`. |
| `useExistingBarberVportAndAccept` previously had no ownership gate (now fixed) | HIGH | Before commit `8baf6d5`, `useExistingBarberVportAndAccept(token, vportActorId)` accepted any caller-supplied `vportActorId` without verifying the caller actually owned it. The function directly called `acceptJoinResourceDAL(token, vportActorId)`. Fixed in `8baf6d5`: now calls `readCurrentAuthUserDAL?.()` then `readBarberVportByOwnerUserIdDAL(user.id)` and asserts `existingVport.actor_id === vportActorId` before proceeding. This was an ownership bypass vulnerability. The doc says "Risk findings: 0" — that was correct at generation time but the commit retroactively confirms a HIGH risk existed and was silently fixed. |
| `syntheticAdultBirthdate()` removal — age attestation was synthesized | HIGH | Before `8baf6d5`, `buildAndBootstrapUserActor` called `syntheticAdultBirthdate()` which fabricated a birthdate 18 years in the past and wrote `isAdult: true` to the user's profile without any actual age confirmation from the user. This was removed. The doc has no mention of this function ever existing or being removed. This is a legal compliance / age-gate security finding — fabricating age attestation bypasses the age gate. Doc must record this fix. |
| Consent recording added to signup path | MODERATE | `signUpForBarbershopInvite` now calls `recordSignupConsent({ userId })` immediately when a session is returned (no email confirm path). Consent is recorded via `@/features/legal/adapters/legal.adapter`. Failure is caught and suppressed with a DEV-only warning — the comment explicitly notes the ProtectedRoute gate self-heals on next entry. This is a new legal compliance dependency not in the doc. |
| `joinAuth.dal.js` uses `supabaseClient`, all others use `vportClient` | LOW | Mixed Supabase client usage within one feature. `barberVport.read.dal.js` and `joinInvite.dal.js` use `vportSchema` (vportClient). `joinAuth.dal.js` uses `supabase` (supabaseClient). Intentional — auth operations must go through the main client. Not documented. |
| `useJoinBarbershop.js` direct state import | LOW | Confirmed: `useIdentity` imported from `@/state/identity/identityContext` directly (line 2). Already in doc under Layer Consumer Map as a boundary note. Status unchanged. |

---

### LOGAN

**Status: DRIFT FOUND**

| Finding | File | Drift Type | Detail |
|---|---|---|---|
| `joinAuth.dal.js` operations label "unknown" | DAL Files section | MODERATE | Must read `AUTH WRITE (supabase.auth.signUp)`. See VENOM finding above. |
| `Tables Accessed` — `profile_categories` attribution wrong | Tables Accessed section | MODERATE | `readBarberVportByOwnerUserIdDAL` does not access `profile_categories`. That row must be corrected. |
| Three security fixes in `joinBarbershopAccount.controller.js` undocumented | Risk Findings section, Call Chains section | HIGH | Commit `8baf6d5` (2026-05-10) introduced three security changes absent from the doc: (1) ownership gate added to `useExistingBarberVportAndAccept`, (2) synthetic age attestation removed from `buildAndBootstrapUserActor`, (3) consent recording added to signup flow. Doc shows "Risk findings: 0" — this must now reflect the fixes as closed risks or add a security history note. |
| New cross-feature controller dependency undocumented | Layer Consumer Map section | MODERATE | `joinBarbershopAccount.controller.js` now depends on `@/features/legal/adapters/legal.adapter`. Not in the dependency table or call chains. |
| `joinInvite.dal.js` `profile_id` column drop undocumented | DAL Files section | LOW | `profile_id` removed from `RESOURCE_COLS` in `8baf6d5`. Not in doc but doc does not track column lists for this DAL. Low severity. |
| `JoinSignupForm.jsx` legal URL paths updated | Component layer | LOW | `/terms` → `/legal/terms-of-service`, `/privacy` → `/legal/privacy-policy`. Not an architectural change but undocumented. |
| UNROUTED status | Layer Consumer Map — Screen → Route section | ALIGNED | Still unrouted. No regression. |
| All dead code audit results | Dead Code Audit section | ALIGNED | All 5 functions still live. No new dead code introduced. |

---

### review-contract

**Status: VIOLATIONS FOUND**

| Finding | File | Violation | Severity |
|---|---|---|---|
| `useJoinBarbershop.js` direct `useIdentity` import | `hooks/useJoinBarbershop.js` line 2 | `useIdentity` imported from `@/state/identity/identityContext` directly, bypassing the identity adapter. Contract requires all cross-feature access through adapters only. Already in doc — still unresolved. | MEDIUM |
| `joinAuth.dal.js` operations undocumented | `dal/joinAuth.dal.js` | Operations field says "unknown" — a DAL that performs `supabase.auth.signUp()` must have its operation type documented. Not labelling auth writes in a DAL audit is a documentation compliance gap. | LOW |
| All DAL selects | All DAL files | Verified: no `select('*')` in any join DAL file. All use explicit column lists. | ALIGNED |
| No TypeScript files | All files | No `.ts`/`.tsx` files found. | ALIGNED |
| Legal adapter cross-feature import in controller | `controllers/joinBarbershopAccount.controller.js` | New import of `recordSignupConsent` from `@/features/legal/adapters/legal.adapter` — import is via the adapter (correct pattern). Not a violation. | ALIGNED |

---

### Session-Summary Structure

**Status: ISSUE** _(carried from prior runs — unchanged)_

| Check | Status | Detail |
|---|---|---|
| `2026-05` month folder | MISSING | No session summary folder for current month (May 2026). |
| `2026-04_month_summary.md` | PRESENT | April 2026 month summary exists in `2026-04/`. |
| Orphaned session files at root | NONE | No misplaced files. |
| Command count | DRIFT | 23 `.md` files in `.claude/commands/`. CLAUDE.md lists 17. 6 undocumented: `AvengersAssemble`, `Cerebro`, `SHIELD`, `Sentry`, `WinterSoldier`, `listofcomand.v2`. |

---

### Proposed Updates

| Update | Target | Action Required |
|---|---|---|
| Correct `joinAuth.dal.js` operations from "unknown" to "AUTH WRITE" | DAL Files section | Replace `unknown` with `AUTH WRITE (supabase.auth.signUp)` in the operations field and table. |
| Correct `Tables Accessed` for `readBarberVportByOwnerUserIdDAL` | Tables Accessed section | Remove `profile_categories` from `readBarberVportByOwnerUserIdDAL`'s row — it queries `profiles` only. |
| Add security history note for three controller fixes | Risk Findings section | Document the three `8baf6d5` security hardening changes as closed risks: ownership gate on `useExistingBarberVportAndAccept`, synthetic age attestation removed, consent recording added. |
| Add legal adapter dependency to Layer Consumer Map | Layer Consumer Map — Hook Cross-Feature Dependencies | Add `recordSignupConsent` from `@/features/legal/adapters/legal.adapter` used in `joinBarbershopAccount.controller.js`. |
| Add Supabase client mix note | DAL Files section for `joinAuth.dal.js` | Note that this DAL uses `supabaseClient` (auth operations) while all other join DALs use `vportClient`. |

All proposed changes are documentation corrections — no `.v2.md` required. User approval needed before edits are applied.

---

### Overall Status

**DRIFT FOUND**

| Area | Status | Blocking |
|---|---|---|
| Architecture | DRIFT — Tables Accessed row inaccurate, new legal adapter dependency undocumented | No |
| Security / Trust | DRIFT — "unknown" auth write, three post-doc security fixes undocumented, ownership bypass (now fixed) not recorded | CAUTION — fixed in code but doc says "Risk findings: 0" which is misleading |
| Documentation Truth | DRIFT — operations label wrong, table access wrong, security fixes absent | No |
| Contract Compliance | VIOLATION — direct state import in hook (pre-existing, unresolved) | No — medium severity |
| Session Structure | ISSUE — May 2026 folder missing, 6 commands undocumented | No |

---

### Recommended Next Command

| Priority | Command | Reason |
|---|---|---|
| 1 | **IRONMAN** | Determine the route disposition of `JoinBarbershopScreen.jsx` — is this feature deferred, cancelled, or pending wire-up? Until this is answered, the entire join stack (DAL → screen) is built but unreachable in production. |
| 2 | **VENOM** | Formally review the now-fixed ownership bypass in `useExistingBarberVportAndAccept` and the synthetic age attestation removal. Both were HIGH security issues. Confirm the fixes are complete and no other join paths bypass ownership checks. |
| 3 | **SENTRY** | Resolve `useJoinBarbershop.js` direct `useIdentity` import — redirect to `@/features/identity/adapters/identity.adapter`. Low-effort, contracts fix. |
| 4 | **CARNAGE** | Verify the `profile_id` column removal from `RESOURCE_COLS` in `joinInvite.dal.js` does not break any downstream consumer that previously read `resource.profile_id` from the returned row shape. |

---

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js` | Replaced direct `@/state/identity/identityContext` import with `useIdentity` from `@/features/identity/adapters/identity.adapter`. |
| `apps/VCSM/src/features/join/dal/barberVport.read.dal.js` | Added scoped comments documenting why join pre-provisioning reads by auth `userId` instead of `actorId`. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.join.md` | Appended this fix-pass record. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| Boundary inconsistency: `useJoinBarbershop.js` imported `useIdentity` directly from state | DONE | Hook now imports `useIdentity` through the identity adapter. |
| Structural Finding #2: `barberVport.read.dal.js` scopes by `userId` in pre-provisioning flow | DOCUMENTED IN CODE | Added comments to both DAL functions to mark the exception as join-specific pre-provisioning behavior. |
| Doc call chains missing QR path | DOCUMENTED | Verified QR controller callers remain live; prior sections preserved and this appended note records current state. |
| `JoinBarbershopScreen.jsx` unrouted | DEFERRED | Verified no route registration; route disposition needs IRONMAN/product ownership before wiring. |
| `joinAuth.dal.js` operation label should be auth write | DOCUMENTED | Verified `supabase.auth.signUp()` is used; no source behavior change required. |
| Security history from commit `8baf6d5` | DOCUMENTED | Verified legal consent adapter dependency and ownership-gate context remain in code; no further code change forced. |
| Legal adapter dependency missing from older map | DOCUMENTED | Verified `recordSignupConsent` is imported via `@/features/legal/adapters/legal.adapter`, which is an approved adapter path. |

### Verification
- Commands/searches run:
  - `rg -n "@/state/identity/identityContext|@/features/identity/adapters/identity.adapter|JoinBarbershopScreen|join/barbershop|path:.*join|recordSignupConsent|supabase.auth.signUp|owner_user_id" apps/VCSM/src/features/join apps/VCSM/src/app --glob '*.js' --glob '*.jsx'`
  - `rg -n "readBarberVportByOwnerUserIdDAL|findBarberVportForUserDAL|signUpForInviteDAL|fetchJoinResourceByIdDAL|acceptJoinResourceDAL" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `sed -n '1,220p' apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`
  - `sed -n '1,220p' apps/VCSM/src/features/join/dal/barberVport.read.dal.js`
  - `npm run build`
- Production callers checked:
  - `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`
  - `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js`
  - `apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js`
  - `apps/VCSM/src/features/join/screens/JoinBarbershopScreen.jsx`
  - `apps/VCSM/src/app/routes/`
- Remaining risks:
  - Join route remains absent; IRONMAN must decide whether to wire, defer, or retire the feature.
  - Formal VENOM review remains needed for the prior ownership bypass and synthetic age attestation removal.
  - `joinAuth.dal.js` documentation drift remains in prior sections because this pass is append-only.
  - Build passes; Vite still reports the pre-existing auth adapter dynamic/static import chunk warning for `VerifyEmailRequiredScreen.jsx`.

### Status
PARTIAL

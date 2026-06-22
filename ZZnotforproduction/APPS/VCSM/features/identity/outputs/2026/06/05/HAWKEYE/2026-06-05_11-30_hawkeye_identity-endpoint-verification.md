# HAWKEYE Endpoint Verification Report

**Date:** 2026-06-05
**Application Scope:** VCSM
**Environment:** Source-level verification (INFERRED — no live endpoint calls)
**Reviewer:** HAWKEYE
**Verification Summary:** 0 PASS | 2 PARTIAL | 3 WATCH
**Contract Drift:** MINOR
**Auth Issues:** 2 (both PARTIAL — JWT present, ownership absent)
**Observability Gaps:** 1

---

## ARCHITECT Artifact Preflight

```
ARCHITECT ROUTE MAP LOADED
Source: ZZnotforproduction/APPS/VCSM/features/identity/ARCHITECTURE.md
        ZZnotforproduction/APPS/VCSM/features/identity/INDEX.md
        (ARCHITECTURE-MD-FALLBACK mode — no evidence-bundle.json or routes.graph.json)
Scope: VCSM / feature=identity
Date: 2026-06-04 (age: 1 day — within 7-day window)
Endpoints confirmed: 0 routes | 2 RPC write surfaces
```

### ARCHITECT Artifact Completeness Check

| Artifact | Required Content | Status | Result |
|---|---|---|---|
| `routes.graph.json` | Route nodes or EXPLICIT_NONE | EXPLICIT_NONE (INDEX.md: "No routes in route-map for this feature") | PASS (ARCHITECT_EXPLICIT_NONE exception) |
| `feature-map.md` | Route inventory or EXPLICIT_NONE | MISSING as separate file — route inventory present in ARCHITECTURE.md + INDEX.md | WARN (ARCHITECTURE-MD-FALLBACK) |

**ARCHITECT_EXPLICIT_NONE: ROUTES_VERIFIED_ZERO**
ARCHITECT explicitly confirmed zero route/screen entry points for the identity feature. HAWKEYE proceeds in RPC-surface-only mode with ARCHITECTURE-MD-FALLBACK artifacts.

RPC write surfaces drawn from INDEX.md write-surface-map:
1. `platform.provision_vcsm_identity` — via `dalProvisionVcsmIdentity` → `ensureVcsmPlatformBootstrap`
2. `identity.refresh_actor_directory_row` — via `refreshActorDirectoryRow` / `refreshVcActorDirectory`

---

## Endpoint Summary

| Surface | Type | Auth Required | HAWKEYE Status |
|---|---|---|---|
| `platform.provision_vcsm_identity` RPC | Supabase RPC (SECURITY DEFINER) | YES — session JWT + ownership | PARTIAL |
| `identity.refresh_actor_directory_row` RPC | Supabase RPC | YES — session JWT | PARTIAL |
| `identity.adapter.js` public surface | Adapter export contract | N/A | WATCH |
| `identityOps.adapter.js` secondary surface | Adapter export contract | N/A | WATCH |
| `setupVcsmIdentityEngine()` startup contract | Engine init | N/A | WATCH |

---

## ARCHITECT Endpoint Coverage

| Endpoint | ARCHITECT-Confirmed | Verification Status | Notes |
|---|---|---|---|
| `platform.provision_vcsm_identity` RPC | YES (INDEX.md write-surface-map) | VERIFIED (INFERRED) | PARTIAL — JWT present; ownership absent at app layer |
| `identity.refresh_actor_directory_row` RPC | YES (INDEX.md write-surface-map) | VERIFIED (INFERRED) | PARTIAL — fire-and-forget; no ownership check |
| `identity.adapter.js` exports | YES (ARCHITECTURE.md entry points) | VERIFIED (INFERRED) | WATCH — controller exports on public adapter surface |
| `identityOps.adapter.js` exports | YES (ARCHITECTURE.md layer map) | VERIFIED (INFERRED) | WATCH — adapter boundary violation |

**Coverage Summary:**
- ARCHITECT-confirmed RPC surfaces for scope: 2
- HAWKEYE-verified this run: 2
- UNVERIFIED (WATCH): 0
- NOT_IN_ARCHITECT: 0

---

## API Contract Verification

---

```
HAWKEYE TRACE
- traceId:        HAWKEYE-2026-06-05-001
- endpoint:       platform.provision_vcsm_identity (via ensureVcsmPlatformBootstrap)
- method:         RPC (SECURITY DEFINER)
- environment:    source-level (INFERRED)
- auth state:     authenticated — session JWT via Supabase client
- actor context:  kind: user — userId + actorId required params
- timestamp:      2026-06-05T11:00:00Z
```

**Contract:**
- Call path: `useIdentityOps()` → `ensureVcsmPlatformBootstrap({ userId, actorId })` → `dalProvisionVcsmIdentity({ userId, actorId })` → `supabase.schema('platform').rpc('provision_vcsm_identity', { p_user_id: userId, p_actor_id: actorId })`
- Return shape: `{ ok: boolean, userAppAccountId?: string, error?: string }` (INFORMAL — no model file)
- Idempotent: YES (documented in source comment)
- Non-throwing: YES (controller catches and returns `{ ok: false }`)

**Contract Assessment:**
- The DAL returns `data` directly from `supabase.rpc()` as `userAppAccountId` — if the RPC return type changes (returns object instead of UUID string), the caller receives the wrong type with no runtime guard.
- The `{ok, userAppAccountId, error}` shape is a convention, not a formal contract. No model file exists.
- Evidence Type: INFERRED | Confidence: HIGH (source read)

**Result:** PARTIAL — contract present but informal; type guard absent on RPC return

---

```
HAWKEYE TRACE
- traceId:        HAWKEYE-2026-06-05-002
- endpoint:       identity.refresh_actor_directory_row (via refreshVcActorDirectory)
- method:         RPC
- environment:    source-level (INFERRED)
- auth state:     authenticated — session JWT via Supabase client
- actor context:  kind: user or vport — actorId required
- timestamp:      2026-06-05T11:00:00Z
```

**Contract:**
- Call path: `useIdentityOps()` → `refreshVcActorDirectory(actorId)` → `refreshActorDirectoryRow('vc', actorId)` → `supabase.schema('identity').rpc('refresh_actor_directory_row', { p_actor_domain, p_actor_id })`
- Return shape: `{ ok: boolean, error?: Error }`
- Fire-and-forget: YES — callers discard return value in most paths
- Non-throwing: YES (controller catches and returns `{ ok: false, error }`)

**Fire-and-Forget Gap:**
`refreshActorDirectoryRow` returns `{ ok: boolean, error }` but the DAL comment explicitly states: "If the refresh fails, the primary user operation is NOT rolled back." This is a documented design decision. However, callers do not log or surface the failure — silent stale directory entries are the result.

**Result:** PARTIAL — documented fire-and-forget pattern; silent failure on error

---

## Auth Verification

```
AUTH VERIFICATION

| Endpoint | Auth Required | Observed Behavior | Auth Enforcement | Status |
|---|---|---|---|---|
| provision_vcsm_identity RPC | YES | Session JWT auto-attached by Supabase client | PARTIAL — JWT present; no app-layer ownership pre-check before RPC | PARTIAL |
| refresh_actor_directory_row RPC | YES | Session JWT auto-attached by Supabase client | PARTIAL — JWT present; no app-layer actorId ownership check | PARTIAL |
```

**Auth Notes:**
- Supabase client automatically attaches the user's JWT to all RPC calls — anonymous calls are rejected at the DB transport layer.
- App-layer ownership verification is absent for both surfaces (confirmed by ELEK-2026-06-05-003 and ELEK-2026-06-05-001 respectively).
- DB-level RLS enforcement on `provision_vcsm_identity` is UNVERIFIED at this layer — SECURITY DEFINER RPCs run with elevated privilege; whether the RPC internally checks `auth.uid() = p_user_id` is a DB governance question (route to DB command).
- Evidence Type: INFERRED | Confidence: HIGH for JWT enforcement, LOW for DB-level ownership check

---

## Payload Validation Review

```
PAYLOAD VALIDATION REVIEW

| Endpoint | Invalid Payload Type | Observed Response | Status |
|---|---|---|---|
| provision_vcsm_identity | null userId | { ok: false, error: 'Missing userId or actorId' } (INFERRED) | PASS |
| provision_vcsm_identity | null actorId | { ok: false, error: 'Missing userId or actorId' } (INFERRED) | PASS |
| provision_vcsm_identity | non-UUID string actorId | Passes to RPC — DB validates UUID format | WATCH |
| provision_vcsm_identity | wrong-owner actorId | Passes to RPC — app layer does not reject (ELEK-003) | FAIL (cross-ref ELEK-2026-06-05-003) |
| refresh_actor_directory_row | null actorId (via wrapper) | refreshVcActorDirectory(null) → refreshActorDirectoryRow('vc', null) → { ok: false, error: 'missing...' } | PASS |
| refresh_actor_directory_row | wrong-owner actorId | Passes to RPC — no ownership check (ELEK cross-ref) | PARTIAL |
```

**Validation Gap:**
- Neither RPC surface validates UUID format at the app layer — both rely entirely on the DB to reject malformed UUIDs. This is acceptable if the DB returns a clear error (Supabase will reject non-UUID parameters for UUID-typed columns), but the error message will be a DB error, not a clean application-layer message.
- Evidence Type: INFERRED | Confidence: HIGH

---

## Edge Function Verification

No edge functions in identity feature scope. ARCHITECT INDEX.md confirms no Cloudflare Worker or edge function surfaces for this feature.

---

## Webhook Verification

No webhooks in identity feature scope.

---

## Runtime Environment Verification

```
| Component | Env Dependency | Status | Notes |
|---|---|---|---|
| supabaseClient | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (inferred) | INFERRED PRESENT | Supabase client shared singleton — env validated at startup |
| setupVcsmIdentityEngine | None direct | PASS | Engine config is synchronous; no env vars consumed directly |
| debugLoginEvent / debugLoginError | @debuggers/identity | DEV-ONLY INFERRED | Debug module loaded conditionally; should not reach production |
```

**Setup.js Error Boundary Gap:**
`setupVcsmIdentityEngine()` calls `configureIdentityEngine(...)` without a try/catch. If the engine configuration throws at startup, the error propagates unhandled from `main.jsx`. No recovery path exists. If this fails silently in production (e.g., caught by a top-level boundary), the identity engine is unconfigured — all downstream identity resolution fails without a clear error surface.

Evidence Type: INFERRED | Confidence: HIGH

---

## Contract Drift Review

```
CONTRACT DRIFT REVIEW

| Contract | Expected Shape | Observed Shape | Drift |
|---|---|---|---|
| ensureVcsmPlatformBootstrap return | Formal model | { ok, userAppAccountId, error } inline convention | MINOR — no model file; shape defined by convention |
| refreshVcActorDirectory return | Formal model | { ok, error } inline convention | MINOR — no model file |
| dalProvisionVcsmIdentity return | Typed UUID string | Supabase rpc() data field (unguarded) | MINOR — no type guard on RPC response |
| identity.adapter.js exports | hooks + components only (VCSM rule) | hooks + controllers + components | MINOR-CRITICAL — adapter boundary drift; cross-ref ELEK-2026-06-05-005 |
```

**Adapter Contract Drift:**
`identity.adapter.js` exports `ensureVcsmPlatformBootstrap` and `refreshVcActorDirectory` as first-class public API. Per VCSM CLAUDE.md: "Adapters expose only: hooks, components, view screens." This is a contract drift from the adapter boundary rule. It means callers importing from the identity adapter receive controller functions with no hook wrapping — any session binding or ownership guards that might be added to the hook layer are bypassed.

---

## Observability Verification

```
OBSERVABILITY VERIFICATION

| Surface | Debug Events Present | Production Log Safety | Status |
|---|---|---|---|
| ensureVcsmPlatformBootstrap (failure) | YES — debugLoginEvent('PLATFORM_BOOTSTRAP_FAILED') | INFERRED SAFE (debugLoginEvent is @debuggers/identity — dev-only) | PASS |
| dalProvisionVcsmIdentity (error) | Error rethrown to controller | Controller catches and logs | PASS |
| refreshActorDirectoryRow (failure) | YES — debugLoginError('REFRESH_ACTOR_DIRECTORY_RPC_FAILED') | INFERRED SAFE | PASS |
| refreshVcActorDirectory (fire-and-forget) | Error logged in DAL layer | Callers do not surface failure to user | WATCH — silent failure to user |
| setupVcsmIdentityEngine (failure) | ABSENT — no try/catch, no debugLoginEvent | Unhandled propagation | WATCH — no observability on startup failure |
```

**Observability Gap:**
Fire-and-forget refresh failures are logged at the DAL layer but not surfaced to callers. If the actor_directory row becomes stale after a profile mutation, no alert mechanism exists at the feature level. This is consistent with the documented fire-and-forget design but creates a silent degradation path.

---

## HAWKEYE Verification Results

### HW-IDENT-001 — provision_vcsm_identity auth enforcement PARTIAL

```
HAWKEYE VERIFICATION RESULT

Finding ID:     HW-IDENT-001
Endpoint:       platform.provision_vcsm_identity
Type:           Auth Verification
Status:         PARTIAL
Evidence Type:  INFERRED
Confidence:     HIGH

Auth enforcement: Supabase session JWT attached automatically — anonymous calls rejected
at transport layer. App-layer ownership pre-check: ABSENT. No verification that actorId
belongs to userId before RPC call. DB-level enforcement: UNVERIFIED.

Cross-ref: ELEK-2026-06-05-003 (THOR BLOCKER — ELEKTRA confirms and proposes patch)
Handoff: ELEKTRA (patch advisory), DB (RPC ownership confirmation)
```

---

### HW-IDENT-002 — refresh_actor_directory_row fire-and-forget silent failure

```
HAWKEYE VERIFICATION RESULT

Finding ID:     HW-IDENT-002
Endpoint:       identity.refresh_actor_directory_row
Type:           Observability / Contract
Status:         WATCH
Evidence Type:  INFERRED
Confidence:     HIGH

Fire-and-forget contract: callers do not check or surface return value.
If RPC fails, actor_directory row is stale with no user-facing error.
Error is logged in DAL (debugLoginError) but not propagated to callers.
No retry mechanism. No alert or degraded-state indicator.

Cross-ref: VEN-IDENTITY-007 (actorId ownership), BW-IDENT-007 (no app-layer guard)
Handoff: LOKI (runtime trace of failure frequency), VENOM (ownership design review)
```

---

### HW-IDENT-003 — identity.adapter.js exports controller functions on public surface

```
HAWKEYE VERIFICATION RESULT

Finding ID:     HW-IDENT-003
Endpoint:       identity.adapter.js — ensureVcsmPlatformBootstrap, refreshVcActorDirectory exports
Type:           API Contract Drift
Status:         WATCH
Evidence Type:  OBSERVED (source read)
Confidence:     HIGH

identity.adapter.js:2-5 exports ensureVcsmPlatformBootstrap and refreshVcActorDirectory
from identityOps.adapter. These are controller functions, not hooks/components/screens.
VCSM rule: "Adapters expose only: hooks, components, view screens."
Result: any feature importing from identity.adapter receives raw controller access —
bypassing any ownership or session-binding wrapper that could be added at the hook layer.

Cross-ref: ELEK-2026-06-05-005 (MEDIUM — ELEKTRA patch proposed)
Handoff: ELEKTRA (patch advisory), VENOM (boundary re-verification post-patch)
```

---

### HW-IDENT-004 — Controller return shapes have no formal model contract

```
HAWKEYE VERIFICATION RESULT

Finding ID:     HW-IDENT-004
Endpoint:       ensureVcsmPlatformBootstrap return / refreshActorDirectoryRow return
Type:           Contract Drift
Status:         WATCH
Evidence Type:  INFERRED
Confidence:     MEDIUM

{ ok, userAppAccountId, error } and { ok, error } are informal conventions — no model
file defines these shapes. If the RPC return changes (e.g., provision_vcsm_identity
returns an object instead of a UUID), dalProvisionVcsmIdentity returns the object as
userAppAccountId with no type guard. Callers check ok but may not validate userAppAccountId
type.

Cross-ref: ARCHITECTURE.md module-completeness — "No model file for controller return shape"
Handoff: IRONMAN (formalize return shapes as model files)
```

---

### HW-IDENT-005 — Engine setup failure has no error boundary or observability

```
HAWKEYE VERIFICATION RESULT

Finding ID:     HW-IDENT-005
Endpoint:       setupVcsmIdentityEngine() startup call (setup.js)
Type:           Runtime Environment Verification
Status:         WATCH
Evidence Type:  INFERRED
Confidence:     MEDIUM

setup.js:20-45 calls configureIdentityEngine(...) without try/catch. If engine
configuration throws at app startup, the error propagates uncaught from main.jsx.
No debugLoginEvent for setup failure. No recovery path. All downstream identity
resolution would fail silently if the engine is misconfigured.

Handoff: LOKI (runtime trace for startup failure), Deadpool (root-cause if triggered)
```

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| HW-IDENT-001 | DB | Confirm provision_vcsm_identity RPC internal ownership check (auth.uid() = p_user_id) |
| HW-IDENT-001 | ELEKTRA | Patch advisory for app-layer ownership pre-check (ELEK-2026-06-05-003) |
| HW-IDENT-002 | LOKI | Trace fire-and-forget refresh failure frequency in runtime |
| HW-IDENT-002 | VENOM | Design review: should refresh failure block or alert the caller? |
| HW-IDENT-003 | ELEKTRA | Patch advisory (ELEK-2026-06-05-005) |
| HW-IDENT-003 | VENOM | Re-verify adapter boundary post-patch |
| HW-IDENT-004 | IRONMAN | Formalize return shapes as model files |
| HW-IDENT-005 | LOKI | Runtime observability on engine setup failure |
| HW-IDENT-005 | Deadpool | Root-cause trace if startup failure is encountered |

---

## Final HAWKEYE Status

**DEGRADED**

Reason: 2 PARTIAL auth verifications (JWT present, ownership absent on both write surfaces) and 3 WATCH contract/observability gaps. No CRITICAL auth-absent finding (JWT enforcement is confirmed via Supabase client). Auth ownership gaps are confirmed THOR blockers per ELEKTRA (ELEK-2026-06-05-003). HAWKEYE does not independently block release — ELEKTRA HIGH findings are the release gate.

HAWKEYE recommends: DB verification of provision_vcsm_identity RPC ownership enforcement before THOR gate review.

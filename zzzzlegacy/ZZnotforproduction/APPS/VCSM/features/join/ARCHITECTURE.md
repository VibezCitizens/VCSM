---
name: vcsm.join.architecture
description: ARCHITECT V2 module architecture report for VCSM:join
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** join
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/join
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The `join` feature handles the barbershop team-joining flow — the entry point through which a barber accepts a seat on a barbershop's staff roster. It supports two parallel invitation paths: a QR-code-based join (scanned from a physical or in-app QR, processed by `joinBarbershopQr.controller.js`) and an invite-link-based join (email/token flow processed by `joinBarbershopAccount.controller.js`). Both paths resolve to a single atomic write: `acceptJoinResourceDAL`, which updates a `resources` row in the `vport` schema from `pending_onboarding` to `linked`, gating the write on state and ownership assertions at the controller layer.

## OWNERSHIP

Owned by the VCSM Vport/Booking domain. The feature operates at the intersection of barbershop identity provisioning, QR token handling, auth bootstrapping, and resource state management. No external product consumes this module — it is internal to VCSM.

## ENTRY POINTS

- `/join/barbershop/:token` — the only route entry, rendered by `JoinBarbershopScreen.jsx`. The `token` param is an opaque resource UUID that resolves to either a QR-type or invite-type `resources` row in the `vport` schema.
- The screen is publicly reachable (the token is the authorization gate, not app auth); auth state is detected and branched by the hook.

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 5 | `joinInvite.dal.js`, `barberVport.read.dal.js`, `joinAuth.dal.js` |
| Model | 0 | None — no model/transformer layer present |
| Controller | 12 | `joinBarbershopQr.controller.js`, `joinBarbershopAccount.controller.js` |
| Service | N/A | — |
| Adapter | 0 | No adapter — cross-feature access via imported adapters from booking, auth, legal, vport, identity |
| Hook | 1 | `useJoinBarbershop.js` |
| Component | 4 | `JoinSignupForm.jsx`, `JoinLoginForm.jsx`, `JoinPrimitives.jsx`, `joinStyles.js` |
| Screen | 15 | `JoinBarbershopScreen.jsx` (single screen with multi-view state machine) |
| Barrel | 0 | No barrel/index exports |

Counts reflect callgraph (cg_layerCounts) values: controller=12, dal=5, hook=1, screen=15.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source clearly implements barbershop team join | BEHAVIOR.md is a placeholder stub only |
| Owner defined | PARTIAL | No IRONMAN ownership record; domain inferred from code | No formal ownership record |
| Entry points mapped | PASS | `/join/barbershop/:token` — `JoinBarbershopScreen.jsx` via `useParams` | Not in route-map scanner (0 routes in JSON); route likely registered in app router |
| Controllers present/delegated | PASS | 2 controllers (12 cg functions); both QR and invite paths covered | — |
| DAL/repository present/delegated | PASS | 5 DAL functions across 3 files; joinInvite, barberVport read, auth signup | No adapter boundary — DAL imported cross-feature from booking/auth/legal/vport |
| Models/transformers present | FAIL | 0 model files; raw Supabase rows used directly in hook and screen | Risk: shape drift if DB schema changes |
| Hooks/view models present | PASS | `useJoinBarbershop.js` — comprehensive view-state machine with VIEWS enum | — |
| Screens/components present | PASS | `JoinBarbershopScreen.jsx` + 4 sub-components | — |
| Services/adapters present | FAIL | No adapter file (`join.adapter.js`); module exposes no boundary | Other features cannot consume join without direct imports |
| Database objects mapped | PASS | `resources` table write (vport schema) confirmed; `profiles`, `profile_categories` reads mapped | — |
| Authorization path mapped | PASS | `assertActorOwnsVportActorController` called in both QR paths and invite accept paths before DAL write | — |
| Cache/runtime behavior mapped | PARTIAL | No React Query/SWR cache; hook manages local state only — suitable for low-frequency flow | Not explicitly documented |
| Error/loading/empty states mapped | PASS | VIEWS enum covers LOADING, ERROR, CHECK_EMAIL, RESUMING, ACCEPTED + all form states | — |
| Documentation linked | PARTIAL | BEHAVIOR.md present but is a stub placeholder — no behavior documented | BEHAVIOR.md must be populated |
| Tests/validation noted | PASS | 1 test file (`joinBarbershopQr.controller.test.js`) with 10 regression cases covering ELEK-001 guards | `joinBarbershopAccount.controller` has no tests |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | booking, identity, qr engines confirmed via scanner and source imports | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `engines/booking` | Engine | Inbound (via adapter) | YES — via `@/features/booking/adapters/booking.adapter` | `assertActorOwnsVportActorController` — ownership gate |
| `engines/identity` | Engine | Inbound (via adapter) | YES — via `@/features/identity/adapters/identity.adapter` | `useIdentity`, `useIdentityOps` |
| `engines/qr` | Engine | Declared by scanner | YES | QR token resolution assumed at router/deep-link layer |
| `features/auth` | Feature cross-dep | Inbound (via adapter) | YES — `@/features/auth/adapters/auth.adapter` | `useAuthOps`, `bootstrapJoinOnboardingController` |
| `features/vport` | Feature cross-dep | Inbound (via adapter) | YES — `@/features/vport/adapters/vport.public.adapter` | `useVportCoreOps` → `createVport` |
| `features/legal` | Feature cross-dep | Inbound (via adapter) | YES — `@/features/legal/adapters/legal.adapter` | `recordSignupConsent` |
| `vport.resources` | DB Table | Write | — | `acceptJoinResourceDAL` — atomic conditional update |
| `vport.profiles` | DB Table | Read | — | `barberVport.read.dal.js` reads profiles by owner_user_id + category |
| `vport.profile_categories` | DB Table | Read | — | `findBarberVportForUserDAL` joins profile_categories |
| `supabase.auth` | Auth service | Write | — | `signUpForInviteDAL` calls `supabase.auth.signUp` directly |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vport.resources` | UPDATE | Dashboard/Vport domain | join feature | Atomic conditional update guarded by `meta->>status = 'pending_onboarding'` AND `member_actor_id IS NULL` — replay-safe |
| `vport.profiles` | READ | Vport domain | `barberVport.read.dal.js` | Queries by `owner_user_id` — runs before actor provisioning, intentional |
| `vport.profile_categories` | READ | Vport domain | `barberVport.read.dal.js` | Joined with profiles to resolve primary barber VPORT |
| `supabase.auth` | WRITE | Auth service | `joinAuth.dal.js` | Signup with metadata embedding (`pending_invite_token`, `vport_name`, etc.) |
| `resources.meta` | READ+WRITE | join feature | controller layer | JSON column; status transitions: `pending_onboarding` → `linked` |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | `JoinBarbershopScreen` reads `token` from `useParams`; renders full state machine | Route registration not confirmed in scanner route-map — verify app router |
| Loading state | READY | `VIEWS.LOADING` and `VIEWS.RESUMING` render spinner with label | — |
| Empty state | READY | `VIEWS.ERROR` handles null/invalid token and expired/used resources | — |
| Error state | READY | All controllers throw typed errors; hook catches and sets `error` string; all views render error inline | — |
| Auth/owner gates | READY | `assertActorOwnsVportActorController` enforced before every DAL write in both flows; DAL-level conditional update as second guard (ELEK-001) | — |
| Cache behavior | N/A | No server cache; hook local state only — appropriate for one-time join flow | — |
| Runtime dependencies | READY | Depends on identity, auth, vport, booking, legal engines/features all via adapter boundary | Consent recording (`recordSignupConsent`) is non-blocking by design — failure is swallowed with dev warning |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/join/BEHAVIOR.md | PRESENT — PLACEHOLDER ONLY |
| Ownership record | — | MISSING |
| Security audit | ELEK-001 inline (controller + DAL comments) | PARTIAL — inline only, no formal audit doc |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a stub | HIGH | No documented happy paths, edge cases, or behavioral contract; new engineers have no reference | LOGAN |
| No model layer | MEDIUM | Raw Supabase rows (`resources`, `profiles`) passed directly to hook and screen; shape drift risk if DB schema changes | IRONMAN |
| No adapter file (`join.adapter.js`) | MEDIUM | Module has no public boundary; cannot be safely consumed by other features without direct imports | IRONMAN |
| `joinBarbershopAccount.controller.js` has no tests | MEDIUM | Invite path (signup, login, auto-resume, create-and-accept) untested; auth bootstrap path is high-risk | SPIDER-MAN |
| Route not in scanner route-map | LOW | Scanner shows 0 routes for join; `/join/barbershop/:token` must be verified in app router | HAWKEYE |
| No CURRENT_STATUS.md (pre-run) | LOW | Created this run | ARCHITECT |
| No ARCHITECTURE.md (pre-run) | LOW | Created this run | ARCHITECT |

---

## MODULE BOUNDARY WARNINGS

1. **`joinBarbershopAccount.controller.js` imports directly from `@/features/legal/adapters/legal.adapter`** — this is within policy (adapter boundary respected).
2. **`joinBarbershopAccount.controller.js` imports from `@/features/auth/adapters/auth.adapter`** — within policy.
3. **`joinBarbershopQr.controller.js` imports from `@/features/booking/adapters/booking.adapter`** — within policy.
4. **The `join` feature itself has no adapter file.** Any future feature needing to access join internals would have to import internal files directly. This is a boundary gap, not a current violation (no external consumers detected in static scan).
5. **`joinAuth.dal.js` calls `supabase.auth.signUp` directly** — this is a standard pattern for auth flows in VCSM; acceptable but should be noted as a direct auth surface.

---

## SPAGHETTI SCORE

**Module:** join
**Score:** CLEAN
**Reasons:** All cross-feature dependencies flow through adapter boundaries. Two well-separated controller files handle distinct flow types (QR vs. invite). Single hook aggregates both flows cleanly. DAL atomic guard (ELEK-001) prevents replay. No circular imports detected. The only structural gap is the missing adapter and model layer, which are design omissions rather than tangling.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavioral content; the file states "Behavior contract pending source review."

**Check A (Source without behavior):** FAIL — Source is complete and operational; BEHAVIOR.md has no content documenting it. The contract does not reflect reality.

**Check B (Behavior without source):** PASS — No behaviors are declared in BEHAVIOR.md, so there are no ghost behaviors (behaviors documented but not implemented).

**Check C (Engine consistency):** PASS — Scanner declares engines: `booking`, `identity`, `qr`. Source imports confirm booking (via `assertActorOwnsVportActorController`), identity (via `useIdentity`, `useIdentityOps`), and auth (supabase.auth). QR engine involvement is at the router/deep-link layer and token format level rather than a direct import in this module.

**Check D (Data change consistency):** PASS — Scanner declares one write surface: `UPDATE resources` via `acceptJoinResourceDAL`. Source confirms this is the sole mutation path in both controllers. The DAL enforces conditional update (`meta->>status = 'pending_onboarding'` AND `member_actor_id IS NULL`).

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Populate BEHAVIOR.md with actual behavioral contract | Governance gap — module is fully operational but undocumented; blocks onboarding, security review, and THOR eligibility | LOGAN |
| P2 | Add tests for `joinBarbershopAccount.controller.js` | High-risk path (auth bootstrap, consent recording, auto-resume) has zero test coverage | SPIDER-MAN |
| P3 | Add model layer for resource and profile shapes | Protects against DB shape drift on `resources.meta` JSON column and profile reads | IRONMAN |
| P4 | Create `join.adapter.js` with public boundary | Enables safe external consumption and completes module encapsulation | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — populate BEHAVIOR.md with actual behavioral contract (two paths: QR and invite)
- **SPIDER-MAN** — add regression tests for `joinBarbershopAccount.controller.js` invite flow
- **IRONMAN** — model layer and adapter file gap; route registration verification
- **HAWKEYE** — confirm `/join/barbershop/:token` is registered in the app router and that token validation at the route layer is correct
- **VENOM** — `joinAuth.dal.js` writes directly to `supabase.auth.signUp` with metadata embedding; verify auth metadata fields cannot be spoofed or replayed at the platform level

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |

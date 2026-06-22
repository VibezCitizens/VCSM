# VENOM SECURITY AUDIT — Gas Prices Module

**Date:** 2026-05-27  
**Reviewer:** VENOM  
**Trigger:** ARCHITECT deep scan flagged 4 new issues; full security chain requested (ARCHITECT → VENOM → BlackWidow → ELEKTRA)  
**Application Scope:** VCSM  
**Module:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/`  
**Files Reviewed:** 37 (full module — all DAL, model, controller, hook, component, screen files)  
**Prior VENOM Session:** 2026-05-25/26 — F-001 through F-010 resolved; all ownership gates in place  

**Findings:** 0 CRITICAL | 0 HIGH | 3 MEDIUM | 3 LOW

---

## VENOM TARGET

**Feature / Route / Engine:** Gas Prices module — citizen submission + owner review + feed publish  
**Primary trust boundary:** Authenticated Citizen → VPORT Owner escalation (citizen suggest vs. owner direct-write)

---

## SECURITY SURFACE

| Entry Point | Auth | Authorization Layer | Sensitive Objects |
|---|---|---|---|
| `/actor/:actorId/gas` | `useIdentity()` | None (read-only public view) | `fuel_prices`, `fuel_price_submissions` (pending) |
| `/actor/:actorId/dashboard/gas` | `useIdentity()` | `OwnerOnlyDashboardGuard` + `checkVportOwnershipController` | All gas tables |
| Submit suggestion (citizen) | actorId from identity | Presence check + sanity bounds only | `fuel_price_submissions` |
| Submit suggestion (owner path) | actorId from identity | `checkVportOwnershipController` → `actor_owners` ✓ | `fuel_prices`, `fuel_price_history` |
| Review suggestion | `decidedByActorId` | `checkVportOwnershipController` → `actor_owners` ✓ | `fuel_price_submission_reviews`, `fuel_prices` |
| Unit toggle | `actorId` + `targetActorId` | `checkVportOwnershipController` → `actor_owners` ✓ | `fuel_prices` (unit column) |
| Feed publish | `actorId` | `checkVportOwnershipController` (self-check) + throttle ✓ | `vc.posts` |

---

## TRUST BOUNDARY TRACE

| Path | Client Input Trusted? | Server Gate | Notes |
|---|---|---|---|
| Citizen submit fuelKey | YES — presence only | None | ⚠️ No whitelist |
| Citizen submit proposedPrice | Partially — isFinite() check | Sanity bounds from settings | ✓ |
| Citizen submit evidence | YES — any JSON | None | ⚠️ Unvalidated JSONB |
| Owner submit (ownerUpdate=true) | Routed by client-side isOwner | `checkVportOwnershipController` ✓ | ⚠️ Co-owner routing bug |
| Review submissionId | YES | Fetched fresh from DB | ✓ profile_id from DB, not caller |
| Feed publish fuelKey | YES | FUEL_LABELS whitelist ✓ | ✓ |
| Unit value | YES | ALLOWED_UNITS whitelist ✓ | ✓ |

---

## VENOM SECURITY FINDINGS

---

### VENOM SECURITY FINDING F-001

- **Finding ID:** VENOM-GAS-F-001
- **Location:** `hooks/useSubmitFuelPriceSuggestion.js` lines 24–29, 58
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated VPORT Owner (co-owner case)
- **Boundary Violated:** Co-owner actor silently downgraded to Authenticated Citizen
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:**
  ```js
  const isOwner = useMemo(() =>
    Boolean(me?.actorId) && Boolean(targetActorId) &&
    String(me.actorId) === String(targetActorId),
    [me, targetActorId]
  );
  // ...
  ownerUpdate: isOwner  // forwarded to controller
  ```
  `isOwner` evaluates to `true` only when calling actorId === targetActorId. Co-owners (actors who appear in `actor_owners` for a VPORT but with a different actorId) always get `isOwner: false`, and their submissions enter the citizen queue regardless of their actual DB-verified ownership.
- **Risk:** Co-owners of a gas station VPORT cannot update official prices directly. Their updates enter the community suggestion queue and require review (potentially by themselves). The server-side gate is correct and would approve them — but they never reach it with `ownerUpdate: true`.
- **Severity:** MEDIUM
- **Exploitability:** LOW — not an upward escalation; a downward degradation. No privilege gain possible.
- **Attack Preconditions:** Authenticated co-owner of a VPORT with actorId ≠ VPORT's targetActorId.
- **Blast Radius:** Affects all co-owned gas station VPORTs with multi-owner setup.
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — server gate holds; this is hook routing error only
- **Why it matters:** VCSM's ownership model is `actor_owners`-based and multi-owner by design. The hook's client-side shortcut breaks this for any owner who is not the primary VPORT actor.
- **Recommended mitigation:** Remove the client-side `isOwner` comparison. Always send `ownerUpdate: false` from the hook. Let `checkVportOwnershipController` in the controller determine whether the caller is an owner. The controller already handles both paths correctly — the hook's check is redundant and harmful.
- **Rationale:** Client-side authority is not a trust gate. The server gate is the correct location. Removing the client-side check strengthens — not weakens — security posture.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING F-002

- **Finding ID:** VENOM-GAS-F-002
- **Location:** `controller/submitFuelPriceSuggestion.controller.js` citizen path (lines 123–160); `dal/vportFuelPriceSubmissions.write.dal.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** No volume constraint on citizen write path
- **Contract Violated:** Security and Risk Management (operational DoS risk)
- **Current behavior:** No rate limiting, no per-actor dedup window, no max-pending-per-actor-per-station constraint on citizen submissions. Any authenticated citizen can submit unlimited price suggestions to any gas station in rapid succession. Only the feed post path has a 1-hour dedup window (unrelated to submissions).
- **Risk:** A single authenticated actor can flood the `fuel_price_submissions` table for any target VPORT, polluting the owner's review queue and degrading the community suggestion feature. The 30s pending submissions cache provides no write-side protection.
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - Authenticated citizen account required
  - Target VPORT actorId known (public — appears in URLs)
  - fuelKey guessable (standard: regular, midgrade, premium, diesel)
- **Blast Radius:** Single VPORT — targeted station's owner review queue; no cross-station impact
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** REQUIRED — RLS on `fuel_price_submissions` should limit INSERT volume per policy; unverified whether any such constraint exists
- **Why it matters:** The community suggestion feature depends on trust that the submission queue reflects genuine citizen activity. Uncapped insert volume undermines this.
- **Recommended mitigation:**
  Option A (application layer): In `submitFuelPriceSuggestion.controller.js`, before calling `createFuelPriceSubmissionDAL`, check if the calling actor already has a `pending` submission for this `(targetActorId, fuelKey)` combination. If so, return `{ ok: false, reason: "already_pending" }`.
  Option B (DB layer): Add a UNIQUE constraint or partial index on `fuel_price_submissions(profile_id, fuel_key, submitted_by_actor_id)` WHERE `status = 'pending'` — one pending per actor per fuel per station at a time.
- **Rationale:** The dedup-one-pending-per-actor pattern is the minimal viable rate limit. It matches the semantic intent of community suggestions (one vote per citizen per fuel type) without requiring a rate-limiting infrastructure.
- **Follow-up command:** Wolverine / Carnage (DB constraint option)
- **CISSP Domain:**
  - Primary: Security and Risk Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING F-003

- **Finding ID:** VENOM-GAS-F-003
- **Location:** `controller/submitFuelPriceSuggestion.controller.js` line 47; `controller/reviewFuelPriceSuggestion.controller.js` line 26; `dal/vportFuelPriceSubmissions.write.dal.js` line 30; `dal/vportFuelPrices.write.dal.js` line 34
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Trust Boundary:** Authenticated Citizen, Authenticated VPORT Owner
- **Boundary Violated:** fuelKey accepted without domain enum validation
- **Contract Violated:** Asset Security (data integrity of official prices table)
- **Current behavior:**
  ```js
  if (!fuelKey) throw new Error("fuelKey required");
  // No enum/whitelist check follows
  ```
  Any non-empty string is accepted as `fuelKey` and stored in `vport.fuel_price_submissions.fuel_key` and `vport.fuel_prices.fuel_key`. The `publishFuelPriceUpdateAsPost` controller has a `FUEL_LABELS` whitelist, but that is applied downstream for feed post text generation only — it does not gate what enters the DB.
- **Risk:** Arbitrary fuelKey values pollute the official prices table (`vport.fuel_prices`). Since `fuel_prices` uses `(profile_id, fuel_key)` as the UPSERT conflict key, a junk fuelKey creates a permanent row that cannot be cleared by the normal owner update flow. These rows surface in the public gas prices display via `resolveFuelKeys()` and would appear as unexplained fuel types on the station's profile page.
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - Authenticated account required
  - Direct API call or hook manipulation to pass non-standard fuelKey
  - Standard UI restricts to 4 default fuel keys but this is a UI-only constraint
- **Blast Radius:** Single VPORT — official prices display + community submission queue
- **Identity Leak Type:** None
- **Cache Trust Type:** Public-profile-sensitive — official prices with junk fuel keys are cached 60s and displayed publicly to all viewers
- **RLS Dependency:** UNVERIFIED — no CHECK constraint on `fuel_key` column confirmed
- **Why it matters:** The official prices table is public-facing. Garbage fuelKey rows will appear in every visitor's gas prices view for the affected station. The cache means they persist for up to 60 seconds after creation. Owner cannot remove them without direct DB access.
- **Recommended mitigation:**
  Extract the `FUEL_LABELS` constant from `publishFuelPriceUpdateAsPost.controller.js` to `model/gasPrices.model.js` as `ALLOWED_FUEL_KEYS`:
  ```js
  export const ALLOWED_FUEL_KEYS = new Set(["regular", "midgrade", "premium", "diesel", "e85", "kerosene"]);
  ```
  Add validation in both `submitFuelPriceSuggestion.controller.js` and the owner-path DAL calls:
  ```js
  if (!ALLOWED_FUEL_KEYS.has(fuelKey)) return { ok: false, reason: "invalid_fuel_key" };
  ```
  Add a DB CHECK constraint via Carnage: `fuel_key IN ('regular', 'midgrade', 'premium', 'diesel', 'e85', 'kerosene')` on both `fuel_prices` and `fuel_price_submissions`.
- **Rationale:** `fuelKey` is a domain enum. It should be validated as one at every trust boundary — controller layer and DB layer.
- **Follow-up command:** Wolverine / Carnage
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Asset Security

---

### VENOM SECURITY FINDING F-004

- **Finding ID:** VENOM-GAS-F-004
- **Location:** `dal/vportFuelPriceSubmissions.write.dal.js` line 26; `controller/submitFuelPriceSuggestion.controller.js` line 36
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Unvalidated arbitrary JSON persisted to DB
- **Contract Violated:** Asset Security
- **Current behavior:**
  ```js
  evidence = {},  // caller can pass any JSON object
  ```
  The `evidence` field accepts arbitrary JSON and stores it in `vport.fuel_price_submissions.evidence` (JSONB). The current UI always passes `evidence: {}` (empty default). No schema validation exists in the controller.
- **Risk:** Forward-looking risk. If any future code renders `evidence` content without proper React escaping (e.g., using `dangerouslySetInnerHTML` for rich content), stored malicious JSON from a current submission could trigger XSS. Currently no evidence rendering exists in any component. Low immediate impact.
- **Severity:** LOW
- **Exploitability:** LOW — requires future UI change to be exploitable
- **Attack Preconditions:** Attacker stores crafted JSON now; future UI renders it unsafely.
- **Blast Radius:** Single VPORT — owner review queue only
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Open-ended JSONB fields accepted without validation create technical debt with a security tail. Closing the surface now prevents a future incident.
- **Recommended mitigation:** Either (a) remove `evidence` from the submission create path if it is not used (preferred — the UI never passes it), or (b) define and enforce a strict schema: `{ photoUrl?: string, notes?: string }` with key and value type validation in the controller before DAL call.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Asset Security

---

### VENOM SECURITY FINDING F-005

- **Finding ID:** VENOM-GAS-F-005
- **Location:** 9 files — `hooks/useVportGasPrices.js:1`, `hooks/useSubmitFuelPriceSuggestion.js:1`, `hooks/useOwnerPendingSuggestions.js:1`, `components/FuelPriceRow.jsx:1`, `components/GasStates.jsx:1`, `components/OwnerPendingSuggestionsList.jsx:1`, `components/OwnerSuggestionReviewCard.jsx:1`, `screens/VportGasPricesScreen.jsx:1`, `screens/VportGasPricesView.jsx:1`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (source only)
- **Trust Boundary:** N/A
- **Boundary Violated:** None at runtime
- **Contract Violated:** None
- **Current behavior:** All 9 files begin with `// C:\Users\trest\OneDrive\Desktop\VCSM\src\...` Windows path comments.
- **Risk:** Leaks developer username `trest` and file system structure. If source maps are enabled in a production bundle, these comments appear in the distributed artifact. Minor OSINT/social engineering surface.
- **Severity:** LOW
- **Exploitability:** LOW
- **Attack Preconditions:** Source maps in production build.
- **Blast Radius:** Source artifact only
- **Identity Leak Type:** None (developer machine identity)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Standard source hygiene. Dev machine paths should not ship in any production artifact.
- **Recommended mitigation:** Remove all 9 stale path comments from line 1 of each file.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Asset Security

---

### VENOM SECURITY FINDING F-006

- **Finding ID:** VENOM-GAS-F-006
- **Location:** `components/BulkUpdateFuelPricesModal.jsx:103`; `screens/VportGasPricesView.jsx:89`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated Citizen, Authenticated VPORT Owner
- **Boundary Violated:** Server error messages surfaced to UI without sanitization
- **Contract Violated:** Asset Security (information minimization)
- **Current behavior:**
  ```jsx
  {String(error?.message ?? error)}     // BulkUpdateFuelPricesModal
  {String(submitError?.message ?? submitError)}  // VportGasPricesView
  ```
  Raw error message strings from controller throws and Supabase DB errors are rendered directly in the UI.
- **Risk:** Postgres error messages (e.g., constraint violations, policy errors) may include table names, column names, or constraint names. Currently visible developer guard messages: `"targetActorId required"`, `"profile not found for actor"`. If a DB-level error escapes the catch, it would surface constraint/schema details.
- **Severity:** LOW
- **Exploitability:** LOW — error triggers require malformed requests; no direct exploit
- **Blast Radius:** Single user session — visible only to the requesting actor
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** User-facing error text should never contain internal implementation details. Map known `reason` values to user-friendly strings at the hook or component layer.
- **Recommended mitigation:**
  Map known error reasons to user-friendly text:
  ```js
  const ERROR_MESSAGES = {
    not_owner: "You don't have permission to update this station.",
    out_of_range: "Price is outside the allowed range.",
    too_far_from_official: "Price differs too much from the official price.",
    profile_not_found: "Station is not set up yet.",
  };
  const displayError = ERROR_MESSAGES[error?.reason] ?? "Something went wrong. Please try again.";
  ```
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Software Development Security

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| F-001 Client-side isOwner | Co-owner downgraded to citizen path | Hook | P1 | App | Wolverine |
| F-002 No submission rate limiting | Submission spam / review queue DoS | Controller + DB | P1 | App / DB | Wolverine / Carnage |
| F-003 fuelKey not whitelisted | Data pollution in official prices table | Controller (+ DB CHECK) | P1 | App / DB | Wolverine / Carnage |
| F-004 evidence unvalidated JSON | Forward-looking rendering risk | Controller / DAL | P2 | App | Wolverine |
| F-005 Windows path comments | Dev path in source | Source files | P3 | App | Wolverine |
| F-006 Raw error messages | Internal detail leakage | Hook / Component | P3 | App | Wolverine |

---

## UNCHANGED SECURITY STATUS — PRIOR FINDINGS

All prior VENOM findings (F-001 through F-010 from sessions 2026-05-25/26) remain RESOLVED:
- All 5 controllers use `checkVportOwnershipController` via `actor_owners` ✓
- RLS policies deployed on `fuel_price_submissions` ✓
- Table GRANTs deployed ✓
- `PUBLIC_REALM_ID` from constant, not user input ✓
- `post_type` hardcoded in `createSystemPost` call ✓
- `resolveActorIdFromProfileId` in read DAL (not write DAL) ✓
- Feed post throttle 1-hour dedup window ✓
- Price sanity validation (min/max/delta bounds) ✓
- FUEL_LABELS whitelist on feed post path ✓

---

## OVERALL SECURITY POSTURE

**Status: MOSTLY HARDENED**

Prior sessions closed all critical auth and ownership gates. This session identified 3 MEDIUM gaps — none create exploitable privilege escalation, but two (F-002, F-003) affect data integrity in a public-facing table. F-001 affects co-owner functionality correctness.

**No release blockers.** Server-side gates hold on all privileged write paths.

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | F-002 — no rate limiting creates operational risk |
| Asset Security | 4 | F-003 data pollution, F-004 evidence JSONB, F-005 path comments, F-006 error messages |
| Security Architecture and Engineering | 0 | Defense-in-depth intact; all server gates hold ✓ |
| Communication and Network Security | 0 | No custom endpoints; not applicable to this module |
| Identity and Access Management | 1 | F-001 — client-side isOwner breaks co-owner routing |
| Security Assessment and Testing | 1 | Zero confirmed test coverage on auth paths |
| Security Operations | 1 | F-005 — dev machine path leakage in source files |
| Software Development Security | 4 | F-001 through F-004 all have software development root causes |

**Uncovered domains:**
- Communication and Network Security — out of scope; module has no custom endpoints or RPCs
- Security Architecture and Engineering — system design sound this pass; all server gates verified ✓

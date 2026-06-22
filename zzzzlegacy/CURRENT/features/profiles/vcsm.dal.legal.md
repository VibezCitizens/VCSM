# VCSM DAL — `legal`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/legal/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 4 |
| Exported functions | 5 |
| Tables accessed | 1 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `getPublicIp.dal.js`

**Path:** `features/legal/dal/getPublicIp.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `getPublicIp` | `unknown` | — |

### `legalDocuments.read.dal.js`

**Path:** `features/legal/dal/legalDocuments.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalGetActiveLegalDocuments` | `read` | — |
| `dalGetLegalDocument` | `read` | — |

### `userConsents.read.dal.js`

**Path:** `features/legal/dal/userConsents.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalGetUserConsents` | `read` | `user_consents` |

### `userConsents.write.dal.js`

**Path:** `features/legal/dal/userConsents.write.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `dalRecordLegalAcceptance` | `read` · `insert` | `user_consents` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `user_consents` | INSERT, READ | `dalGetUserConsents`, `dalRecordLegalAcceptance` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `getPublicIp.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `legalDocuments.read.dal.js`

**Direct callers:**

- `legalConsent.controller.js` _Controller_
- `legalDocument.controller.js` _Controller_

**Full call chain to screen:**

```
`legalDocuments.read.dal.js` → `legalDocument.controller.js` → `useLegalDocument.js` → `LegalDocumentScreen.jsx`
```
```
`legalDocuments.read.dal.js` → `legalConsent.controller.js` → `legal.adapter.js` → `useRegister.js` → `RegisterScreen.jsx`
```

### `userConsents.read.dal.js`

**Direct callers:**

- `legalConsent.controller.js` _Controller_

**Full call chain to screen:**

```
`userConsents.read.dal.js` → `legalConsent.controller.js` → `legal.adapter.js` → `useRegister.js` → `RegisterScreen.jsx`
```

### `userConsents.write.dal.js`

**Direct callers:**

- `legalConsent.controller.js` _Controller_

**Full call chain to screen:**

```
`userConsents.write.dal.js` → `legalConsent.controller.js` → `legal.adapter.js` → `useRegister.js` → `RegisterScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✗ MISSING | — |
| **Controller** | ✓ PRESENT | `legalConsent.controller.js`, `legalDocument.controller.js` |
| **Adapter** | ✓ PRESENT | `legal.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `userConsents.read.dal.js`, `userConsents.write.dal.js`, `useLegalConsent.js`, `useLegalDocument.js`, `useSignupConsent.js` |
| **Component** | ✗ MISSING | — |
| **View Screen** | ✓ PRESENT | `AboutView.jsx`, `ContactView.jsx` |
| **Final Screen** | ✓ PRESENT | `AboutScreen.jsx`, `ConsentGateScreen.jsx`, `ContactScreen.jsx`, `HowToCreateProfileScreen.jsx`, `HowToCreateVportScreen.jsx`, `LegalDocumentScreen.jsx` +1 more |

### Controller

_Business rules, ownership, permissions — no React_

- `features/legal/controllers/legalConsent.controller.js`
- `features/legal/controllers/legalDocument.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/legal/adapters/legal.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/legal/dal/userConsents.read.dal.js`
- `features/legal/dal/userConsents.write.dal.js`
- `features/legal/hooks/useLegalConsent.js`
- `features/legal/hooks/useLegalDocument.js`
- `features/legal/hooks/useSignupConsent.js`

### View Screen

_Hooks + component composition — no business logic_

- `features/legal/screens/AboutView.jsx`
- `features/legal/screens/ContactView.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/legal/screens/AboutScreen.jsx`
- `features/legal/screens/ConsentGateScreen.jsx`
- `features/legal/screens/ContactScreen.jsx`
- `features/legal/screens/HowToCreateProfileScreen.jsx`
- `features/legal/screens/HowToCreateVportScreen.jsx`
- `features/legal/screens/LegalDocumentScreen.jsx`
- `features/legal/screens/VportCategoryLandingScreen.jsx`

### Missing Layers

- 🔴 **Model** — not detected in static scan
- 🟡 **Service** — not detected in static scan
- 🟡 **Component** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`  
_Auditor:_ ARCHITECT

---

### Verdict: 1 Confirmed Dead Function — Intentionally Retained

| Function | Status | Evidence |
|---|---|---|
| `getPublicIp` | CONFIRMED DEAD — intentionally retained as reference | Self-documented; zero import references in `apps/VCSM/src/` |
| `dalGetActiveLegalDocuments` | LIVE | `legalConsent.controller.js` line 21 |
| `dalGetLegalDocument` | LIVE | `legalDocument.controller.js` line 4 |
| `dalGetUserConsents` | LIVE | `legalConsent.controller.js` line 51 |
| `dalRecordLegalAcceptance` | LIVE | `legalConsent.controller.js` line 105 |

---

### Dead Code Finding #1 — `getPublicIp.dal.js`

**File:** `features/legal/dal/getPublicIp.dal.js`  
**Function:** `getPublicIp`  
**Classification:** CONFIRMED DEAD — self-documented, intentionally retained as reference  

**Evidence:**
- Zero import references found anywhere in `apps/VCSM/src/`
- The file opens with an explicit inline comment:
  > *"NOT CALLED — this file is retained for reference only. Client-side IP fetching is not suitable for legal consent records because the returned IP is client-controlled and not server-authoritative. IP capture must be moved to a server-side path (Supabase Edge Function). See: Carnage task — consent write Edge Function with server-side IP capture."*
- `dalRecordLegalAcceptance` in `userConsents.write.dal.js` independently confirms the decision: `ip_address` is intentionally omitted from the consent insert with the same server-side capture rationale

**Design decision verified:** The `ip_address` field is excluded from all client-side consent writes by design. Server-authoritative IP capture is deferred to a future Supabase Edge Function (open Carnage task).

**Risk:** LOW — no runtime harm. File is intentionally inert.  
**Recommended action:** KEEP as reference until the Edge Function Carnage task is executed. At that point, replace with the Edge Function implementation and delete this file.  
**Handoffs:** CARNAGE (Edge Function task for server-side IP capture on consent writes)

---

### Structural Finding #1 — DAL files misclassified as Hooks in Architecture Pipeline

**Location:** Architecture Pipeline table, Hook row  
**Classification:** DOC INACCURACY — layer misclassification  

**Evidence:**
The Hook layer row incorrectly lists two DAL files:
- `features/legal/dal/userConsents.read.dal.js`
- `features/legal/dal/userConsents.write.dal.js`

These are DAL files. They belong only in the DAL section. The actual hooks are:
- `features/legal/hooks/useLegalConsent.js`
- `features/legal/hooks/useLegalDocument.js`
- `features/legal/hooks/useSignupConsent.js`

**Risk:** LOW — no runtime impact. Misleads readers about layer boundaries.  
**Recommended action:** Remove the two DAL filenames from the Hook row in the Architecture Pipeline table.  
**Handoffs:** LOGAN (doc correction)

---

### Design Note — `userId` scoping on `platform.user_consents`

Both `dalGetUserConsents` and `dalRecordLegalAcceptance` scope by `userId` (auth user UUID), not `actorId`. This is **correct and intentional** — `user_consents` lives in the `platform` schema and is a pre-actor system record (consent may be recorded before actor provisioning completes, e.g. at signup). This is not an identity contract violation.

Additionally:
- `accepted_at` uses `DB DEFAULT now()` — no client time injection
- `ip_address` is excluded — must be captured server-side (see Dead Code Finding #1)
- `user_agent` and `locale` are informational only

The legal DAL consent write is well-designed for a client boundary.

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| `getPublicIp` — dead, intentionally retained, Carnage task pending | CONFIRMED DEAD (kept by design) | P2 — delete when Edge Function ships |
| `userConsents.read/write.dal.js` listed as Hooks in Architecture Pipeline | DOC INACCURACY | P3 |

**Confirmed dead functions:** 1 (`getPublicIp` — retained by design)  
**Doc function count:** ACCURATE (5 — all referenced or intentionally retained)  
**Open dependency:** CARNAGE — server-side consent IP capture Edge Function

---

## Layer Consumer Map

_Audited:_ 2026-05-11  
_Method:_ Static import trace — full upward traversal from each DAL file through Controller → Engine → Hook → Adapter → Screen → Route  
_Auditor:_ ARCHITECT

---

### DAL → Controller

| DAL File | Function | Controller That Imports It |
|---|---|---|
| `legalDocuments.read.dal.js` | `dalGetActiveLegalDocuments` | `legalConsent.controller.js` |
| `legalDocuments.read.dal.js` | `dalGetLegalDocument` | `legalDocument.controller.js` |
| `userConsents.read.dal.js` | `dalGetUserConsents` | `legalConsent.controller.js` |
| `userConsents.write.dal.js` | `dalRecordLegalAcceptance` | `legalConsent.controller.js` |
| `getPublicIp.dal.js` | `getPublicIp` | _(none — intentionally dead, retained as reference)_ |

---

### Controller → Engine (internal)

`legalConsent.controller.js` uses an internal compliance engine before calling any DAL write:

| Controller | Engine | Function Used |
|---|---|---|
| `legalConsent.controller.js` | `features/legal/engine/legalCompliance.engine.js` | `buildConsentComplianceStatus({ activeDocs, userConsents })` |

`legalCompliance.engine.js` is a pure computation file — it receives active documents and existing user consents and returns a compliance status object (what is required, what is pending, whether all accepted). It has no DB access. It is consumed **only** by `legalConsent.controller.js` — no other file imports it.

---

### Controller → Hook

| Controller | Hook That Imports It | Functions Used |
|---|---|---|
| `legalConsent.controller.js` | `useLegalConsent.js` | Multiple controller functions (consent status, accept flow) |
| `legalConsent.controller.js` | `useSignupConsent.js` | `recordSignupConsent` |
| `legalDocument.controller.js` | `useLegalDocument.js` | `getLegalDocumentController` |

---

### Adapter Surface (`legal.adapter.js`)

The adapter bundles four exports for cross-feature consumption:

| Export | Source | Type | Notes |
|---|---|---|---|
| `useSignupConsent` | `hooks/useSignupConsent.js` | Hook | For React callers needing to record signup consent |
| `useLegalConsent` | `hooks/useLegalConsent.js` | Hook | Consent gate check — consumed by `ProtectedRoute.jsx` |
| `ConsentGateScreen` | `screens/ConsentGateScreen.jsx` | Screen | Re-exported directly — used as a gate component inside `ProtectedRoute.jsx` |
| `recordSignupConsent` | `controllers/legalConsent.controller.js` | Controller function | Explicitly for non-React callers (documented inline) — consumed by `joinBarbershopAccount.controller.js` |

The adapter comment on `recordSignupConsent` reads:
> *"Controller function exported for cross-feature callers (e.g. join controller) that cannot use React hooks but need to record signup consent at account creation time."*

This is a well-documented, intentional adapter pattern for mixing hook and non-hook consumers.

---

### Hook → Screen

| Hook | Screen / Consumer | Path |
|---|---|---|
| `useLegalConsent.js` | `ProtectedRoute.jsx` (app guard) | Every authenticated user passes through this guard — consent status checked on every protected route render |
| `useLegalDocument.js` | `LegalDocumentScreen.jsx` | Direct — hook drives the screen's document fetch |
| `useSignupConsent.js` | `useRegister.js` (auth hook) → `RegisterScreen.jsx` | Cross-feature — `useRegister` consumes it via adapter |

---

### Cross-Feature Consumers (via Adapter)

| Consumer | Feature | What It Uses | Call Context |
|---|---|---|---|
| `ProtectedRoute.jsx` | `app/guards/` | `useLegalConsent` + `ConsentGateScreen` | Renders `ConsentGateScreen` when consent is required — blocks access to all protected routes until accepted |
| `useRegister.js` | `auth` | `useSignupConsent` (via adapter) | Calls `recordSignupConsent` after successful signup on `RegisterScreen` |
| `joinBarbershopAccount.controller.js` | `join` | `recordSignupConsent` (bare function via adapter) | Calls on account creation during barbershop join flow (fire-and-forget, error swallowed in dev) |

---

### Screen → Route

| Screen | Route Registration | Path |
|---|---|---|
| `LegalDocumentScreen.jsx` | `legal.routes.jsx` → `lazyPublic.jsx` | Public |
| `AboutScreen.jsx` | `about.routes.jsx` → `lazyPublic.jsx` | Public |
| `ContactScreen.jsx` | `contact.routes.jsx` → `lazyPublic.jsx` | Public |
| `HowToCreateProfileScreen.jsx` | `howto.routes.jsx` → `lazyPublic.jsx` | Public |
| `HowToCreateVportScreen.jsx` | `howto.routes.jsx` → `lazyPublic.jsx` | Public |
| `VportCategoryLandingScreen.jsx` | `howto.routes.jsx` → `lazyPublic.jsx` | Public |
| `ConsentGateScreen.jsx` | **Not a standalone route** — rendered inside `ProtectedRoute.jsx` as a conditional gate | Embedded in app guard |

`ConsentGateScreen` is the only legal screen without its own route. It is injected by the app-level guard and appears inline when the authenticated session requires pending consent actions. It is not navigable directly.

---

### Model Layer

No model files found in `features/legal/`. However, the feature has an **engine** that serves the model role:

| File | Role |
|---|---|
| `features/legal/engine/legalCompliance.engine.js` | Pure computation — builds compliance status from active docs + user consents. No DB access, no side effects. Functions as a domain model layer. |

The Architecture Pipeline marks Model as MISSING — this is technically correct (no `*.model.js` file), but `legalCompliance.engine.js` fills the same role. The pipeline scan did not detect it because it uses `.engine.js` naming.

---

### Additional Files Detected (Not in Pipeline)

| File | Type | Role |
|---|---|---|
| `legal/docs/AgeVerificationContent.jsx` | Component | Static age verification content rendered inside `LegalDocumentScreen` or `ConsentGateScreen` |
| `legal/docs/PrivacyPolicyContent.jsx` | Component | Static privacy policy content |
| `legal/docs/TermsOfServiceContent.jsx` | Component | Static terms of service content |
| `legal/config/vportLandingContent.js` | Config | Content config for `VportCategoryLandingScreen` |
| `legal/screens/components/ProfilePhonePreview.jsx` | Component | Visual preview used in how-to screens |
| `legal/screens/components/howToProfileContent.js` | Config | Content data for how-to profile screen |

These files were not detected by the Architecture Pipeline scanner. The Component layer is not MISSING — it exists in `legal/docs/` and `legal/screens/components/`.

---

### Full Call Chain Summary

**Consent gate (affects every protected route):**
```
dalGetActiveLegalDocuments + dalGetUserConsents + dalRecordLegalAcceptance
  → legalConsent.controller.js (+ legalCompliance.engine.js for status)
    → useLegalConsent.js
      → legal.adapter.js
        → ProtectedRoute.jsx (app guard — wraps ALL protected routes)
          → ConsentGateScreen.jsx (rendered inline when consent pending)
```

**Signup consent (new user registration):**
```
dalRecordLegalAcceptance
  → legalConsent.controller.js
    → useSignupConsent.js
      → legal.adapter.js
        → useRegister.js (auth feature)
          → RegisterScreen.jsx
```

**Signup consent (barbershop join — non-hook path):**
```
dalRecordLegalAcceptance
  → legalConsent.controller.js (recordSignupConsent bare function)
    → legal.adapter.js
      → joinBarbershopAccount.controller.js (join feature — currently UNROUTED)
```

**Legal document viewer:**
```
dalGetLegalDocument
  → legalDocument.controller.js
    → useLegalDocument.js
      → LegalDocumentScreen.jsx
        → legal.routes.jsx (public)
```

---

### Architecture Pipeline — Corrected

| Layer | Actual Status | Notes |
|---|---|---|
| DAL | PRESENT | 4 files (1 intentionally dead) |
| Model | PRESENT via Engine | `legalCompliance.engine.js` — pure computation, not detected by `*.model.js` scanner |
| Controller | PRESENT | `legalConsent.controller.js`, `legalDocument.controller.js` |
| Adapter | PRESENT | `legal.adapter.js` — bundles hooks + screen + bare controller function |
| Hook | PRESENT | `useLegalConsent.js`, `useLegalDocument.js`, `useSignupConsent.js` |
| Component | PRESENT (undetected) | `legal/docs/*.jsx`, `legal/screens/components/*.jsx` — not in `components/` folder |
| View Screen | PRESENT | `AboutView.jsx`, `ContactView.jsx` |
| Final Screen | PRESENT | 6 routed screens + `ConsentGateScreen` (guard-embedded) |

---

## AvengersAssemble Report — 2026-05-11

_Run Date:_ 2026-05-11  
_Triggered by:_ User (`/AvengersAssemble vcsm.dal.legal.md`)  
_Scope:_ VCSM — `features/legal/` DAL documentation alignment  
_Mode:_ Read-only. No code modified. No source docs overwritten.  
_Commands Run:_ ARCHITECT · VENOM · SENTRY (review-contract) · KRAVEN · CARNAGE · LOGAN · SHIELD  
_Commands N/A:_ LOKI (no runtime trace available) · FALCON · WINTER SOLDIER (DAL doc, no native surface) · IRONMAN (ownership map verified inline)

---

### Governance Evidence Registry

| Command | Status | Findings | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT | 4 drift items in external maps | YES | NO |
| IRONMAN | PRESENT | Ownership schema names stale | YES | NO |
| VENOM | PRESENT | Security report gap on consent gate | YES | CAUTION |
| SENTRY | PRESENT | Layer order compliant | MINOR | NO |
| LOKI | N/A | No runtime trace for doc scope | — | NO |
| KRAVEN | PRESENT | Cache design sound | NO | NO |
| CARNAGE | PRESENT | One open Edge Function task | DOCUMENTED | NO |
| FALCON | N/A | DAL doc — no native surface | — | NO |
| WINTER SOLDIER | N/A | DAL doc — no native surface | — | NO |
| LOGAN | PRESENT | Summary table + pipeline Hook row | YES | NO |
| review-contract | PRESENT | Fully compliant | NO | NO |
| SHIELD | PRESENT | Dead external call — low risk | NO | NO |

---

### ARCHITECT

**Status: DRIFT FOUND**

| Finding | Location | Severity |
|---|---|---|
| Feature map lists "3 DAL files" for legal | `vcsm-feature-map.md` line 70 | LOW — actual is 4 (`getPublicIp`, `legalDocuments.read`, `userConsents.read`, `userConsents.write`) |
| Database read map lists `legal_documents` base table | `vcsm-database-read-map.md` line 155 | LOW — actual DAL reads from `platform.public_legal_documents_v` VIEW, not the base table |
| Legal consent TTL caches absent from cache summary | `vcsm-database-read-map.md` cache table | LOW — `legalConsent.controller.js` uses 60 s (docs) and 90 s (consents) TTL caches with `invalidateLegalDocsCache()` and `invalidateConsentCache()`; neither is listed |
| Ownership map lists `vc.legal_documents, vc.user_consents` | `feature-ownership-map.md` line 26 | LOW — both tables live in the `platform` schema, not `vc` |

**Confirmed aligned:** DAL file existence, exported function signatures, `legalCompliance.engine.js` exclusively consumed by `legalConsent.controller.js` (verified by grep — zero other importers).

---

### VENOM

**Status: DRIFT FOUND — CAUTION**

| Finding | Severity | Notes |
|---|---|---|
| Legal consent gate not covered in VENOM security report | CAUTION | `resolveLegalGateForSession` + `useLegalConsent` + `ConsentGateScreen` wrap every protected route. No VENOM analysis exists for this critical flow. Security report (April 13, 2026) predates the current gate implementation. |
| `dalRecordLegalAcceptance` trusts client-passed `userId` | LOW | No server-side ownership validation inside the DAL. Mitigation depends entirely on Supabase RLS on `platform.user_consents`. RLS enforcement status is not documented in the security report. |
| Security report header references "Batman" | STALE | Report header reads `Generated by: Batman`. Command was renamed to NickFury/Deadpool (see memory: command name changes 2026-05-11). |

**Confirmed aligned:** `getPublicIp` is intentionally dead — the external call to `api.ipify.org` cannot be reached at runtime. No active client-side IP leakage. File is documented with inline rationale and a Carnage handoff task.

---

### SENTRY (review-contract)

**Status: ALIGNED — with one documented inaccuracy**

| Check | Result |
|---|---|
| `select('*')` violations | NONE — all DAL files use explicit column lists |
| TypeScript files in features/legal/ | NONE |
| Cross-feature direct imports (bypassing adapter) | NONE — `join` feature and `ProtectedRoute` both import from `@/features/legal/adapters/legal.adapter` |
| Layer order (DAL → Controller → Hook → Adapter → Screen) | COMPLIANT |
| Path aliases (`@/...`) used for cross-folder imports | COMPLIANT |
| Intra-feature direct import (`useSignupConsent` → controller) | ACCEPTABLE — same feature, no adapter bypass |

**Minor drift:** The Architecture Pipeline table in the source document still lists two DAL files (`userConsents.read.dal.js`, `userConsents.write.dal.js`) in the Hook row. This inaccuracy was identified in Structural Finding #1 of the Dead Code Audit and handed off to LOGAN for correction — but the table itself was not corrected in that audit pass. The actual hooks are `useLegalConsent.js`, `useLegalDocument.js`, `useSignupConsent.js`.

---

### KRAVEN

**Status: ALIGNED**

- Legal docs cache: 60 s TTL (intentionally reduced from 5 min to minimize non-enforcement window after a version bump). Design rationale is inline-documented in the controller.
- User consents cache: 90 s TTL, keyed by `userId:appId` to prevent cross-app collision.
- `dalRecordLegalAcceptance` multi-document writes use `Promise.all` — correct parallelization pattern.
- Cache invalidation: both caches export explicit invalidation functions called on the write path. No stale-consent risk from cache after acceptance.
- No performance bottlenecks identified in the DAL layer.

---

### CARNAGE

**Status: ONE OPEN TASK — DOCUMENTED**

| Task | Location | Status |
|---|---|---|
| Server-side IP capture via Supabase Edge Function for `ip_address` on consent writes | `getPublicIp.dal.js` inline comment + `dalRecordLegalAcceptance` JSDoc | OPEN — pending Edge Function implementation |

The DAL doc correctly documents this as a Carnage handoff. No active migration risk. When the Edge Function ships, `getPublicIp.dal.js` should be deleted and the `ip_address` field should be populated server-side only.

---

### LOGAN

**Status: DRIFT FOUND**

| Finding | Location in Doc | Severity |
|---|---|---|
| Summary table "Tables accessed: 1" | Line 16 | LOW — `legalDocuments.read.dal.js` accesses `platform.public_legal_documents_v` (view). Correct count is: Tables: 1 (`user_consents`), Views: 1 (`public_legal_documents_v`) |
| Architecture Pipeline Hook row lists two DAL files | Pipeline table, Hook row | LOW — `userConsents.read.dal.js` and `userConsents.write.dal.js` are not hooks. The Structural Finding #1 identifies this but does not correct the table. |
| Controller API surface not documented | Not present in doc | LOW — 8 exported functions from `legalConsent.controller.js` (`getActiveLegalDocuments`, `invalidateLegalDocsCache`, `invalidateConsentCache`, `getUserConsentStatus`, `recordLegalAcceptance`, `recordSignupConsent`, `resolveLegalGateForSession`, `acceptRequiredConsents`) are undocumented at the controller surface level. The doc covers DAL only. |

**Confirmed aligned:**
- All 5 DAL functions correctly classified (live vs intentionally dead) ✓
- `legalCompliance.engine.js` engine role description accurate ✓
- Cross-feature consumers (`join`, `auth`, `ProtectedRoute`) correctly identified ✓
- All adapter exports verified against actual `legal.adapter.js` ✓
- `ConsentGateScreen` correctly noted as guard-embedded (not a standalone route) ✓
- `dalGetUserConsents` + `dalRecordLegalAcceptance` scoping by `userId` (not `actorId`) correctly justified as pre-actor system record ✓
- Call chains (consent gate, signup, legal document viewer, barbershop join) accurate ✓
- Architecture Pipeline Corrected table (bottom of doc) is accurate ✓

---

### SHIELD

**Status: ALIGNED**

- `getPublicIp.dal.js` references `api.ipify.org` — third-party IP lookup service. The file is intentionally dead (zero importers, documented rationale). No active data transmission to external service at runtime. No IP/license/provenance concern.
- No non-platform dependencies introduced. All imports are within VCSM stack (`@/services/supabase/supabaseClient`, `@/shared/lib/ttlCache`).

---

### Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| LOGAN (doc says "Tables accessed: 1") | ARCHITECT (DAL reads a view) | `public_legal_documents_v` view access not reflected in summary or database-read-map | LOW | Update summary table to "Tables: 1, Views: 1"; update database-read-map to reference the view |
| VENOM security report (April 2026) | SENTRY (consent gate wraps all protected routes) | Consent gate is a high-coverage security surface with no VENOM review | CAUTION | Queue a targeted VENOM pass on `useLegalConsent` + `resolveLegalGateForSession` + `ConsentGateScreen` + RLS on `platform.user_consents` |
| feature-ownership-map (`vc.` schema) | Actual code (`platform.` schema) | Ownership map references wrong schema for legal tables | LOW | Update feature-ownership-map line 26 to `platform.legal_documents, platform.user_consents` |

---

### Documentation Truth Review

| Doc / System | Truth Status | Drift | Blocking |
|---|---|---|---|
| `vcsm.dal.legal.md` — DAL functions | ALIGNED | None | NO |
| `vcsm.dal.legal.md` — Summary table (tables count) | MINOR DRIFT | "1" should reflect both `user_consents` and `public_legal_documents_v` | NO |
| `vcsm.dal.legal.md` — Pipeline Hook row | MINOR DRIFT | Lists DAL files in Hook row (acknowledged but uncorrected) | NO |
| `vcsm-feature-map.md` — legal DAL count | STALE | "3 files" should be "4 files" | NO |
| `vcsm-database-read-map.md` — legal_documents | STALE | Base table name used; should be view `public_legal_documents_v` | NO |
| `vcsm-database-read-map.md` — cache summary | MISSING | Legal consent caches (60 s docs, 90 s consents) not listed | NO |
| `vcsm-security-report.md` — consent gate | GAP | No coverage of consent gate security surface | CAUTION |
| `feature-ownership-map.md` — schema names | STALE | `vc.` prefix wrong, should be `platform.` | NO |

---

### Proposed Updates (`.v2.md` Required)

| File | Drift | Action |
|---|---|---|
| `vcsm-feature-map.md` | legal DAL count "3" → "4" | Create `.v2.md` |
| `vcsm-database-read-map.md` | `legal_documents` → `public_legal_documents_v`; add cache entries for legal consent TTL caches | Create `.v2.md` |
| `feature-ownership-map.md` | `vc.legal_documents, vc.user_consents` → `platform.legal_documents, platform.user_consents` | Create `.v2.md` |
| `vcsm-security-report.md` | Add VENOM gap note: consent gate (`resolveLegalGateForSession`, `useLegalConsent`, `ConsentGateScreen`, RLS on `platform.user_consents`) has no VENOM coverage | Create `.v2.md` |

> **No `.v2.md` files are created in this run.** User approval required before proposals become changes. All original files are untouched.

---

### Overall Status

**DRIFT FOUND — LOW SEVERITY — NON-BLOCKING**

- No `select('*')` violations
- No TypeScript files
- No cross-feature adapter bypasses
- No layer order violations
- No release-blocking security findings in this DAL
- External map drift is documentation-only — no runtime impact
- Security report gap on consent gate is a CAUTION item — warrants a dedicated VENOM pass before next release

---

### Recommended Next Commands

1. **VENOM** — targeted pass on `resolveLegalGateForSession`, `useLegalConsent`, `ConsentGateScreen`, and RLS on `platform.user_consents`
2. **LOGAN** — apply four `.v2.md` corrections above (feature map, database read map, ownership map, security report gap note)
3. **CARNAGE** — track open Edge Function task: server-side IP capture for `ip_address` on consent writes

---

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.legal.md` | Appended this fix-pass record; no source code or external map files changed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| `getPublicIp` confirmed dead but intentionally retained | VERIFIED / DEFERRED | Verified zero import callers outside its own file. No deletion performed because the doc says it is intentionally retained until the server-side IP capture task ships, and the current instruction is no-delete. |
| Pipeline Hook row lists DAL files | DOCUMENTED | Verified actual hooks are `useLegalConsent.js`, `useLegalDocument.js`, and `useSignupConsent.js`; prior table preserved under append-only instruction. |
| Summary table omits legal document view access | DOCUMENTED | Verified `legalDocuments.read.dal.js` reads `platform.public_legal_documents_v`; no inline rewrite performed. |
| Consent gate lacks targeted VENOM security review | DEFERRED | Verified `resolveLegalGateForSession`, `useLegalConsent`, and `ConsentGateScreen` are live; requires VENOM/security ownership, not a code change. |
| External map drift (`vcsm-feature-map`, database read map, ownership map, security report) | DEFERRED | User requested processing this DAL doc; no `.v2.md` files created and no unrelated canonical maps modified. |
| Server-side IP capture Edge Function task | DEFERRED | Requires CARNAGE/database/Edge Function ownership; no schema, RLS, or engine changes made. |

### Verification
- Commands/searches run:
  - `rg -n "getPublicIp|dalGetActiveLegalDocuments|dalGetLegalDocument|dalGetUserConsents|dalRecordLegalAcceptance|resolveLegalGateForSession|recordSignupConsent|public_legal_documents_v|user_consents|legalCompliance" apps/VCSM/src/features/legal apps/VCSM/src/features/auth apps/VCSM/src/features/join apps/VCSM/src/app --glob '*.js' --glob '*.jsx'`
  - `find apps/VCSM/src/features/legal -name '*.dal.js' -type f -maxdepth 4 -print | sort`
  - `sed -n '1,220p' apps/VCSM/src/features/legal/adapters/legal.adapter.js`
  - `sed -n '1,260p' apps/VCSM/src/features/legal/controllers/legalConsent.controller.js`
- Production callers checked:
  - `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js`
  - `apps/VCSM/src/features/legal/controllers/legalDocument.controller.js`
  - `apps/VCSM/src/features/legal/hooks/useLegalConsent.js`
  - `apps/VCSM/src/features/legal/hooks/useSignupConsent.js`
  - `apps/VCSM/src/features/auth/hooks/useRegister.js`
  - `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js`
  - `apps/VCSM/src/app/guards/ProtectedRoute.jsx`
- Remaining risks:
  - No VENOM report currently covers the consent gate and `platform.user_consents` RLS dependency.
  - `getPublicIp.dal.js` remains intentionally retained as a reference until CARNAGE ships server-side IP capture.
  - Prior sections still contain acknowledged documentation drift because this pass is append-only.

### Status
PARTIAL

---

## CEREBRO Verification Pass — 2026-05-18

_Run Date:_ 2026-05-18
_Triggered by:_ User (`CEREBRO on vcsm.dal.legal.md`)
_Scope:_ VCSM — `features/legal/` — full risk classification + command execution
_Method:_ CEREBRO classification → command phase decision → targeted command execution → findings appended
_Mode:_ Read-only. No source code modified. No prior document content overwritten.

---

### Phase 0 — CEREBRO Classification

CEREBRO read the full document and all referenced source files before deciding command order.

**Risk categories identified:**

| Category | Count | Source |
|---|---|---|
| Stale claims in this document | 7 | AvengersAssemble 2026-05-11 § VENOM — all false |
| VENOM findings resolved since last pass | 7 of 9 | Source code verified |
| VENOM findings still open | 2 of 9 | F4 (server-side IP), F6 (route dormant) |
| DB/RLS concerns | 2 | Migration verification required |
| Runtime concerns | 1 | Barbershop route status |
| Documentation drift (external maps) | 4 | Unchanged from prior pass |
| Architecture-boundary concerns | 0 | Fully compliant |
| Native parity concerns | 0 | DAL doc — no native surface |

**Critical pre-finding:** The AvengersAssemble 2026-05-11 recorded that "No VENOM analysis exists for this critical flow" and "Security report (April 13, 2026) predates the current gate implementation." Both claims are false. The VENOM report `CURRENT/features/dashboard/evidence/2026-05-10_venom_terms-of-service-logic.md` (dated 2026-05-10) covers the consent gate with 9 findings. This stale claim propagated into five locations within this document.

---

### Phase 1 — Command Order Decision

CEREBRO determined the following phase sequence based on canonical run order and open risks:

| Phase | Command | Reason | Priority |
|---|---|---|---|
| 1 | VENOM (re-pass) | 9 original findings — verify resolution status; correct stale DAL doc claims | HIGH |
| 2 | DB | Verify migration 20260510030000 + 20260510040000 tracked in production migrations | HIGH |
| 3 | LOKI | Static trace of barbershop join route status | MEDIUM |
| 4 | LOGAN | Four external doc corrections + DAL doc internal stale claim corrections | MEDIUM |

Commands N/A this pass:
- BlackWidow — VENOM re-pass finds consent gate security-sound; no adversarial scenarios to execute
- ARCHITECT — No new structural drift; prior findings carry forward
- Sentry/review-contract — Compliance verified in prior pass; no new code changes
- KRAVEN — No performance changes since prior pass
- CARNAGE — Server-side IP task documented; no new migration work scoped
- FALCON / WinterSoldier — DAL doc, no native surface

---

### Phase 2 — VENOM Re-Pass

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_venom_legal-dal-finding-resolution.md`

**Finding Resolution Summary:**

| # | Finding | Original Severity | Current Status |
|---|---------|-------------------|----------------|
| 1 | Gate fails open on error | CRITICAL | RESOLVED ✓ — fails closed with gateError + retry UI |
| 2 | syntheticAdultBirthdate writes fake is_adult | CRITICAL | RESOLVED ✓ — function removed from codebase |
| 3 | No INSERT GRANT; no immutability on user_consents | HIGH | RESOLVED ✓ — migration 20260510030000 tracked |
| 4 | IP/locale/user_agent client-supplied | HIGH | PARTIAL — ip_address omitted; Carnage task open |
| 5 | accepted_at from client clock | MEDIUM | RESOLVED ✓ — DB DEFAULT now() applies |
| 6 | Barbershop route unregistered (latent) | HIGH (latent) | DORMANT — route still dead; all sub-fixes complete |
| 7 | Age attestation no independent DB record | HIGH | RESOLVED ✓ — migration 20260510040000 + code |
| 8 | Empty active docs returns ALLOW_ACCESS | MEDIUM | RESOLVED ✓ — resolveLegalGateForSession throws |
| 9 | Cache key collision (userId only) | LOW | RESOLVED ✓ — key now `${userId}:${appId}` |

**7 of 9 findings resolved. 1 open (F4). 1 dormant/low (F6).**

**Stale claims in this document corrected by this pass:**

| Location | Stale Claim | Correction |
|---|---|---|
| AvengersAssemble § VENOM | "Security report (April 13, 2026) predates current gate implementation" | VENOM report is 2026-05-10 |
| AvengersAssemble § VENOM | "No VENOM analysis exists for this critical flow" | 9-finding VENOM report covers the consent gate |
| AvengersAssemble § VENOM | "RLS enforcement status is not documented in the security report" | RLS documented in VENOM F3 and QA §2/§6 |
| Cross-System Contradictions | "Consent gate is a high-coverage security surface with no VENOM review" | VENOM reviewed it with 9 findings |
| Documentation Truth Review | "vcsm-security-report.md — GAP — No coverage of consent gate" | Coverage exists; no gap |
| Proposed Updates | "vcsm-security-report.md — Create .v2.md adding VENOM gap note" | MOOT — VENOM report already covers this |
| Codex Fix Pass | "Consent gate lacks targeted VENOM security review — DEFERRED" | Done 2026-05-10 |

---

### Phase 3 — DB Verification

**Scope:** Migration tracking — cannot query live DB; verified via production migration files.

| Migration | Status | What It Does |
|---|---|---|
| `20260510030000_user_consents_immutability_and_grant.sql` | TRACKED in `apps/VCSM/supabase/migrations/` ✓ | INSERT GRANT + `user_consents_deny_update` + `user_consents_deny_delete` + `trg_prevent_consent_audit_mutation` trigger |
| `20260510040000_age_verification_consent_type.sql` | TRACKED in `apps/VCSM/supabase/migrations/` ✓ | Extends `user_consents_consent_type_check` to include `age_verification`; seeds age_verification legal document |

**RLS status (post-migration):**
- `user_consents_select_own` — SELECT USING `user_id = auth.uid()` ✓
- `user_consents_insert_own` — INSERT WITH CHECK `user_id = auth.uid()` ✓
- `user_consents_deny_update` — RESTRICTIVE USING (false) ✓
- `user_consents_deny_delete` — RESTRICTIVE USING (false) ✓
- `trg_prevent_consent_audit_mutation` — triggers on UPDATE, blocks mutation of `user_id`, `legal_document_id`, `accepted_at`, `accepted` ✓

**Caveat:** Live DB application cannot be confirmed via static analysis. Both migrations are production-tracked. If the DB was reset without replaying migrations, these policies may not be active.

---

### Phase 4 — LOKI Static Route Trace

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_loki_barbershop-join-route-trace.md`

**Result:** `/join/barbershop/:token` is **not registered** in any route file. Grep across all 13 route files returns zero results for `barbershop` or `JoinBarbershop`.

**Safe-to-activate status:** All three VENOM F6 sub-conditions pre-fixed:
1. Consent recording in `signUpForBarbershopInvite` ✓
2. `syntheticAdultBirthdate` removed ✓
3. `JoinSignupForm.jsx` links to `/legal/terms-of-service` and `/legal/privacy-policy` ✓

**Activation requires:** Route registration only — no code changes. Owner: Wolverine.

---

### Phase 5 — LOGAN Documentation Drift

The following external map corrections remain open from the prior pass (unchanged):

| File | Drift | Action Required |
|---|---|---|
| `vcsm-feature-map.md` | "legal: DAL: 3 files" → actual is 4 files | Create `.v2.md` |
| `vcsm-database-read-map.md` | `legal_documents` → `public_legal_documents_v` (view); missing cache entries (60 s docs, 90 s consents) | Create `.v2.md` |
| `feature-ownership-map.md` | `vc.legal_documents, vc.user_consents` → `platform.legal_documents, platform.user_consents` | Create `.v2.md` |
| `vcsm-security-report.md` | No change needed — VENOM report covers consent gate; gap was a false claim | No action |

**Internal DAL doc corrections (this document):**

| Location | Drift | Status |
|---|---|---|
| Architecture Pipeline Hook row | Lists `userConsents.read.dal.js` and `userConsents.write.dal.js` as hooks | OPEN — acknowledged, not corrected; append-only constraint applies |
| Summary table "Tables accessed: 1" | Should be "Tables: 1, Views: 1" | OPEN — append-only constraint applies |

> **No `.v2.md` files created in this pass.** External map corrections require user approval before they become changes. All original files are untouched.

---

### Final Command Status Table

| Command | Status | Findings | Blocking |
|---|---|---|---|
| CEREBRO | COMPLETE | 7 stale claims + 9 VENOM finding statuses classified | NO |
| VENOM (re-pass) | COMPLETE | 7 resolved, 1 open (F4), 1 dormant (F6); stale claims in doc identified | NO |
| DB | COMPLETE (static) | Both migrations tracked in production; live DB application unverifiable statically | NO |
| LOKI | COMPLETE (static) | Barbershop route confirmed unregistered; safe to activate | NO |
| LOGAN | DEFERRED | External map corrections documented; user approval required for `.v2.md` files | NO |
| ARCHITECT | CARRIED FROM PRIOR | Drift items unchanged | NO |
| CARNAGE | OPEN | Server-side IP capture Edge Function task pending | NO |
| BlackWidow | N/A | Consent gate security-sound; no adversarial scenarios triggered | NO |
| FALCON | N/A | DAL doc — no native surface | NO |
| WinterSoldier | N/A | DAL doc — no native surface | NO |

---

### Open Risks

| Risk | Severity | Owner | Notes |
|---|---|---|---|
| Server-side IP capture for `ip_address` on consent writes | MEDIUM | CARNAGE | `ip_address` safely omitted; no false data; Carnage task must ship before regulatory audit |
| Barbershop join route unregistered | LOW (dormant) | Wolverine | Route dead; all pre-conditions met; safe to activate when routed |
| locale / user_agent still client-supplied on consent writes | LOW | Informational | No evidentiary claim made; not used for authorization |
| Live DB migration application unverifiable | LOW | Operator | Migrations tracked in production folder; cannot confirm without DB access |
| External map drift (feature-map, database-read-map, ownership-map) | LOW | LOGAN | Documentation-only; no runtime impact |

---

### Fixed Risks (Since Prior Pass)

| Risk | Resolution |
|---|---|
| Gate fails open on consent check error (CRITICAL) | Fixed — `useLegalConsent` now fails closed with gateError + retry UI |
| Synthetic adult age written to DB on barbershop signup (CRITICAL) | Fixed — `syntheticAdultBirthdate` removed from codebase |
| No INSERT GRANT on `platform.user_consents` (HIGH) | Fixed — migration 20260510030000 tracked |
| No explicit UPDATE/DELETE immutability on consent rows (HIGH) | Fixed — migration 20260510030000: RESTRICTIVE deny policies + audit trigger |
| accepted_at from client clock (MEDIUM) | Fixed — omitted from insert; DB DEFAULT now() applies |
| Age attestation bundled with no independent DB record (HIGH) | Fixed — migration 20260510040000: `age_verification` consent_type + seeded document |
| Empty active docs returns ALLOW_ACCESS (MEDIUM) | Fixed — resolveLegalGateForSession throws; gate fails closed |
| Cache key collision (userId only, not userId+appId) (LOW) | Fixed — cache key is now `${userId}:${appId}` |
| Dead `/terms` and `/privacy` links in JoinSignupForm (HIGH — sub-item of F6) | Fixed — now `/legal/terms-of-service` and `/legal/privacy-policy` |
| VENOM stale claim in AvengersAssemble 2026-05-11 (7 locations) | Documented in this pass |

---

### Required Next Commands

1. **LOGAN** — Apply three `.v2.md` corrections (feature-map, database-read-map, ownership-map) after user approval. The vcsm-security-report.md correction is no longer needed (the gap was a false claim).
2. **CARNAGE** — Execute server-side IP capture Edge Function for `ip_address` on consent writes. This is the only substantive open security item.
3. **Wolverine** — Activate barbershop join route when the join flow is ready for production. All code pre-conditions are met.

---

### Document Status

**REVIEW_PENDING**

The consent gate is security-sound. All CRITICAL and HIGH VENOM findings from the 2026-05-10 audit have been resolved in the current codebase. Remaining open items (server-side IP, dormant route) are non-blocking for release. Three external map corrections are pending user approval for `.v2.md` creation.

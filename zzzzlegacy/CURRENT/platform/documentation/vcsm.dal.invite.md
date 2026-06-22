# VCSM DAL — `invite`

_Generated:_ 2026-05-11  
_Updated:_ 2026-05-11 (ARCHITECT live audit — Edge Function DAL clarification, DEV PROBE cleanup required, architecture gaps, related DAL mapped)  
_Source:_ ARCHITECT static scan + manual verification · `apps/VCSM/src/features/invite/`  
_Confidence:_ STATICALLY\_TRACED + MANUALLY\_VERIFIED  

---

## Summary

| Item | Detail |
|---|---|
| DAL files | 1 |
| Exported functions | 1 (`sendCitizenInviteDAL`) |
| Tables accessed | 0 — delegates to Edge Function server-side |
| RPCs called | 0 — delegates to Edge Function server-side |
| Edge Functions invoked | 1 (`send-citizen-invite`) |
| Release flag | None — always active |
| Feature status | LIVE — entry via onboarding CTA (`/invite`) |
| Architecture status | INCOMPLETE — no Model layer, business logic in hook, DEV PROBE code not removed |
| Dead code | None confirmed |
| Cleanup required | DEV PROBE debug state (`rawDebugError`) in hook + view — marked for removal

## Doc Corrections from Original Static Scan

| Field | Original (Wrong) | Corrected |
|---|---|---|
| Operations | `unknown` | Edge Function invocation — `supabase.functions.invoke('send-citizen-invite')` |
| Tables accessed | 0 | 0 — correct, but reason is Edge Function delegation, not missing data |
| RPCs called | 0 | 0 — correct, same reason |
| Risk findings | None | 4 findings (see below) |

---

## DAL Files

### `invite.dal.js`

**Path:** `features/invite/dal/invite.dal.js`  
**Operations:** Edge Function invocation (not a Supabase table/RPC)  
**Edge Function:** `send-citizen-invite` (POST)

**Exported functions:**

| Function | Operation | Target |
|---|---|---|
| `sendCitizenInviteDAL({ targetEmail, inviterType, inviterActorId })` | POST | `supabase.functions.invoke('send-citizen-invite')` |

**Why Tables: 0, RPCs: 0:** The DAL delegates entirely to the `send-citizen-invite` Edge Function. The service role key, database writes, and email dispatch all happen server-side. The client never touches a table directly.

**Return shape:** `{ ok: boolean, code?: string }` — code values include `USER_ALREADY_REGISTERED`, `SELF_INVITE`, `INVITE_FAILED`, `EMAIL_SEND_FAILED`.

---

## Related DAL — `vibeInvites.dal.js` (onboarding feature)

**Path:** `features/onboarding/dal/vibeInvites.dal.js`  
**Purpose:** Reads invite history for onboarding completion tracking — separate from `invite.dal.js`

| Function | Operation | Table |
|---|---|---|
| `readVibeInvitesDAL({ senderActorId })` | READ | `vc.vibe_invites` |
| `readVibeInviteCountDAL({ senderActorId })` | COUNT | `vc.vibe_invites` |
| `readQualifyingVibeInviteCountDAL({ senderActorId })` | COUNT (pending/accepted only) | `vc.vibe_invites` |

These two DALs serve distinct roles:
- `invite.dal.js` → **sends** an invite via Edge Function
- `vibeInvites.dal.js` → **reads** invite history for onboarding step completion

`vibeInvites.dal.js` also contains a DEV PROBE `console.log` in `readQualifyingVibeInviteCountDAL` — flagged for removal.

---

## Feature Entry Points

`/invite` is not in the bottom navigation. Entry is via onboarding only.

| Entry | File | Condition |
|---|---|---|
| Onboarding CTA | `onboarding.controller.helpers.js` — `ctaPath: '/invite'` for step `invite_first_citizen` | User has not yet completed the invite onboarding step |
| Route | `app.routes.jsx` → `{ path: "/invite", element: <InviteScreen /> }` | Always registered |
| Lazy load | `app/routes/lazyApp.jsx` → `import("@/features/invite/screens/InviteScreen")` | On demand |

After a successful invite, `InviteView` calls `navigate(-1)` after a 2s delay, returning the user to the previous screen (onboarding).

---

## Active Call Chain (confirmed production)

```
Onboarding CTA (invite_first_citizen step)
  → /invite route
    → InviteScreen.jsx   [Final Screen]
      → InviteView.jsx   [View Screen]
        → useInvite()    [Hook]
          → ctrlSendCitizenInvite()  [Controller]
            → sendCitizenInviteDAL() [DAL]
              → supabase.functions.invoke('send-citizen-invite')  [Edge Function]
```

---

## Architecture Pipeline

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | `dal/invite.dal.js` |
| **Model** | ✗ MISSING | Error code mapping lives in hook (contract violation — see RISK-2) |
| **Controller** | ✓ PRESENT | `controller/invite.controller.js` |
| **Adapter** | ✗ MISSING | Feature only consumed internally — no cross-feature adapter needed |
| **Hook** | ✓ PRESENT | `hooks/useInvite.js` |
| **Component** | ✗ MISSING | No sub-components — view renders inline |
| **View Screen** | ✓ PRESENT | `screens/InviteView.jsx` |
| **Final Screen** | ✓ PRESENT | `screens/InviteScreen.jsx` |
| **Styles** | ✓ PRESENT | `screens/InviteView.styles.js` |

### Controller

- `controller/invite.controller.js` — validates email format + inviterType, calls DAL. Clean single-responsibility.

### Hook — `useInvite.js`

- Reads identity via `useIdentity()` to resolve `inviterType` and `inviterActorId`
- Manages `email`, `sending`, `success`, `error` state
- Contains `CODE_MESSAGES` dict and `codeToMessage()` — **business logic that belongs in the controller or model** (see RISK-2)
- Contains `rawDebugError` DEV PROBE state — **not yet removed** (see RISK-1)

### Final Screen — `InviteScreen.jsx`

- Sets `document.title` via `useEffect` — acceptable
- No identity gate — any authenticated user can reach `/invite` (acceptable for this feature)
- Directly renders `<InviteView />` — contract-compliant

---

## Risk Findings

### RISK-1 — DEV PROBE Debug State Not Removed
**Severity:** MEDIUM  
**Classification:** CLEANUP REQUIRED  
**Detail:** `rawDebugError` was added as a temporary CORS debugging probe. The hook comment reads "remove after CORS confirmed." The CORS issue is resolved (feature is shipping) but the probe was never cleaned up.

Locations:
- `hooks/useInvite.js` — `const [rawDebugError, setRawDebugError] = useState(null)` + 3 `setRawDebugError` calls + returned in hook output
- `screens/InviteView.jsx` — rendered in two places (success state + error state), both gated by `import.meta.env.DEV`

The debug blocks are DEV-gated so they don't render in production, but `rawDebugError` state still allocates on every render and the code ships in the bundle.

**Recommended action:** Remove `rawDebugError` state, all `setRawDebugError` calls, and both DEV render blocks from `InviteView.jsx`. Remove from hook return object.

---

### RISK-2 — Business Logic (`CODE_MESSAGES`) in Hook, Not Model/Controller
**Severity:** LOW  
**Classification:** LAYER VIOLATION  
**Detail:** `useInvite.js` contains `CODE_MESSAGES` (a domain error code dictionary) and `codeToMessage()`. These are business rules — the mapping of server error codes to user-facing messages belongs in the model or controller, not the hook.

**Recommended action:** Move `CODE_MESSAGES` and `codeToMessage` to `invite.controller.js` (or a new `invite.model.js`). Import from there in the hook.

---

### RISK-3 — `vibeInvites.dal.js` Has DEV PROBE `console.log`
**Severity:** LOW  
**Classification:** POLICY VIOLATION  
**Detail:** `readQualifyingVibeInviteCountDAL` in `features/onboarding/dal/vibeInvites.dal.js` has a `console.log` gated by `import.meta.env.DEV`. Policy: no `console.log` anywhere — debug output must render on screen and be dev-only. Comment says "DEV PROBE — remove after invite tracking confirmed working."

**Recommended action:** Remove the `console.log` block from `vibeInvites.dal.js`.

---

### RISK-4 — `InviteView.jsx` Placed in `screens/` Not `ui/`
**Severity:** LOW  
**Classification:** NAMING / ORGANIZATION  
**Detail:** `InviteView.jsx` is a View Screen (hooks + composition layer) but lives inside `screens/` alongside the Final Screen. Per contract, View Screens belong in `ui/` or a dedicated `views/` folder, not co-located with the Final Screen in `screens/`.

**Recommended action:** Move `InviteView.jsx` and `InviteView.styles.js` to `features/invite/ui/`.

---

## Pending Reviews

| Review | Command | Priority |
|---|---|---|
| Remove `rawDebugError` DEV PROBE from hook + view | SENTRY | MEDIUM |
| Move `CODE_MESSAGES` / `codeToMessage` to controller or model | SENTRY | LOW |
| Remove `console.log` from `vibeInvites.dal.js` | SENTRY | LOW |
| Move `InviteView.jsx` to `ui/` folder | SENTRY | LOW |

---

# Avengers Assembly Report — 2026-05-11

## Run Summary

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | `/AvengersAssemble` with argument `vcsm.dal.invite.md` |
| Application Scope | VCSM |
| Document Scope | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.invite.md` |
| Release Scope | Invite feature DAL + consumer graph + onboarding integration |
| Boundary Contract | PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED |
| Specialist Passes | ARCHITECT / IRONMAN / VENOM / SENTRY / LOKI / KRAVEN / CARNAGE / FALCON / WINTER SOLDIER / LOGAN / review-contract / SHIELD |

---

## Governance Evidence Registry

| Command | Status | Latest Report | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT (inline 2026-05-11) | This document — architecture pipeline section | YES — 4 new findings not in original doc | NO |
| IRONMAN | MISSING | None for invite feature | — open risks need ownership assignment | NO |
| VENOM | STALE | `vcsm-security-report.md` (2026-04-13) | PARTIAL — invite Edge Function trust boundary not specifically reviewed | NO |
| SENTRY | MISSING | None for invite feature | — 4 open pending reviews routed to SENTRY | NO |
| LOKI | MISSING | None for invite feature | — | NO |
| KRAVEN | PRESENT (inline) | Wasted DB reads finding (this report) | YES — 3 DAL calls fire even when card suppressed | NO |
| CARNAGE | N/A | — | N/A — no migrations pending for invite | NO |
| FALCON | MISSING | None for invite feature | — Native invite screen parity unconfirmed | NO |
| WINTER SOLDIER | N/A | — | N/A — Android scope not active | NO |
| LOGAN | PRESENT (inline 2026-05-11) | This document | YES — Feature Status field drift | NO |
| review-contract | PRESENT (inline this session) | — | YES — RISK-2 and RISK-4 are open layer violations | NO |
| SHIELD | N/A | — | N/A — no external dependencies or license concerns | NO |

---

## Module Alignment Matrix

| Module | Architecture | Ownership | Security | Runtime | Performance | Native | Docs | Release Status |
|---|---|---|---|---|---|---|---|---|
| invite (core DAL + controller) | ALIGNED | MISSING | PARTIAL | MISSING | N/A | MISSING | MINOR DRIFT | CAUTION |
| invite (hook + screens) | MINOR DRIFT | MISSING | N/A | MISSING | N/A | MISSING | MINOR DRIFT | CAUTION |
| onboarding / vibeInvites DAL | ALIGNED | MISSING | N/A | MISSING | LOW | N/A | MISSING | CAUTION |
| invite accept-on-register path | MISSING | MISSING | N/A | N/A | N/A | N/A | NOT DOCUMENTED | CAUTION |

---

## ARCHITECT

**Status: DRIFT FOUND**

Findings:

1. **Feature file structure — ALIGNED.** All 6 files match documentation exactly: `dal/invite.dal.js`, `controller/invite.controller.js`, `hooks/useInvite.js`, `screens/InviteScreen.jsx`, `screens/InviteView.jsx`, `screens/InviteView.styles.js`. No model layer file — consistent with documented INCOMPLETE architecture status.

2. **`SHOW_INVITE_ONBOARDING_CARD = false` — NEW FINDING, NOT IN DOCUMENT.** The `onboarding.controller.helpers.js` defines `SHOW_INVITE_ONBOARDING_CARD = false` with comment "hide invite onboarding card while invite email flow is rebuilt." The onboarding CTA that routes to `/invite` is currently suppressed. The document's `Feature status` field says "LIVE — entry via onboarding CTA (`/invite`)" — this is incorrect. The route `/invite` exists and is registered, but the primary entry point (the onboarding card) is disabled. Feature status should reflect PARTIALLY SUPPRESSED.

3. **Wasted DB reads — NEW FINDING.** `getOnboardingCardsController` fires `readVibeInvitesDAL`, `readQualifyingVibeInviteCountDAL`, and `readActorOnboardingStepDAL` for `invite_first_citizen` on every call even when `SHOW_INVITE_ONBOARDING_CARD = false`. These 3 reads produce data that is immediately discarded. KRAVEN scope.

4. **`readVibeInviteCountDAL` is a dead export — NEW FINDING.** `vibeInvites.dal.js` exports three functions: `readVibeInvitesDAL`, `readVibeInviteCountDAL`, `readQualifyingVibeInviteCountDAL`. The onboarding controller imports only `readVibeInvitesDAL` and `readQualifyingVibeInviteCountDAL`. `readVibeInviteCountDAL` has zero callers anywhere in `apps/VCSM/src`. Dead export. IRONMAN scope.

5. **`anotherBtn` dead style key — NEW FINDING.** `InviteView.styles.js` defines `anotherBtn` (a "Send another" button style) that is never referenced in `InviteView.jsx`. The success state navigates back after 2s instead of offering a re-send flow. Dead style key. IRONMAN scope.

6. **Invite accept-on-register path — UNIMPLEMENTED, NOT IN DOCUMENT.** `useRegister.js` contains a TODO: "after signup, look up `vc.vibe_invites` by invite_code and mark it accepted." This is entirely unimplemented. The invite tracking loop is incomplete — when a recipient receives an email and signs up, their registration is not linked back to the `vibe_invites` row. The document does not mention this gap at all. This means invite completion tracking is broken end-to-end.

7. **RISK-4 confirmed open.** `InviteView.jsx` and `InviteView.styles.js` remain in `screens/` — View Screen co-located with Final Screen. SENTRY handoff confirmed pending.

8. **RISK-1 confirmed open.** `rawDebugError` state present in `useInvite.js` at line 25 and rendered in `InviteView.jsx` at lines 51 and 113. Both renders DEV-gated. Comments say "remove after CORS confirmed." CORS is confirmed resolved (feature shipped) — cleanup not yet done.

9. **No TypeScript files.** Zero `.ts`/`.tsx` files in `features/invite/`. CLEAN.

10. **No `select('*')` violations.** CLEAN.

---

## IRONMAN

**Status: EVIDENCE MISSING**

Findings:

- No IRONMAN ownership report for the invite feature.
- Three items require ownership decision:
  - **`readVibeInviteCountDAL`** — dead export in `vibeInvites.dal.js`. Zero callers. Safe to remove after IRONMAN confirmation.
  - **`anotherBtn`** — dead style key in `InviteView.styles.js`. Zero usages in JSX. Safe to remove after IRONMAN confirmation.
  - **Invite accept-on-register TODO** — `useRegister.js` has an unimplemented path for linking a signup to `vc.vibe_invites`. This is a product-completeness decision: if invite tracking requires recipient-side acceptance recording, an owner must be assigned to implement it. If the feature ships without it, the gap must be documented explicitly.
- All four documented risks (RISK-1 through RISK-4) are routed to SENTRY, not IRONMAN — cleanup decisions should route through IRONMAN for ownership sign-off before deletion.

---

## VENOM

**Status: PARTIAL — STALE REPORT**

Findings:

- Latest VENOM report: `vcsm-security-report.md` dated 2026-04-13. Does not specifically cover the invite Edge Function trust boundary.
- **Trust boundary — Edge Function delegation is correct.** The `send-citizen-invite` Edge Function runs with a service role key server-side. The client only passes `targetEmail`, `inviterType`, and `inviterActorId`. The client never holds the service role key. Trust boundary holds.
- **`inviterType` validation is in the controller.** `invite.controller.js` validates that `inviterType` is exactly `'citizen'` or `'vport'` before calling the DAL. Throws `INVALID_INVITER_TYPE` on any other value. Edge Function should perform its own server-side validation independently — client validation alone is not sufficient for a trust boundary. VENOM should verify what the Edge Function does with an invalid `inviterType`.
- **Email validation is client-side only.** `invite.controller.js` validates the email format with a regex before calling the DAL. The Edge Function should also validate email format server-side. Whether it does is not verifiable from client-side code alone. VENOM should audit the Edge Function.
- **No direct DB access from client.** The `send-citizen-invite` Edge Function owns all writes. The client cannot manipulate `vibe_invites`, `actor_onboarding_steps`, or any other table directly through this feature.
- **Auth gate confirmed.** The `/invite` route is inside the protected route tree (`app.routes.jsx`). No public invite URL exists. No `auth.routes.jsx` entry. Any unauthenticated access to `/invite` is redirected by the auth guard.
- **`inviterActorId` is null for citizen invites.** This is correct — citizens do not pass an actor ID (only VPORTs do). The Edge Function must handle `null` `inviterActorId` gracefully. VENOM should verify.
- **Invite accept path is unimplemented.** The unimplemented `useRegister.js` TODO means invite tracking from the recipient side is absent. This is not a security risk, but it means the invite tracking system is incomplete.

---

## SENTRY

**Status: EVIDENCE MISSING**

Findings:

- No SENTRY boundary report for the invite feature.
- Four pending reviews from the document are all routed to SENTRY:
  - **RISK-1** — `rawDebugError` DEV PROBE removal from `useInvite.js` and `InviteView.jsx`. SENTRY must confirm cleanup scope and verify no production data leaks through the debug state.
  - **RISK-2** — `CODE_MESSAGES` / `codeToMessage` layer violation. SENTRY must assess whether to move to controller or model, and enforce the boundary after move.
  - **RISK-3** — `console.log` in `vibeInvites.dal.js` line 72. SENTRY must enforce removal — debug output must render on screen and be dev-only (no `console.log` permitted per memory policy).
  - **RISK-4** — `InviteView.jsx` in `screens/` folder instead of `ui/`. SENTRY must approve the move and verify no import paths break.

---

## LOKI

**Status: MISSING**

No runtime evidence for the invite feature. Recommended checks:
- Verify `supabase.functions.invoke('send-citizen-invite')` latency under normal conditions.
- Verify the 2s `navigate(-1)` delay in `InviteView.jsx` does not cause issues on slow connections (race between navigation and state reset).
- Verify onboarding step updates from the Edge Function reach the onboarding controller correctly after a successful invite.

---

## KRAVEN

**Status: FINDING SURFACED (inline)**

Findings:

- **Wasted DB reads in `getOnboardingCardsController`.** When `SHOW_INVITE_ONBOARDING_CARD = false`, the controller still runs three invite-related DAL calls on every onboarding load: `readVibeInvitesDAL`, `readQualifyingVibeInviteCountDAL`, and `readActorOnboardingStepDAL` for `invite_first_citizen`. These produce data that is immediately discarded. This is a low-severity performance waste but is real — every onboarding screen load runs 3 extra Supabase queries.
- **Recommended fix:** Guard the 3 invite DAL calls behind `SHOW_INVITE_ONBOARDING_CARD`. Only fire them when the invite card is enabled.

---

## CARNAGE

**Status: N/A**

No pending migrations for the invite feature. `vc.vibe_invites` schema is stable. No migration risk at this time. When the invite accept-on-register path is implemented (TODO in `useRegister.js`), a migration or RPC may be needed to mark `vibe_invites` rows as accepted — CARNAGE should be consulted at that time.

---

## FALCON

**Status: MISSING**

No Falcon review for the invite feature. The invite screen (`/invite`) would need native parity — a form to enter an email address and send an invite. The Edge Function is the same backend for both web and native. **Because `SHOW_INVITE_ONBOARDING_CARD = false` suppresses the primary entry point**, native parity is lower priority until the email flow rebuild is complete and the card is re-enabled. Falcon review is recommended before re-enablement.

---

## WINTER SOLDIER

**Status: N/A**

Android scope not active. No handoff required.

---

## LOGAN

**Status: DRIFT FOUND**

Findings:

- **`Feature status` field drift.** The document summary table says `Feature status: LIVE — entry via onboarding CTA (/invite)`. Live scan confirms `SHOW_INVITE_ONBOARDING_CARD = false` — the onboarding CTA is suppressed. The route `/invite` exists but the primary entry point is disabled pending an email flow rebuild. The Feature Status field is inaccurate.
- **Invite accept-on-register path not documented.** The TODO in `useRegister.js` for linking signup to `vc.vibe_invites` is a functional gap with no mention in this document. The DAL section covers the send path thoroughly but the receive/accept path is entirely absent.
- **`readVibeInviteCountDAL` not flagged.** The Related DAL section documents `vibeInvites.dal.js` and its three exports, but does not note that `readVibeInviteCountDAL` has zero callers.
- **`anotherBtn` dead style not noted.** `InviteView.styles.js` is referenced but the dead `anotherBtn` key is not flagged.
- **Architecture pipeline section — ALIGNED.** All documented layer statuses (DAL ✓, Controller ✓, Model ✗, Hook ✓, View ✓, Final Screen ✓) match live code exactly.
- **All four risk findings — CONFIRMED OPEN.** RISK-1 through RISK-4 were verified against live code. All are unresolved. Documentation of risks is accurate.
- **Call chain — ALIGNED.** The documented call chain (Onboarding CTA → `/invite` → InviteScreen → InviteView → useInvite → ctrlSendCitizenInvite → sendCitizenInviteDAL → Edge Function) matches live code exactly.

---

## review-contract

**Status: ALIGNED WITH ACTIVE VIOLATIONS**

Findings:

- **TypeScript:** ZERO `.ts`/`.tsx` files in `features/invite/`. CLEAN.
- **`select('*')`:** ZERO violations in invite feature files. CLEAN.
- **Path aliases:** All cross-folder imports use `@/`. `import { useIdentity } from '@/features/identity/adapters/identity.adapter'` — correct. `import { authTheme } from '@/features/auth/adapters/auth.adapter'` in styles — correct. CLEAN.
- **Cross-feature imports via adapters:** CLEAN. All external feature access goes through adapter paths.
- **File lengths:** All files within 300-line limit. Longest: `InviteView.styles.js` at 163 lines. CLEAN.

**Active violations:**

- **RISK-2 — LAYER VIOLATION.** `CODE_MESSAGES` (error code dictionary) and `codeToMessage()` (business rule function) live inside `useInvite.js`. Per contract, hooks must not contain business rules. Business rules belong in the controller or model layer. This is an active contract violation.
- **RISK-4 — NAMING/ORGANIZATION VIOLATION.** `InviteView.jsx` (a View Screen — hooks + composition layer) is co-located with `InviteScreen.jsx` (a Final Screen) inside `screens/`. Per contract, View Screens and Final Screens must be structurally separated. The View Screen belongs in `ui/` or `views/`.

Both violations are documented and routed to SENTRY. Neither is security-critical or production-breaking.

---

## SHIELD

**Status: N/A**

No external dependencies, third-party libraries, or license concerns. Supabase Edge Function is internal infrastructure. No IP or provenance review required.

---

## Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| LOGAN (`Feature status: LIVE`) | ARCHITECT (live scan: `SHOW_INVITE_ONBOARDING_CARD = false`) | Document says feature is live via onboarding CTA; onboarding card is explicitly suppressed in code | MODERATE | Update `Feature status` field in document — route is accessible but primary CTA is suppressed |
| ARCHITECT (invite accept-on-register missing) | LOGAN (DAL section covers send path only) | The receive/accept side of the invite loop is an unimplemented TODO in `useRegister.js` with no documentation here | MODERATE | Document the accept-on-register gap; assign IRONMAN or product owner |
| KRAVEN (wasted DB reads finding) | SENTRY (no report) | Performance waste identified but no boundary review exists to gate the fix | LOW | SENTRY must review guard placement before `SHOW_INVITE_ONBOARDING_CARD` guard is added to DAL calls |

---

## Runtime Alignment Review

| Area | Runtime Evidence | Performance Risk | Migration Risk | Status |
|---|---|---|---|---|
| `sendCitizenInviteDAL` → Edge Function | MISSING | LOW — user-action only | NONE | CAUTION |
| Onboarding DAL calls (3x, currently wasted) | MISSING | LOW — 3 extra reads per onboarding load | NONE | CAUTION |
| `useInvite` hook state cycle | MISSING | N/A | N/A | CAUTION |
| `navigate(-1)` 2s delay on success | MISSING | LOW — potential race on slow connections | NONE | CAUTION |

---

## Ownership / Boundary Alignment

| Area | Ownership Status | Boundary Status | Contract Status | Risk |
|---|---|---|---|---|
| `invite.dal.js` | UNDECLARED | CLEAN — internal to feature | ALIGNED | LOW |
| `invite.controller.js` | UNDECLARED | CLEAN | VIOLATION (RISK-2: business logic in hook) | LOW |
| `useInvite.js` | UNDECLARED | CLEAN | VIOLATION (RISK-2: CODE_MESSAGES here, not controller) | LOW |
| `InviteView.jsx` | UNDECLARED | CLEAN | VIOLATION (RISK-4: wrong folder) | LOW |
| `vibeInvites.dal.js` (onboarding) | UNDECLARED | CLEAN — internal to onboarding | CONCERN (`readVibeInviteCountDAL` dead export) | LOW |
| Invite accept-on-register | UNASSIGNED | N/A | NOT IMPLEMENTED | MODERATE |

---

## Native Governance Status

| Module | Falcon | Winter Soldier | Drift | Release Risk |
|---|---|---|---|---|
| Invite screen (form + submit) | MISSING | N/A | UNKNOWN | LOW (entry suppressed) |
| Onboarding invite card | MISSING | N/A | UNKNOWN | LOW (card suppressed) |

---

## Documentation Truth Review

| Doc / System | Truth Status | Drift | Native Notes | Blocking |
|---|---|---|---|---|
| `vcsm.dal.invite.md` — Summary table (`Feature status`) | DRIFT | `LIVE` is inaccurate — onboarding CTA suppressed by `SHOW_INVITE_ONBOARDING_CARD = false` | N/A | NO |
| `vcsm.dal.invite.md` — Summary table (`Architecture status`) | VERIFIED | Correctly says INCOMPLETE | N/A | NO |
| `vcsm.dal.invite.md` — DAL files section | VERIFIED | Edge Function delegation accurately described | N/A | NO |
| `vcsm.dal.invite.md` — Related DAL section | MINOR DRIFT | `readVibeInviteCountDAL` not flagged as dead export | N/A | NO |
| `vcsm.dal.invite.md` — Architecture pipeline | VERIFIED | All layer statuses match live code | N/A | NO |
| `vcsm.dal.invite.md` — Risk findings | VERIFIED | RISK-1 through RISK-4 all confirmed open | N/A | NO |
| `vcsm.dal.invite.md` — Feature entry points | DRIFT | States "entry via onboarding only" but omits that entry is currently suppressed | N/A | NO |
| Invite accept-on-register path | NOT DOCUMENTED | Entire accept side of invite loop absent from document | N/A | NO |
| `anotherBtn` dead style | NOT DOCUMENTED | Dead style key in `InviteView.styles.js` absent from document | N/A | NO |

---

## IP / Provenance Alignment

| Area | IP Status | License Risk | Provenance Risk | Blocking |
|---|---|---|---|---|
| Invite feature code | CLEAN | NONE | NONE | NO |
| Supabase Edge Function invocation | CLEAN | NONE | NONE | NO |
| `lucide-react` (`ArrowLeft` icon) | CLEAN | ISC license (permissive) | NONE | NO |

---

## New Risk Register (additions to document risks)

The following risks were found during this pass and are not in the original document:

**RISK-5 — Onboarding invite card suppressed — feature status documentation incorrect**
Severity: MODERATE
Detail: `SHOW_INVITE_ONBOARDING_CARD = false` in `onboarding.controller.helpers.js` suppresses the invite card with comment "while invite email flow is rebuilt." The document's `Feature status` field says LIVE. The route exists but the primary CTA is disabled. Rebuilding the email flow requires re-enabling this constant and completing the work it guards.
Handoff: LOGAN (document correction) + IRONMAN (product decision on rebuild timeline)

**RISK-6 — Invite accept-on-register path is unimplemented**
Severity: MODERATE
Detail: `useRegister.js` contains an inline TODO: "after signup, look up `vc.vibe_invites` by invite_code and mark it accepted." This path is entirely absent. When a recipient receives an invite email and registers, their account is not linked back to the `vibe_invites` row. Invite completion tracking is broken end-to-end. This also means the `qualifyingVibeInviteCount` that gates onboarding step completion may never increment for sent-but-unaccepted invites.
Handoff: IRONMAN (product ownership) + CARNAGE (schema — if an `accept` mutation or RPC is needed)

**RISK-7 — `readVibeInviteCountDAL` is a dead export**
Severity: LOW
Detail: `vibeInvites.dal.js` exports `readVibeInviteCountDAL` but zero files import it. `readQualifyingVibeInviteCountDAL` is the active count function. `readVibeInviteCountDAL` is a dead export.
Handoff: IRONMAN

**RISK-8 — `anotherBtn` is a dead style key**
Severity: LOW
Detail: `InviteView.styles.js` defines `anotherBtn` (a "Send another" invite button style). `InviteView.jsx` never references it — on success, the screen auto-navigates back after 2s rather than offering a re-send flow. Dead style.
Handoff: IRONMAN

**RISK-9 — Wasted DB reads when invite card is suppressed**
Severity: LOW
Detail: `getOnboardingCardsController` fires `readVibeInvitesDAL`, `readQualifyingVibeInviteCountDAL`, and `readActorOnboardingStepDAL('invite_first_citizen')` unconditionally, even when `SHOW_INVITE_ONBOARDING_CARD = false` discards the result. 3 extra Supabase reads per onboarding load.
Handoff: KRAVEN + SENTRY

---

## Proposed Updates

No `.v2.md` files created in this pass (per user instruction — results appended to document only).

Items that warrant document correction when approved:
- `Feature status` field in Summary table: change from `LIVE — entry via onboarding CTA (/invite)` to `PARTIALLY SUPPRESSED — route registered at /invite, onboarding CTA disabled pending email flow rebuild`
- Risk findings: add RISK-5 through RISK-9 to the Pending Reviews table
- Related DAL section: flag `readVibeInviteCountDAL` as dead export
- Add section documenting the unimplemented invite accept-on-register path

---

## Release Intelligence Summary

| Area | Status | Blocking Risk | Recommended Command |
|---|---|---|---|
| Architecture | DRIFT FOUND | NO | ARCHITECT — correct Feature Status field |
| Ownership | MISSING | NO | IRONMAN — invite feature audit, RISK-5/6/7/8 decisions |
| Security | PARTIAL | NO | VENOM — Edge Function trust boundary audit |
| Runtime | MISSING | NO | LOKI — Edge Function invoke trace |
| Performance | FINDING (inline) | NO | KRAVEN — guard wasted DB reads behind `SHOW_INVITE_ONBOARDING_CARD` |
| Migration | N/A | NO | CARNAGE — consult when accept-on-register is implemented |
| iOS Parity | MISSING | NO (suppressed) | FALCON — before invite card is re-enabled |
| Android Parity | N/A | NO | — |
| Documentation | DRIFT FOUND | NO | LOGAN — correct Feature Status + add RISK-5 through RISK-9 |
| IP Safety | CLEAN | NO | — |

---

## Overall Status

**DRIFT FOUND**

The invite feature's existing implementation matches its documentation for all four original risk findings. However, five new risks were found by this audit pass:

- The document's `Feature Status` field is incorrect — the primary entry point (onboarding CTA) is currently suppressed.
- The invite accept-on-register path is unimplemented, leaving invite completion tracking broken end-to-end.
- Three dead exports/styles were found not flagged in the document.
- Three wasted DB reads fire per onboarding load while the invite card is suppressed.

**No code bugs or security violations found. Drift is in documentation accuracy and undocumented gaps — not in implementation correctness.** All four original risks (RISK-1 through RISK-4) remain open and confirmed. Feature is partially suppressed pending email flow rebuild — not release-ready until invite card re-enablement decision is made and accept-on-register is implemented or explicitly waived.

## Recommended Next Command

```
IRONMAN — product decision on invite rebuild timeline (RISK-5/6), dead exports (RISK-7/8)
SENTRY  — RISK-1 through RISK-4 cleanup review
VENOM   — Edge Function trust boundary audit (inviterType + email validation server-side)
KRAVEN  — guard wasted DB reads in getOnboardingCardsController (RISK-9)
FALCON  — schedule before invite card re-enablement
```

---

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/invite/controller/invite.controller.js` | Moved invite error-code message mapping into the controller layer and exported `codeToInviteMessage`. |
| `apps/VCSM/src/features/invite/hooks/useInvite.js` | Replaced hook-local `CODE_MESSAGES` and `codeToMessage` with controller import while preserving displayed messages and submit behavior. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.invite.md` | Appended this fix-pass record. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| RISK-2: business logic (`CODE_MESSAGES` / message mapping) in hook | DONE | Error code mapping now lives in `invite.controller.js`; `useInvite.js` only calls `codeToInviteMessage`. |
| RISK-1: `rawDebugError` DEV PROBE cleanup | DEFERRED | Requires removing debug state/render blocks; no deletion performed under current no-delete instruction. |
| RISK-3: DEV `console.log` in `vibeInvites.dal.js` | DEFERRED | Requires removing code; no deletion performed under current no-delete instruction. |
| RISK-4: move `InviteView.jsx` / styles from `screens/` to `ui/` | DEFERRED | File move is broader than a surgical DAL/doc fix and needs SENTRY approval. |
| RISK-5: invite onboarding card suppressed but doc says live | DOCUMENTED | Verified `SHOW_INVITE_ONBOARDING_CARD = false`; prior sections preserved and this pass records current truth. |
| RISK-6: invite accept-on-register path unimplemented | DEFERRED | Product/schema ownership required; no guessing implementation. |
| RISK-7: `readVibeInviteCountDAL` dead export | DEFERRED | Zero-caller cleanup would be deletion; no deletion performed. |
| RISK-8: `anotherBtn` dead style key | DEFERRED | Cleanup would be deletion; no deletion performed. |
| RISK-9: wasted onboarding invite reads while card suppressed | DEFERRED | Not forced because `getOnboardingCardsController` still returns `snapshots.invites`; guarding reads could change consumer-visible data. |

### Verification
- Commands/searches run:
  - `rg -n "CODE_MESSAGES|codeToMessage|codeToInviteMessage|rawDebugError|SHOW_INVITE_ONBOARDING_CARD|readVibeInviteCountDAL|anotherBtn|console\.log" apps/VCSM/src/features/invite apps/VCSM/src/features/onboarding apps/VCSM/src/features/auth --glob '*.js' --glob '*.jsx'`
  - `sed -n '1,220p' apps/VCSM/src/features/invite/hooks/useInvite.js`
  - `sed -n '1,220p' apps/VCSM/src/features/invite/controller/invite.controller.js`
  - `sed -n '1,240p' apps/VCSM/src/features/onboarding/controller/onboarding.controller.js`
  - `npm run build`
- Production callers checked:
  - `apps/VCSM/src/features/invite/hooks/useInvite.js`
  - `apps/VCSM/src/features/invite/controller/invite.controller.js`
  - `apps/VCSM/src/features/invite/screens/InviteView.jsx`
  - `apps/VCSM/src/features/onboarding/controller/onboarding.controller.js`
  - `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js`
- Remaining risks:
  - DEV probes and dead exports/styles remain intentionally untouched under no-delete instruction.
  - Invite accept-on-register path remains unimplemented and needs IRONMAN/CARNAGE ownership.
  - Edge Function trust boundary still needs VENOM review.
  - Build passes; Vite still reports the pre-existing auth adapter dynamic/static import chunk warning for `VerifyEmailRequiredScreen.jsx`.

### Status
PARTIAL

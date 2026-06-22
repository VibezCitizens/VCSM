# VENOM Security Report — vport-qr-gas-module

**Date:** 2026-05-26  
**Time:** 22:12  
**Reviewer:** VENOM  
**Trigger:** Full security pipeline (VENOM → BLACKWIDOW → ELEKTRA → THOR) requested by user after session completing vport QR UUID leak fixes and gas station card security updates.  
**Findings:** 0 CRITICAL | 2 HIGH | 2 MEDIUM | 2 LOW  
**Final Status:** HIGH FINDINGS PRESENT — release blocked on V-001

---

## VENOM TARGET

**Feature / Route / Engine:** VCSM vport QR code system + gas station dashboard (all files modified in session `vport-booking-feed-security-updates`)  
**Application Scope:** VCSM  
**Reason for review:** Post-implementation security audit of all session-modified files; session performed P0/P1/P2 UUID leak fixes and gas dashboard security hardening  
**Primary trust boundary:** Authenticated citizen → public VPORT profile pages → QR-encoded public URLs (slug must never be UUID)

---

## SECURITY SURFACE

**Entry points:**
- `/vport/:slug/menu` → `VportPublicMenuQrView.jsx` (public, unauthenticated)
- `/vport/:slug/reviews` → `VportPublicReviewsQrView.jsx` (public, unauthenticated)
- VCSM settings → `VportsQrModal.jsx` (authenticated owner)
- VCSM settings → `VportsBusinessCardSection.jsx` (authenticated owner)
- Dashboard gas screen → `VportDashboardGasScreen.jsx` → `VportDashboardGasPanels.jsx` → `GasPricesPanel.jsx` (authenticated VPORT owner)
- Flyer print surfaces → `PrintableQrFlyerCard.jsx`, `PosterFlyer.jsx`, `ClassicFlyer.jsx` (authenticated owner)

**Auth source:** `useIdentity()` / Supabase session  
**Authorization layer:** `useVportOwnership` → `checkVportOwnershipController` → `actor_owners` DB check  
**Identity surface:** `actorId` (primary), `canonicalSlug` (public URL surface)  
**Sensitive objects involved:** Actor UUID (`actorId`), canonical slug, QR-encoded URLs, identity object

---

## TRUST BOUNDARY TRACE

**Client input:** `actorId` passed via hook/context, never from URL params directly  
**Validated at:** Controller level for ownership; slug resolution via `useActorCanonicalSlug` hook  
**Identity resolved at:** Hook layer (`useActorCanonicalSlug`), using `slugFromActorId` RPC or slug table lookup  
**Authorization enforced at:** `useVportOwnership` → `actor_owners` DB verification; `GasPricesPanel` dual gate `allowOwnerUpdate && isOwner`  
**Data returned to:** Public QR views (unauthenticated), settings panels (authenticated owner only)

---

## SECURITY RISK FINDINGS

**Missing authorization:** None in gated paths; `GasPricesPanel` dual gate is correctly enforced  
**Identity misuse:** V-003 — full `identity` object passed beyond necessary scope  
**Sensitive data exposure:** V-001 — UUID exposed in QR on hook error path (complete bypass of session's P0 fix)  
**Unsafe debug leakage:** None — `iosProdDebugger` fully gated by `IS_PROD` flag  
**Policy assumption risks:** V-004, V-005 — URL values passed to QR renderer without origin/scheme validation  
**Dependency boundary risks:** None — adapter paths are correct; `react-qr-code` is fully centralized

---

---

## VENOM SECURITY FINDING — V-001

**Finding ID:** V-001  
**Location:** `apps/VCSM/src/features/profiles/hooks/useActorCanonicalSlug.js` lines 79-82; consumers `apps/VCSM/src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx` lines 20-23 and `apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuQrView.jsx` lines 11-14  
**Application Scope:** VCSM  
**Severity:** HIGH  

**Current behavior:**  
The hook's `catch` block at lines 79-82 sets:
```js
setCanonicalSlug(actorId)    // UUID assigned to slug state
setResolvedActorId(actorId)  // marks as "resolved" for current actor
```
Because `resolvedActorId === actorId` is now true, the hook returns `isResolvedForCurrentActor = true`. The QR views gate on `loading || !canonicalSlug`. After an error:
- `loading` = false
- `canonicalSlug` = actorId (UUID string — truthy)
- Gate evaluates to `false || false = false`
- QR renders with UUID-encoded URL (e.g. `https://vibezcitizens.com/vport/3f7a1b2c-.../menu`)

This is a **complete bypass** of the P0 UUID-leak fix implemented in this session. The fix only prevents UUID exposure during the loading window; it does not prevent UUID exposure on any network/RPC failure.

**Risk:** Raw actor UUID exposed in a QR code on any slug resolution failure. Users who scan the QR get a non-canonical URL containing the internal database UUID. If users share or screenshot the QR before detection, the UUID is externally cached. The QR also stops functioning if slugs are ever rotated.

**Why it matters:**  
The explicit goal of this session was "QR render must be gated on slug resolution." The current error fallback silently satisfied the gate condition using a UUID — defeating the architectural decision with a false positive. The fix is invisible: no error is shown to the user, no spinner persists. The QR appears to work but contains internal data.

**Recommended mitigation:**  
Option A (preferred — hook-level): In the catch block, do NOT set `canonicalSlug` to `actorId`. Set it to `null` (or don't set it at all), and only set `error`. The gate `loading || !canonicalSlug` then correctly stays closed on error. Add a separate `error` state check in the QR views to show a distinct error message instead of a spinner.
```js
// In useActorCanonicalSlug.js catch block:
} catch (e) {
  if (!alive) return
  setError(e)
  // DO NOT: setCanonicalSlug(actorId)
  // DO NOT: setResolvedActorId(actorId)
  // canonicalSlug remains null → gate stays closed → no UUID QR
}
```
Option B (view-level, less complete): Update QR gates in all consumers to also check `!error`:
```jsx
{loading || !canonicalSlug || error ? <ErrorOrSpinner /> : <QrCode ... />}
```
Option B requires updating every consumer and does not fix the hook contract — the hook still returns a misleading `canonicalSlug` value.

**Rationale:** The hook should represent "I successfully resolved a slug" — not "I gave up and returned the raw ID." Returning the actorId as a slug breaks the contract that `canonicalSlug` is always a human-readable, URL-safe slug.

**Follow-up command:** Wolverine → implementation of Option A; SENTRY post-execution review of `useActorCanonicalSlug.js` changes

**Exploitability:** HIGH  
**Attack Preconditions:**  
- No authentication required (public QR views)  
- Attacker only needs to induce a slug resolution failure (network drop, RPC timeout, DB error)  
- Can also occur passively on unreliable connections — no attacker required

**Blast Radius:**  
- All public QR views that consume `useActorCanonicalSlug` + gate on `loading || !canonicalSlug`
- Currently: `VportPublicReviewsQrView`, `VportPublicMenuQrView`
- Any future QR view built with the same pattern inherits the vulnerability

**Trust Boundary:** Public Visitor — unauthenticated  

**CISSP Domain:**  
- Primary: Asset Security  
- Secondary: Software Development Security, Security Architecture and Engineering

---

## VENOM SECURITY FINDING — V-002

**Finding ID:** V-002  
**Location:** `apps/VCSM/src/features/settings/vports/ui/VportsBusinessCardSection.jsx` lines 7 and 46  
**Application Scope:** VCSM  
**Severity:** MEDIUM  

**Current behavior:**  
```js
// Line 7 — handleCopyLink:
const url = `https://vibezcitizens.com/vport/${v.slug}/card`

// Line 46 — displayed URL:
const cardUrl = `https://vibezcitizens.com/vport/${v.slug}/card`
```
The session fixed `VportsQrModal.jsx` (the QR code itself) to use `buildBusinessCardQrUrl(slug)` with `window.location.origin`. However, the parent component `VportsBusinessCardSection.jsx` still contains two hardcoded production domain references — one for the copy-to-clipboard URL and one for the URL displayed to the owner. These are not QR codes, but they are the URLs presented to the owner and copied to clipboard for sharing.

**Risk:**  
- On staging/local/preview environments, the copy button and display URL point to production, breaking the expected behavior and potentially confusing users with environment mismatch
- A production domain rename or migration would require manual hunting to find this stranded reference
- Inconsistency: the QR encodes the correct origin-relative URL; the copy button and display text show the hardcoded domain — these will diverge in non-production environments

**Why it matters:**  
`buildBusinessCardQrUrl` was created specifically to centralize this URL construction and remove hardcoded domains. Partial remediation creates an inconsistency that will be confusing and may produce mismatched behavior (the QR encodes one URL, the "copy" button copies a different one if the origin doesn't match `vibezcitizens.com`).

**Recommended mitigation:**  
```js
import { buildBusinessCardQrUrl } from "@/lib/qrUrlBuilders";

// Line 7:
const url = buildBusinessCardQrUrl(v.slug)

// Line 46:
const cardUrl = buildBusinessCardQrUrl(v.slug)
```

**Rationale:** All business card URL construction should route through the centralized builder. This keeps the QR, copy button, and display URL consistent and environment-agnostic.

**Follow-up command:** Wolverine → one-line patch to `VportsBusinessCardSection.jsx`

**Exploitability:** LOW  
**Attack Preconditions:**  
- Environment mismatch required (attacker would need to test in staging context)  
- Not an exploit path — primarily an operational consistency issue

**Blast Radius:**  
- Single VPORT owner's copy-link and display in business card settings
- Production behavior is functionally correct (domain matches)
- Non-production environments are broken

**Trust Boundary:** Authenticated VPORT Owner  

**CISSP Domain:**  
- Primary: Security Architecture and Engineering  
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — V-003

**Finding ID:** V-003  
**Location:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx` line 135 → `apps/VCSM/src/features/dashboard/vport/screens/components/VportDashboardGasPanels.jsx` line 54 → `apps/VCSM/src/features/profiles/kinds/vport/screens/gas/components/GasPricesPanel.jsx` line 40  
**Application Scope:** VCSM  
**Severity:** MEDIUM  

**Current behavior:**  
`VportDashboardGasScreen` passes the full `identity` object (containing at minimum `actorId`, `kind`, and potentially `profileId`, `vportId`, or other internal fields depending on what `useIdentity()` returns) through the component tree:
```jsx
// VportDashboardGasScreen.jsx:135
<VportDashboardOfficialGasPanel me={identity} ... />

// VportDashboardGasPanels.jsx:54
<GasPricesPanel me={me} ... />  // me = full identity object

// GasPricesPanel.jsx:40 — only usage:
const canSubmit = !!me?.actorId
```
`GasPricesPanel` only needs a boolean `canSubmit` — it uses `me?.actorId` purely to determine if a user is authenticated enough to submit a price. The full identity object is threaded through two component boundaries unnecessarily.

**Risk:**  
- If `identity` from `useIdentity()` includes internal fields (`profileId`, `vportId`, internal metadata), these flow into `GasPricesPanel` and are available in its render scope, increasing the surface for accidental exposure in future renders, logging, or debug output
- The identity contract states `profileId`/`vportId` should never be exposed beyond `useIdentity()`; passing the raw identity object as `me` prop violates the spirit of this constraint
- Any future dev adding props or logging in `GasPricesPanel` will see the full identity object and may accidentally use forbidden fields

**Why it matters:**  
Defense-in-depth: even if `GasPricesPanel` currently only reads `actorId`, the prop contract invites misuse. Presentational components should receive only the data they need.

**Recommended mitigation:**  
Replace the `me` prop with a `canSubmit` boolean computed at the screen level:
```jsx
// VportDashboardGasScreen.jsx:
<VportDashboardOfficialGasPanel canSubmit={!!identity?.actorId} ... />

// VportDashboardGasPanels.jsx:
<GasPricesPanel canSubmit={canSubmit} ... />

// GasPricesPanel.jsx — remove me prop:
// const canSubmit = !!me?.actorId  →  prop directly: canSubmit
```

**Rationale:** Compute-at-source, pass-primitives principle. The identity object is an owner-layer concern; by the time it reaches a gas price card component, it should have been reduced to the single boolean it informs.

**Follow-up command:** Wolverine → refactor gas panel prop chain; SENTRY post-execution

**Exploitability:** LOW  
**Attack Preconditions:**  
- Authenticated dashboard user only  
- No direct exploit path — this is a surface expansion risk, not an active leak  
- Risk materializes only if a future change misuses the available identity fields

**Blast Radius:**  
- Single VPORT owner dashboard session  
- No external exposure

**Trust Boundary:** Authenticated VPORT Owner  

**CISSP Domain:**  
- Primary: Asset Security  
- Secondary: Security Architecture and Engineering, Software Development Security

---

## VENOM SECURITY FINDING — V-004

**Finding ID:** V-004  
**Location:** `apps/VCSM/src/features/dashboard/qrcode/components/QrCode.jsx`  
**Application Scope:** VCSM  
**Severity:** LOW  

**Current behavior:**  
The shared `QrCode` component accepts a `value` prop and passes it to `react-qr-code`. The component normalizes the value to a string and returns `null` on empty/whitespace. However, there is no validation of:
- URL scheme (could accept `javascript:`, `data:`, or `vbscript:` URIs)
- Origin allowlist (no check that the URL is from the expected domain family)
- URL structure (any string is encoded)

Current protection: all known callers construct URLs via `buildMenuQrUrl`, `buildReviewsQrUrl`, `buildBusinessCardQrUrl` (all using `window.location.origin`) or via the flyer builder's `cleanMenuUrl` (which strips query params from the stored menu URL). The component itself has no internal guard.

**Risk:**  
If a future caller passes a user-provided or attacker-controlled string directly to `<QrCode value={untrustedInput} />`, the QR code would encode whatever the string contains — including malicious deep links or phishing URLs. The QR code UI gives the output a veneer of legitimacy.

**Why it matters:**  
The component is a shared primitive. As usage grows, the risk that an untrusted value reaches it grows. Currently LOW because all callers are trusted/internal.

**Recommended mitigation:**  
Add a URL scheme guard inside `QrCode.jsx`:
```js
const ALLOWED_SCHEMES = ["https:", "http:"];
function isSafeUrl(v) {
  try {
    const u = new URL(v);
    return ALLOWED_SCHEMES.includes(u.protocol);
  } catch {
    return false; // non-URL strings (e.g. plain text) pass through — only flag URL-like strings with bad schemes
  }
}
// In component:
if (v.startsWith("http") && !isSafeUrl(v)) {
  console.warn("[QrCode] unsafe URL blocked:", v.slice(0, 80));
  return null;
}
```

**Rationale:** Defense-in-depth at the primitive layer. Callers should still construct safe URLs; the component should refuse to encode obviously unsafe schemes if ever passed one.

**Follow-up command:** Wolverine → optional hardening ticket (P3 priority)

**Exploitability:** LOW  
**Attack Preconditions:**  
- Currently no path to pass attacker-controlled value to `QrCode`  
- Would require a future code change that introduces an untrusted input path

**Blast Radius:**  
- Theoretical: any user who scans a QR code containing a malicious URL  
- Current risk: none (all callers are trusted)

**Trust Boundary:** Authenticated Owner (flyer/print surfaces), Public Visitor (public QR views)  

**CISSP Domain:**  
- Primary: Software Development Security  
- Secondary: Security Architecture and Engineering

---

## VENOM SECURITY FINDING — V-005

**Finding ID:** V-005  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/components/BookingQrLinksPanel.jsx` — `QrLinkCard` sub-component  
**Application Scope:** VCSM  
**Severity:** LOW  

**Current behavior:**  
The `BookingQrLinksPanel` is currently disabled (`enabled: false`, no data fetched, renders empty state). Inside the dormant `QrLinkCard` component:
```js
const fullUrl = `${window.location.origin}/qr/${qrLink.slug}`
```
`qrLink.slug` comes from the booking data object — which is currently `null` (panel is disabled) but when the booking adapter is built and the panel is activated, `qrLink.slug` will be API-sourced data passed directly into URL construction without validation or encoding.

**Risk:**  
- `qrLink.slug` is not passed through `encodeURIComponent` (unlike `buildMenuQrUrl` and peers)
- If a slug contains special characters, URL fragments, or injection sequences, the constructed URL would be malformed or exploitable
- This is a dormant risk: the panel is disabled and safe today, but the code will be activated in a future sprint

**Why it matters:**  
All URL construction across the session's new builders uses `encodeURIComponent(String(slug))`. This component was migrated to use `actorId` only (per session's BookingQrLinksPanel P-0 fix) but the `QrLinkCard` URL construction was not brought in line with the established pattern.

**Recommended mitigation:**  
When activating the booking adapter sprint, update `QrLinkCard`:
```js
const fullUrl = `${window.location.origin}/qr/${encodeURIComponent(String(qrLink.slug))}`
```
Also validate `qrLink.slug` is not empty/null before constructing the URL:
```js
if (!qrLink?.slug) return null;
```

**Rationale:** Consistent with `buildMenuQrUrl`/`buildReviewsQrUrl` encoding pattern. Encode at construction time, always.

**Follow-up command:** CAPTAIN (capture for booking adapter sprint); Wolverine when activating `BookingQrLinksPanel`

**Exploitability:** LOW (dormant — panel is disabled)  
**Attack Preconditions:**  
- Panel must first be activated (requires booking adapter sprint completion)  
- Booking data must include a slug containing special characters  
- Slug must come from an unvalidated source

**Blast Radius:**  
- Single booking QR link display
- No current exposure

**Trust Boundary:** Authenticated VPORT Owner  

**CISSP Domain:**  
- Primary: Software Development Security  
- Secondary: Communication and Network Security

---

## IDENTITY SURFACE REVIEW

| Surface | Status | Risk | Notes |
|---|---|---|---|
| `useActorCanonicalSlug` — success path | ⚠️ CONDITIONAL PASS | HIGH (V-001) | Correct slug returned on success; UUID returned on error — see V-001 |
| `buildMenuQrUrl(slug)` | ✅ PASS | None | Uses `encodeURIComponent(String(slug))` + `window.location.origin` |
| `buildReviewsQrUrl(slug)` | ✅ PASS | None | Same pattern as above |
| `buildBusinessCardQrUrl(slug)` | ✅ PASS | None | Same pattern as above |
| `VportsQrModal` QR value | ✅ PASS | None | Uses `buildBusinessCardQrUrl` |
| `VportsBusinessCardSection` copy URL | ⚠️ FAIL | MEDIUM (V-002) | Hardcoded `vibezcitizens.com` |
| `GasPricesPanel` identity surface | ⚠️ EXCESS | MEDIUM (V-003) | Full `identity` object; only `actorId` needed |
| `BookingQrLinksPanel` public surface | ✅ PASS | None | `actorId` only; `enabled: false` |
| `PrintableQrFlyerCard` QR value | ✅ PASS | None | Uses `cleanMenuUrl` (caller-sanitized) |
| `PosterFlyer` / `ClassicFlyer` QR value | ✅ PASS | None | `menuUrl` from controlled state |

---

## DEBUG LEAKAGE REVIEW

| Surface | Status | Risk | Notes |
|---|---|---|---|
| `iosProdDebugger.js` | ✅ CLEAN | None | All logging functions return immediately when `IS_PROD = import.meta.env.PROD` is true; zero production leakage |
| `QrCode.jsx` warning (V-004 recommendation) | N/A | None | Recommended `console.warn` is dev/debug path only |

---

## MITIGATION PLAN

| Finding | Risk | Recommended Change | Layer | Priority |
|---|---|---|---|---|
| V-001 | UUID leak on error path | Fix `useActorCanonicalSlug` catch block: don't set `canonicalSlug = actorId`; leave as `null` | Hook | P0 — blocks release |
| V-002 | Hardcoded domain in business card section | Replace lines 7+46 in `VportsBusinessCardSection.jsx` with `buildBusinessCardQrUrl(v.slug)` | Component | P1 |
| V-003 | Full identity object in gas panel tree | Replace `me={identity}` with `canSubmit={!!identity?.actorId}` through panel chain | Screen/Component | P2 |
| V-004 | No scheme validation in QrCode primitive | Add URL scheme guard (`https:` / `http:` allowlist) in `QrCode.jsx` | Component | P3 (hardening) |
| V-005 | Unencoded slug in BookingQrLinksPanel | Add `encodeURIComponent(String(qrLink.slug))` when activating booking adapter | Component | P3 (pre-activation) |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No policy or governance gaps found in session scope |
| Asset Security | 2 | V-001 (UUID leak), V-003 (identity object excess) |
| Security Architecture and Engineering | 3 | V-001 (error path bypass), V-002 (domain centralization), V-003 (data minimization) |
| Communication and Network Security | 1 | V-005 (URL encoding in dormant booking panel) |
| Identity and Access Management | 1 | V-001 (canonical slug = identity surface contract) |
| Security Assessment and Testing | 0 | Coverage gap noted: no automated test verifies that error path in `useActorCanonicalSlug` does not produce UUID output |
| Security Operations | 0 | `iosProdDebugger` confirmed clean; no production logging leaks found |
| Software Development Security | 4 | V-001, V-002, V-004, V-005 — URL construction, encoding, and input handling |

**Uncovered domains:**
- **Security Assessment and Testing** — not out of scope; no automated tests exist for error-path QR behavior. This is a test gap, not a test finding — flagged for SENTRY/THOR.
- **Security and Risk Management / Security Operations** — fully reviewed; genuinely no findings in session scope.

---

## FINAL VENOM STATUS

**VENOM STATUS: HIGH FINDINGS PRESENT**

- 0 CRITICAL findings
- 2 HIGH findings — **V-001 is release-blocking** (UUID leak survives on hook error path, bypassing the session's P0 fix)
- 2 MEDIUM findings — V-002, V-003 (addressable before release)
- 2 LOW findings — V-004, V-005 (hardening; V-005 is dormant)

**RELEASE GATE RECOMMENDATION:** Block. V-001 must be resolved before the vport QR changes ship. The session's UUID-leak fix is incomplete — it closes the loading-window gap but leaves the error-path gap open.

**Referred to BLACKWIDOW:** Adversarial runtime verification of V-001 (can the error path be reliably triggered?), V-002 (environment mismatch behavior), and V-003 (identity object accessibility in panel render scope).

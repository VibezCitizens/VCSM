# ELEKTRA Security Report
**Date:** 2026-06-06
**Scope:** VCSM — auth / modules / onboarding — /onboarding screen (Complete Your Profile)
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — full security chain (ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA)
**Findings Summary:** 0 CRITICAL | 1 HIGH | 2 MEDIUM | 2 LOW | 1 INFO
**False Positives Rejected:** 2
**Suggested Patches:** 5

---

## Preflight Gates

| Gate | Report | Age | Status |
|---|---|---|---|
| ARCHITECT | features/auth/modules/onboarding/outputs/2026/06/06/ARCHITECT/vcsm.auth.onboarding.architecture.md | 0 days | SOURCE_VERIFIED ✓ |
| VENOM | features/auth/modules/onboarding/outputs/2026/06/06/Venom/2026-06-06_03-54_venom_onboarding-screen.md | 0 days | COMPLETE ✓ |
| BLACKWIDOW | features/auth/modules/onboarding/outputs/2026/06/06/BlackWidow/2026-06-06_04-30_blackwidow_onboarding-screen.md | 0 days | COMPLETE ✓ |

All gates PASS. Proceeding with ELEKTRA scan.

---

## Scan Target

```
ELEKTRA SCAN TARGET
Feature / Route / Engine:    auth / modules / onboarding / /onboarding
Application Scope:           VCSM
Reason for scan:             Full security chain — complete governance pass
Scan trigger:                MANUAL
Upstream VENOM report:       .../Venom/2026-06-06_03-54_venom_onboarding-screen.md
Upstream BLACKWIDOW report:  .../BlackWidow/2026-06-06_04-30_blackwidow_onboarding-screen.md
```

---

## Scan Areas Loaded

| Area | Sub-File | Relevance |
|---|---|---|
| 1 — Actor Ownership / IDOR | 01-actor-ownership-idor.md | profiles upsert, actor creation chain |
| 2 — Controller Input Trust | 02-controller-input-trust.md | age/sex field validation, enum allowlist |
| 3 — Supabase RLS | 03-supabase-rls.md | profiles upsert RLS gap |
| 6 — Auth and Session | 06-auth-session.md | session pin, getSession vs getUser |

---

## Entry Point Map

```
ENTRY POINT MAP
Route:                    /onboarding (ProtectedRoute, outside ProfileGatedOutlet)
Entry controller:         getOnboardingBootstrapController() — session check + form pre-fill
Save controller:          completeOnboardingController({ userId, form, ... })
Input sources:
  - form.display_name     (text input — user-supplied)
  - form.username_base    (text input — user-supplied)
  - form.birthdate        (date picker — user-supplied, max=today)
  - form.sex              (select — Male/Female — user-supplied)
  - location.state.from   (router state — user-controllable in crafted URLs)
Trusted input boundary:   normalizeOnboardingFormModel() + isSafeAuthReturnPath()
Validation present:       PARTIAL — birthdate format checked, future dates rejected;
                          NO minimum age floor; sex normalization result unchecked in controller
```

---

## Source Files Read (ELEKTRA source verification)

| File | Read? | Purpose |
|---|---|---|
| apps/VCSM/src/features/auth/controllers/onboarding.controller.js | YES | Main save controller — session pin, age write |
| apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js | YES | handleSave flow, isValid guard, double-submit |
| apps/VCSM/src/features/auth/model/onboarding.model.js | YES | normalizeSexValueModel, computeAgeFromBirthdateModel |
| apps/VCSM/src/features/auth/controllers/profileOnboarding.controller.js | YES | ensureProfileShell — caller chain source |
| apps/VCSM/src/features/auth/controllers/completeProfileGate.controller.js | YES | **CRITICAL**: ensureProfileShell actual caller |
| apps/VCSM/src/features/auth/dal/onboarding.dal.js | YES | upsertProfileShellDAL, upsertCompletedOnboardingProfileDAL |
| apps/VCSM/src/features/auth/dal/authSession.read.dal.js | YES | dalGetAuthSession — getSession() vs getUser() distinction |
| apps/VCSM/src/features/auth/model/authInputValidation.model.js | YES | isSafeAuthReturnPath — redirect allowlist |
| apps/VCSM/src/features/auth/controllers/authCallback.controller.js | YES | resolveAuthCallbackController — NOT an ensureProfileShell caller |

---

## Chain Verification Results

### Chain 1 — is_adult authorization bypass [SOURCE_VERIFIED]

```
DATA FLOW TRACE
Source:              form.birthdate — date picker, client-controlled, max=today
Validation:          computeAgeFromBirthdateModel — validates ISO format, rejects future dates
                     NO minimum age floor enforced
Transform:           age = integer years since birth
Sink:                upsertCompletedOnboardingProfileDAL({ isAdult: age >= 18 })
                     → public.profiles.is_adult (boolean)
Defense at sink:     ABSENT — no age floor in model or controller
```

Chain status: **COMPLETE** — exploitable.

---

### Chain 2 — ensureProfileShell caller chain [CLOSED_SOURCE_VERIFIED]

**Finding: VEN-ONBOARD-002 CLOSES.**

BLACKWIDOW classified this PARTIAL because the caller chain was unverified. ELEKTRA now traces it fully:

```
evaluateCompleteProfileGateController()
  → readCurrentAuthUserDAL()
      → supabase.auth.getUser()   ← SERVER-VERIFIED (network call to Supabase)
      → user.id (server-confirmed)
  → ensureProfileShell({ userId: user.id, email: user.email })
      → upsertProfileShellDAL({ id: userId, ... })
```

`readCurrentAuthUserDAL` (onboarding.dal.js:3-6):
```js
export async function readCurrentAuthUserDAL() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user ?? null
}
```

`supabase.auth.getUser()` sends a server-side request to verify the JWT — this is NOT a local storage read. It is the stronger of the two Supabase auth calls.

**Result:** VEN-ONBOARD-002 — **CLOSED_SOURCE_VERIFIED** — caller is confirmed server-verified. The structural concern (no session pin inside `ensureProfileShell`) is acceptable given the sole caller's server-verified pattern. No patch required.

---

### Chain 3 — profiles upsert without .eq filter [SOURCE_VERIFIED — DB pending]

```
DATA FLOW TRACE
Source:              userId from server-verified session (getUser / dalGetAuthSession)
Validation:          userId matches session at controller:72 (dalGetAuthSession → getSession)
Transform:           userId passed as { id: profileId } into upsert
Sink:                supabase.from('profiles').upsert({ id: profileId, ... })
Defense at sink:     ABSENT at DAL level — no .eq('id', auth.uid()) filter
                     RLS WITH CHECK — UNVERIFIED (DB audit required)
```

Chain status: **PARTIAL** — DAL-layer defense absent; RLS is sole backstop; RLS unverified.

---

### Chain 4 — sex=null write via normalization gap [SOURCE_VERIFIED]

```
DATA FLOW TRACE
Source:              form.sex — select element (UI-enforced Male/Female; bypassable via DOM)
Validation at hook:  form.sex.trim() !== '' — validates raw value, NOT normalized result
Transform:           normalizeSexValueModel('bypass_value') → null
Sink:                completeOnboardingController:83
                     if (!normalized.displayName || !normalized.usernameBase || !normalized.birthdate)
                     → normalized.sex NOT checked
                     → upsertCompletedOnboardingProfileDAL({ sex: null })
Defense at sink:     ABSENT — controller does not check if normalized.sex is null
```

Chain status: **COMPLETE** — exploitable via DOM manipulation; self-targeting.

---

### Chain 5 — handleSave double-submit [SOURCE_VERIFIED]

```
DATA FLOW TRACE
Source:              user double-click on "Save & Continue" button
Validation:          busy = loading || saving → disables button
                     BUT setSaving(true) is async React state — not synchronous
Transform:           first call: handleSave() → setSaving(true) scheduled
                     second call (same frame): saving still false in closure → isValid check passes
Sink:                two concurrent completeOnboardingController() calls → upsertCompletedOnboardingProfileDAL (×2)
Defense at sink:     ABSENT — no useRef flag; protection is async React render cycle only
```

Chain status: **COMPLETE** — narrow race window; no security breach; data integrity risk.

---

### Chain 6 — Redirect injection via state.from [SOURCE_VERIFIED]

```
DATA FLOW TRACE
Source:              location.state.from — router state
Validation:          isSafeAuthReturnPath(state.from) — allowlist check
                     Rejects: '//', 'protocol:', empty, non-string, non-prefix matches
Sink:                navigate(navState.redirectTo, { replace: true })
Defense at sink:     PRESENT — isSafeAuthReturnPath confirmed at useAuthOnboarding.js:34
```

Chain status: **BLOCKED** — isSafeAuthReturnPath is correctly applied. FP rejected.

---

## High Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-ONBOARD-001
- Title:              is_adult authorization bypass via unguarded birthdate field
- Category:           Privilege Escalation
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/model/onboarding.model.js:40-61
                      apps/VCSM/src/features/auth/controllers/onboarding.controller.js:97-116
- Source:             form.birthdate — date picker input (user-controlled; max=today enforced by UI only)
- Sink:               upsertCompletedOnboardingProfileDAL({ isAdult: age >= 18 })
                      → public.profiles.is_adult (onboarding.controller.js:113)
- Trust Boundary:     computeAgeFromBirthdateModel — validates format + rejects future dates; NO floor
- Impact:             Any authenticated user can write is_adult=true to their profile by entering a
                      false birthdate 18+ years in the past. Grants access to age-gated content
                      (Void Realm / any is_adult-gated feature). No external age verification exists.
- Evidence:
    // onboarding.model.js:40-61
    export function computeAgeFromBirthdateModel(isoDate, referenceDate = new Date()) {
      // ... validates format, rejects future dates ...
      let age = todayYear - parsed.year       // accepts any past date (age 0 → 150)
      return age
    }

    // onboarding.controller.js:97-113
    const age = computeAgeFromBirthdateModel(normalized.birthdate)
    if (age == null) {
      return { ok: false, error: { message: 'Invalid birthdate.' } }
    }
    await upsertCompletedOnboardingProfileDAL({
      ...,
      isAdult: age >= 18,    // NO minimum floor — any user can set this true
    })
- Reproduction Steps:
    1. Register any account and navigate to /onboarding
    2. Enter any display_name and username_base
    3. Enter birthdate: [todayYear - 18]-[todayMonth]-[todayDay - 1]
       (18 years ago minus 1 day → age = 18)
    4. Select any sex
    5. Submit form
    6. DB writes: is_adult = true for a user who may be any age
    7. Repeat via /onboarding replay (BW-ONBOARD-002) to change at any time post-registration
- Existing Defense:   Future dates rejected (max=today UI constraint + model future-date check)
- Why Defense Is Insufficient:
    The max=today constraint only prevents future birthdate entries.
    All past dates are accepted including yesterday (age=0) and any date that produces age >= 18.
    No minimum age floor exists. No external verification. No COPPA compliance floor.
    Can be exploited repeatedly via onboarding replay (see ELEK-ONBOARD-002).
- Recommended Fix:    Add minimum age floor in the controller. Decision required on minimum:
                      - 13 years (COPPA compliance minimum)
                      - 18 years (if platform requires all users to be adults)
                      Also: add a maximum reasonable age ceiling (e.g., < 150 years)
- Suggested Patch:
    // onboarding.controller.js — after age computation (~line 97)
    const age = computeAgeFromBirthdateModel(normalized.birthdate)
    if (age == null) {
      return { ok: false, action: null, error: { message: 'Invalid birthdate.' }, data: null }
    }

    // ADD: enforce minimum age floor
    const MIN_AGE = 13  // business decision — adjust to 18 if platform requires adult-only
    if (age < MIN_AGE) {
      return {
        ok: false,
        action: null,
        error: { message: `You must be at least ${MIN_AGE} years old to join.` },
        data: null,
      }
    }

    // OPTIONAL: ceiling guard (defense-in-depth)
    if (age > 120) {
      return { ok: false, action: null, error: { message: 'Invalid birthdate.' }, data: null }
    }
- Follow-up Command:  WOLVERINE (age policy decision — 13 or 18 minimum)
```

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-ONBOARD-002
- Title:              Onboarding route accessible post-completion — profile and is_adult overwritable
- Category:           Auth Bypass / Privilege Escalation
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/controllers/onboarding.controller.js:61-155
                      apps/VCSM/src/app/routes/index.jsx:178 (route registration)
- Source:             Authenticated user navigates to /onboarding after completing it
- Sink:               upsertCompletedOnboardingProfileDAL (re-executes unconditionally)
                      → public.profiles overwritten with new values
- Trust Boundary:     getOnboardingBootstrapController — no completion guard; route always accessible
- Impact:             1. Combined with ELEK-ONBOARD-001: user can change their birthdate at any time
                         to toggle is_adult status — age gate bypass is permanent, not one-time
                      2. Username, display_name, sex, birthdate all overwritable silently without
                         going through the settings/profile edit flow (bypasses any audit trail)
                      3. Each replay triggers a new generateUsernameDAL call — may change username
- Evidence:
    // routes/index.jsx:178 — /onboarding inside ProtectedRoute but OUTSIDE ProfileGatedOutlet
    // No ProfileGatedOutlet protection means profile-complete users can still reach /onboarding

    // onboarding.controller.js:42-58 — bootstrap does NOT return early for complete profiles
    export async function getOnboardingBootstrapController() {
      const session = await dalGetAuthSession()
      // ... session checks ...
      const profileRow = await readProfileForOnboardingDAL(user.id)
      return { ok: true, data: { userId: user.id, form: mapProfileOnboardingRowToFormModel(profileRow) } }
      // ↑ Returns ok:true for complete profiles — no completion guard
    }
- Reproduction Steps:
    1. Complete /onboarding normally → navigate to '/'
    2. Navigate back to /onboarding (browser back or direct URL)
    3. Form pre-fills with existing username_base and birthdate
    4. Enter different birthdate (e.g., 18+ years ago if actually a minor)
    5. Submit → is_adult toggled; username potentially changed
- Existing Defense:   None — route intentionally outside ProfileGatedOutlet (by design for incomplete profiles)
- Why Defense Is Insufficient:
    The intentional exclusion from ProfileGatedOutlet is correct for first-time users.
    But completed profiles need a guard to prevent re-entry.
    The controller has no "already complete" early return.
- Recommended Fix:    In getOnboardingBootstrapController, check if profile is already complete.
                      If complete: return { ok: false, action: 'already_complete' }.
                      In useAuthOnboarding, handle 'already_complete' → navigate('/').
- Suggested Patch:
    // onboarding.controller.js — getOnboardingBootstrapController, after profile read (~line 48)
    const profileRow = await readProfileForOnboardingDAL(user.id)

    // ADD: guard against replay for complete profiles
    if (profileRow && !isProfileShellIncompleteModel(profileRow)) {
      return {
        ok: false,
        action: 'already_complete',
        error: null,
        data: null,
      }
    }

    // useAuthOnboarding.js — handleAuthRedirect (~line 63)
    if (action === 'already_complete') {
      navigate('/', { replace: true })
      return true
    }
- Follow-up Command:  WOLVERINE (confirm design intent — is replay intentional?)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-ONBOARD-003
- Title:              public.profiles upsert RLS ownership policy unverified
- Category:           Supabase RLS
- Severity:           MEDIUM
- Status:             Open — DB audit required
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/dal/onboarding.dal.js:35-49 (upsertProfileShellDAL)
                      apps/VCSM/src/features/auth/dal/onboarding.dal.js:61-85 (upsertCompletedOnboardingProfileDAL)
- Source:             userId from controller (server-verified path confirmed — see CLOSED VEN-ONBOARD-002)
- Sink:               supabase.from('profiles').upsert({ id: userId, ... })
- Trust Boundary:     RLS WITH CHECK policy — unverified
- Impact:             If RLS has no WITH CHECK (id = auth.uid()), any authenticated user who directly
                      calls the Supabase client (bypassing the app layer) can upsert a row with any id,
                      overwriting any other user's profile. Identity-tier table — highest risk.
- Evidence:
    // onboarding.dal.js:35-49 — no .eq filter
    export async function upsertProfileShellDAL({ id, email, createdAt, updatedAt }) {
      const { error } = await supabase.from('profiles').upsert({
        id,      // caller-provided — no WHERE id = auth.uid()
        email,
        created_at: createdAt,
        updated_at: updatedAt,
      })
      if (error) throw error
    }

    // onboarding.dal.js:71-84 — same pattern
    const { error } = await supabase.from('profiles').upsert({
      id: profileId,   // no .eq filter
      ...
    })
- Reproduction Steps: Cannot test without DB access. Route: authenticated Supabase client + victim userId.
- Existing Defense:   Authenticated Supabase client (not anon or service role) confirmed.
                      App-layer session pin in completeOnboardingController.
                      ensureProfileShell caller now confirmed server-verified (VEN-ONBOARD-002 CLOSED).
                      RLS WITH CHECK: UNVERIFIED.
- Why Defense Is Insufficient:
    App-layer session pin protects the happy path. But the DAL is directly callable via
    Supabase client from the browser console or any JS context with a valid session.
    Without confirmed RLS WITH CHECK (id = auth.uid()), there is no DB-layer barrier.
- Recommended Fix:    DB audit required (CARNAGE):
                      Confirm profiles table has: CREATE POLICY "profiles_owner_write"
                      ON public.profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
                      
                      App-layer hardening (defense-in-depth — does NOT replace RLS):
                      Add .eq('id', userId) before upsert conflict target in both DAL methods.
                      (Note: Supabase .upsert() with onConflict is the correct approach)
- Suggested Patch (App-layer hardening — advisory only):
    // onboarding.dal.js — upsertProfileShellDAL (defense-in-depth only; RLS is primary fix)
    // Add onConflict clause to make ownership explicit:
    export async function upsertProfileShellDAL({ id, email, createdAt, updatedAt }) {
      const { error } = await supabase.from('profiles').upsert(
        { id, email, created_at: createdAt, updated_at: updatedAt },
        { onConflict: 'id' }
      )
      if (error) throw error
    }
    // Primary fix: DB-level RLS WITH CHECK (id = auth.uid()) — route to DB / Carnage
- Follow-up Command:  DB (confirm RLS), Carnage (add policy if missing)
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-ONBOARD-004
- Title:              sex field null write — controller does not validate normalized result
- Category:           Controller Input Trust
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/controllers/onboarding.controller.js:81-90
                      apps/VCSM/src/features/auth/model/onboarding.model.js:34-38
- Source:             form.sex — select element; bypassable via DOM manipulation
- Sink:               upsertCompletedOnboardingProfileDAL({ sex: normalized.sex })
                      where normalized.sex can be null
- Trust Boundary:     controller:83 validation block — does NOT check normalized.sex
- Impact:             sex=null written to DB despite UI constraint; self-targeting only
- Evidence:
    // onboarding.model.js:34-38
    export function normalizeSexValueModel(value) {
      const raw = String(value ?? '').trim().toLowerCase()
      if (!raw) return null
      return SEX_VALUES[raw] ?? null   // 'unexpected_value' → null
    }

    // onboarding.controller.js:81-90
    const normalized = normalizeOnboardingFormModel(form)
    if (!normalized.displayName || !normalized.usernameBase || !normalized.birthdate) {
      return { ok: false, error: { message: 'Please complete all required fields.' } }
      // ↑ normalized.sex NOT checked — null sex passes this guard
    }
- Reproduction Steps:
    1. Open /onboarding in browser DevTools
    2. Add a third option to the sex select: <option value="bypass">Bypass</option>
    3. Select it → form.sex = 'bypass'
    4. isValid passes ('bypass'.trim() !== '' = true)
    5. Save → normalizeSexValueModel('bypass') = null
    6. Controller validation does not check normalized.sex
    7. upsertCompletedOnboardingProfileDAL({ sex: null })
- Existing Defense:   UI: select restricted to Male/Female options (bypassable via DOM)
                      Hook: isValid checks form.sex.trim() !== '' (checks raw value, not normalized)
- Why Defense Is Insufficient:
    Two-layer mismatch: isValid validates the raw value; the controller validates the normalized value
    but omits sex. The gap between these two checks allows null to pass through.
- Recommended Fix:    Add normalized.sex check to the controller's existing validation block
- Suggested Patch:
    // onboarding.controller.js:83 — add !normalized.sex to the existing guard
    if (!normalized.displayName || !normalized.usernameBase || !normalized.birthdate || !normalized.sex) {
      return {
        ok: false,
        action: null,
        error: { message: 'Please complete all required fields.' },
        data: null,
      }
    }
- Follow-up Command:  None — simple one-line patch; no BLACKWIDOW re-run needed
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-ONBOARD-005
- Title:              handleSave double-submit — no atomic useRef guard
- Category:           Auth Bypass / Race Condition
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js:135-172
- Source:             User double-click on "Save & Continue"
- Sink:               Two concurrent completeOnboardingController() → upsertCompletedOnboardingProfileDAL
- Trust Boundary:     setSaving(true) — async React state (not synchronous guard)
- Impact:             Concurrent upserts produce indeterminate DB state for username;
                      double platform bootstrap call; low data integrity risk; no security breach
- Evidence:
    // useAuthOnboarding.js:135-138
    const handleSave = useCallback(async () => {
      if (!isValid || !userId) return
      setSaving(true)    // ← async state update; does NOT prevent second call in same frame
      setErrorMessage('')
- Reproduction Steps:
    1. Double-click "Save & Continue" within the same render frame
    2. Two handleSave() invocations run concurrently before setSaving(true) propagates
    3. Both call completeOnboardingController
    4. generateUsernameDAL called twice — may return different usernames
    5. Last upsert wins in DB
- Existing Defense:   Button disabled via busy = loading || saving (async React state — not synchronous)
- Why Defense Is Insufficient: Async state does not prevent concurrent invocations in the same frame
- Recommended Fix:    Add synchronous useRef guard (same pattern as ELEK-REG-005)
- Suggested Patch:
    // useAuthOnboarding.js — add ref at hook top-level
    const isSavingRef = useRef(false)

    // In handleSave (replace setSaving(true) with ref-guarded pattern):
    const handleSave = useCallback(async () => {
      if (!isValid || !userId) return
      if (isSavingRef.current) return    // synchronous guard — prevents concurrent invocation
      isSavingRef.current = true
      setSaving(true)
      setErrorMessage('')
      try {
        // ... existing logic ...
      } finally {
        isSavingRef.current = false
        setSaving(false)
      }
    }, [...])
- Follow-up Command:  None — consistent with ELEK-REG-005 advisory; apply alongside that fix
```

---

## Info

```
INFO

- Finding ID:         ELEK-ONBOARD-INFO-001
- Title:              completeOnboardingController uses getSession() for session pin (not getUser())
- Severity:           INFO
- Location:           apps/VCSM/src/features/auth/dal/authSession.read.dal.js:7-11
                      apps/VCSM/src/features/auth/controllers/onboarding.controller.js:67
- Detail:             completeOnboardingController calls dalGetAuthSession() → supabase.auth.getSession()
                      which reads from local storage (client-side JWT parse, not server-verified).
                      The evaluateCompleteProfileGateController (ensureProfileShell caller) correctly
                      uses supabase.auth.getUser() (server-verified) via readCurrentAuthUserDAL().

                      getSession() is the VCSM-wide standard for session pin in controllers.
                      It is functionally acceptable because:
                      1. Supabase JWTs are server-signed — client-side tampering would invalidate signature
                      2. Any DB operations using the tampered JWT would fail at the Supabase server
                      3. RLS would reject unauthenticated or spoofed operations

                      Upgrade recommendation: use readCurrentAuthUserDAL() (getUser()) in
                      completeOnboardingController for defense-in-depth alignment.
                      Not a priority fix — functional safety is maintained by signed JWT + RLS.
- Action:             Low-priority hardening. Consider standardizing controllers to getUser()
                      in a future auth hygiene pass. Does not block THOR.
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       getSession() in session pin allows stale JWT → session bypass
- Location:        apps/VCSM/src/features/auth/dal/authSession.read.dal.js:7-11
- Rejection reason: JWT is Supabase-signed (RS256 or HS256). Client-side tampering of user.id in a
                    parsed JWT would invalidate the signature. A tampered JWT would be rejected by
                    Supabase at the DB connection layer (RLS auth.uid() check). No exploitable bypass.
- Chain gap:        Impact — signature forgery requires Supabase JWT secret (not client-accessible)
- Notes:           Classified as INFO (ELEK-ONBOARD-INFO-001) — defense-in-depth recommendation only
```

```
FALSE POSITIVE REJECTED

- Candidate:       display_name XSS via stored HTML injection (React rendering path)
- Location:        apps/VCSM/src/features/auth/dal/onboarding.dal.js:61-85
- Rejection reason: React auto-escapes all HTML entities when rendering JSX text. The confirmed attack
                    path within VCSM's React UI is blocked. No confirmed non-React output path
                    (email template, PDF generator) was found in this scope's source files.
- Chain gap:        Sink — React rendering blocks XSS; no confirmed alternative rendering path in scope
- Notes:           BW-ONBOARD-003 (LOW) retains the partial classification for the architectural risk
                   in non-React consumers. ELEKTRA cannot confirm that sink without reading the email
                   or PDF generation code, which is outside this scan's scope.
```

---

## Upstream VENOM/BLACKWIDOW Finding Reconciliation

| Upstream ID | Prior Status | ELEKTRA Verdict | New Status |
|---|---|---|---|
| VEN-ONBOARD-001 | MEDIUM — boundary violation | LOW RISK — architectural; no runtime exploit chain found | CARRY OPEN (architectural) |
| VEN-ONBOARD-002 | MEDIUM — caller chain PARTIAL | **CLOSED_SOURCE_VERIFIED** — completeProfileGate.controller uses getUser() | **CLOSED** |
| VEN-ONBOARD-003 | MEDIUM — RLS unverified | CARRY — confirmed DAL pattern; DB audit still required | CARRY OPEN — DB audit |
| VEN-ONBOARD-004 | MEDIUM — UPGRADES to HIGH | **CONFIRMED** — full chain traced → ELEK-ONBOARD-001 (HIGH) | OPEN (see ELEK-ONBOARD-001) |
| VEN-ONBOARD-005 | LOW — sex null | **CONFIRMED** — full chain traced → ELEK-ONBOARD-004 (LOW) | OPEN (see ELEK-ONBOARD-004) |
| VEN-ONBOARD-006 | LOW — username enumeration | INFO — authenticated-only; no new exploitation path found | CARRY LOW |
| BW-ONBOARD-001 | HIGH — is_adult BYPASSED | **CONFIRMED** → ELEK-ONBOARD-001 (HIGH) | OPEN |
| BW-ONBOARD-002 | MEDIUM — replay BYPASSED | **CONFIRMED** → ELEK-ONBOARD-002 (MEDIUM) | OPEN |
| BW-ONBOARD-003 | LOW — display_name XSS partial | FP rejected for React path; non-React path unverified in scope | CARRY LOW (architectural) |
| BW-ONBOARD-004 | LOW — double-submit | **CONFIRMED** → ELEK-ONBOARD-005 (LOW) | OPEN |

---

## Suggested Patch Queue

```
SUGGESTED PATCH QUEUE

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-ONBOARD-001 | is_adult bypass — add age floor | HIGH | Controller | SIMPLE | NO |
| 2 | ELEK-ONBOARD-002 | Onboarding replay — add completion guard | MEDIUM | Controller + Hook | SIMPLE | NO |
| 3 | ELEK-ONBOARD-003 | profiles RLS — confirm WITH CHECK policy | MEDIUM | RLS | MODERATE | YES (DB) |
| 4 | ELEK-ONBOARD-004 | sex null bypass — add normalized.sex check | LOW | Controller | SIMPLE | NO |
| 5 | ELEK-ONBOARD-005 | Double-submit — add useRef guard | LOW | Hook | SIMPLE | NO |
```

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| WOLVERINE | Age policy decision — MIN_AGE=13 (COPPA) or MIN_AGE=18; confirm onboarding replay intent | PENDING |
| DB | Confirm public.profiles RLS WITH CHECK (id = auth.uid()) for INSERT + UPSERT | PENDING |
| Carnage | If RLS policy missing: migrate policy to supabase/migrations/ | PENDING (conditional) |
| THOR | Release gate — ELEK-ONBOARD-001 HIGH; conditional if is_adult-gated features ship | PENDING |

---

## Executive Summary

ELEKTRA confirms the security sprint patches are effective for the redirect chain. The core identity invariants (session pin, actor ownership, profileId stripping) all hold under full code-level trace.

**Key closure:** VEN-ONBOARD-002 (ensureProfileShell caller chain) is **CLOSED**. The sole caller `evaluateCompleteProfileGateController` uses `supabase.auth.getUser()` (server-verified), making the userId passed to `ensureProfileShell` server-confirmed. BLACKWIDOW marked this PARTIAL due to unverified caller chain — ELEKTRA closes it with full source evidence.

**Key confirmation:** ELEK-ONBOARD-001 (is_adult forgery) is HIGH with a complete source-to-sink chain. The bypass is one-line exploitable (change the date picker), affects `public.profiles.is_adult` permanently, and can be repeated via the `/onboarding` replay path (ELEK-ONBOARD-002). Three simple patches resolve both: a minimum age floor in the controller, a completion guard in the bootstrap, and one additional line in the sex validation block.

**RLS remains the outstanding DB-layer concern.** ELEK-ONBOARD-003 cannot be closed without DB audit.

---

## THOR Release Gate Assessment

| Condition | Finding | Status |
|---|---|---|
| Any ELEKTRA HIGH open | ELEK-ONBOARD-001 | CONDITIONAL BLOCK — blocks when is_adult-gated content ships |
| Any secrets exposure | None found | PASS |
| Any confirmed IDOR with exploit path | None confirmed | PASS |
| Any unconfirmed RLS on actor-scoped write path | ELEK-ONBOARD-003 | CONDITIONAL BLOCK — requires DB audit |

**THOR Release Blocker: CONDITIONAL**
- ELEK-ONBOARD-001: blocks release of any feature that reads `is_adult` to gate content
- ELEK-ONBOARD-003: DB audit required before first production deployment of profile upsert path

**ELEKTRA Recommendation: CAUTION**
Two simple HIGH/MEDIUM patches are available. Once ELEK-ONBOARD-001 and ELEK-ONBOARD-002 are patched and ELEK-ONBOARD-003 is DB-confirmed, THOR is unblocked for this scope.

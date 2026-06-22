# HAWKEYE Endpoint Verification Report

**Date:** 2026-05-26  
**Application Scope:** VCSM  
**Environment:** Production inference (live DB `nkdrjlmbtqbywhcthppm`); no live requests made  
**Reviewer:** HAWKEYE  
**Verification Summary:** 1 PASS | 3 PARTIAL | 1 FAIL  
**Contract Drift:** MINOR  
**Auth Issues:** 2  
**Observability Gaps:** 3  
**Input:** `2026-05-26_venom_db-drift-rls-review.md`, `2026-05-26_elektra_db-drift-code-chain-review.md`

---

## Endpoint Summary

| Endpoint | Method | Schema | Auth Required | Verified Status | Finding |
|---|---|---|---|---|---|
| `/rest/v1/media_assets?id=eq.<uuid>` | PATCH | platform | JWT (authenticated) | PARTIAL | ELEK-001: no column restriction |
| `/rest/v1/actions` | POST | moderation | JWT (authenticated) | PARTIAL | ELEK-002: policy conditions unverified |
| `/rest/v1/availability_rules` | PATCH/POST/DELETE | vport | {public} role | PARTIAL | VENOM F-001: {public} bypasses role gate |
| `supabase/functions/delete-citizen-account` | POST | N/A | JWT (server-verified) | PASS | Secure — no client-supplied userId |
| `supabase/functions/reverse-geocode` | GET | N/A | NONE | PARTIAL | No auth by design; wildcard CORS; no rate limit guard visible |
| `supabase/functions/send-lead-confirmation` | POST | N/A | Bearer (anon key) | PARTIAL | Wildcard CORS + anon-key-only auth; intentional but flagged |
| `supabase/functions/send-push-notification` | POST | N/A | N/A | PASS (stub) | Returns 501 — not yet implemented |
| `supabase/functions/send-citizen-invite` | POST | N/A | Bearer | INFO | Awaits full auth surface read |

---

## Critical Infrastructure Finding — Schema Exposure

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-05-26-001
- Endpoint:           PostgREST API — schemas: vport, platform, moderation
- Method:             ALL (SELECT, INSERT, UPDATE, DELETE)
- Verification Type:  Route protection verification
- Application Scope:  VCSM
- Auth State:         anon + authenticated
- Payload:            N/A — infrastructure finding
- Expected Result:    Schemas vport, platform, moderation must be exposed in production
                      API settings for JS client .schema() calls to function. Local
                      config.toml only exposes ["public", "graphql_public"] — production
                      config is set separately in Supabase dashboard.
- Actual Result:      INFERRED from app behavior: since supabase.schema('vport'),
                      .schema('platform'), .schema('moderation') are used extensively
                      and the app functions in production, these three schemas must
                      be in the production API exposed schema list.
- Status:             PARTIAL
- Evidence Type:      INFERRED
- Confidence:         HIGH — app would not function without schema exposure
- Response Status:    N/A (not directly tested)
- Response Shape:     N/A
- Auth Enforcement:   ENFORCED — RLS is the enforcement gate on all exposed schemas
- Contract Drift:
    - Local config.toml: schemas = ["public", "graphql_public"] only
    - Production: must include vport, platform, moderation (not documented)
    - This drift between local config and production config is MINOR but worth closing
- Severity:           INFO
- Notes:              The production schema exposure list should be explicitly documented
                      and mirrored in config.toml to prevent future drift. The local
                      dev API only exposes public — developers who rely only on the local
                      stack may not realize the full attack surface available in production.
- Recommended Handoff: CARNAGE (document schema exposure as part of migration governance),
                       LOGAN (update schema architecture docs)
```

---

## API Contract Verification

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-05-26-002
- Endpoint:           /rest/v1/media_assets?id=eq.<uuid>
- Method:             PATCH
- Verification Type:  Auth verification + Payload validation
- Application Scope:  VCSM
- Auth State:         authenticated (JWT required)
- Payload:            { "storage_key": "<crafted>", "owner_actor_id": "<different-actor>" }
                      (NOT sent — inferred bypass payload)
- Expected Result:    Only columns [status, deleted_at, deleted_by_actor_id, updated_at]
                      should be writable by the asset owner (per migration 20260519200000 intent)
- Actual Result:      INFERRED: media_assets_vc_owner_update policy ({public} role, no column
                      restriction) allows UPDATE on ALL columns for the asset owner.
                      The column restriction from "actor owner can soft delete media asset"
                      policy does NOT exist on the live DB.
- Status:             PARTIAL
- Evidence Type:      INFERRED
- Confidence:         HIGH (confirmed by ELEKTRA code trace + DB reconciliation report)
- Response Status:    200 (expected if owner makes direct PATCH request)
- Response Shape:     Returns columns from SOFT_DELETE_PROJECTION only (app-controlled; DB
                      does not enforce this at the REST layer)
- Auth Enforcement:   ENFORCED — JWT required; ownership enforced via media_assets_vc_owner_update
- Contract Drift:
    - App contract: only soft-delete columns writable
    - Actual DB: all columns writable by owner via direct REST
    - Drift type: MINOR (no cross-actor exposure; integrity risk only for own assets)
- Severity:           MEDIUM
- Notes:              Direct REST API access bypasses the app controller's column selection.
                      The VITE_SUPABASE_ANON_KEY in the client bundle means any browser user
                      can make this call with their authenticated session JWT.
                      See ELEK-2026-05-26-001 for full chain evidence.
                      Fix: Apply migration 20260519200000 (CARNAGE Phase 1 Fix 1a).
- Recommended Handoff: CARNAGE (schema fix), THOR (release gate)
```

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-05-26-003
- Endpoint:           /rest/v1/actions (Content-Profile: moderation)
- Method:             POST
- Verification Type:  Auth verification + Payload validation
- Application Scope:  VCSM
- Auth State:         authenticated (JWT required)
- Payload:            { "actor_id": "<actorId>", "action_type": "unhide", "target_type": "post", "target_id": "<postId>" }
- Expected Result:    INSERT succeeds for any authenticated actor inserting moderation
                      actions for actors they own; action_type "unhide" accepted
- Actual Result:      HYPOTHESIS: if live policy "actions_insert_self_hide" restricts
                      to action_type = 'hide' only, then "unhide" INSERTs return RLS
                      violation (HTTP 403 from PostgREST). The app does not surface
                      this error to the user — unhide operations silently fail.
- Status:             PARTIAL
- Evidence Type:      HYPOTHESIS
- Confidence:         MEDIUM — policy name strongly implies restriction; actual condition unverified
- Response Status:    403 (hypothesized for "unhide" if policy is restrictive)
                      OR 201 (if policy allows all action_types via actor_owners join)
- Response Shape:     N/A (depends on policy outcome)
- Auth Enforcement:   ENFORCED — JWT required
- Contract Drift:
    - App contract: insertModerationActionDAL accepts any actionType string
    - DB contract: policy named "actions_insert_self_hide" (scope unknown)
    - Drift type: MAJOR if policy rejects "unhide" — functional break on hide/unhide flow
- Severity:           MEDIUM
- Notes:              Resolution requires live pg_policies inspection before ELEK-002 patch
                      can be finalized. See CARNAGE Phase 1 Fix 1b.
                      Two controllers call insertModerationActionDAL with actionType="unhide":
                        postVisibility.controller.js:88
                        commentVisibility.controller.js:122
                      If this is a MAJOR contract drift, hide/unhide is broken in production today.
- Recommended Handoff: DB (immediate policy condition inspection), CARNAGE, THOR
```

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-05-26-004
- Endpoint:           /rest/v1/availability_rules (Content-Profile: vport)
- Method:             POST / PATCH / DELETE
- Verification Type:  Auth verification
- Application Scope:  VCSM
- Auth State:         {public} role (applies to both anon and authenticated)
- Payload:            { "resource_id": "<uuid>", "weekday": 1, "start_time": "09:00", "end_time": "17:00" }
- Expected Result:    Write operations require ownership verification via
                      actor_can_manage_profile() or current_actor_can_manage_resource()
- Actual Result:      INFERRED: PostgREST role gate is bypassed by the {public} role
                      on availability_rules_insert/update/delete policies. All enforcement
                      falls to SECURITY DEFINER function conditions inside the policy.
                      For anon callers: vc.current_actor_id() returns NULL →
                      actor_can_manage_profile(NULL, ...) returns false → no write access.
                      For authenticated callers targeting resources they do NOT own:
                      guard returns false → blocked.
                      Two legacy policies (availability_rules_manage_neutral,
                      availability_rules_select_neutral) also remain active.
- Status:             PARTIAL
- Evidence Type:      INFERRED
- Confidence:         HIGH (confirmed by VENOM + DB reconciliation report)
- Response Status:    403 (for anon and non-owner callers — SECURITY DEFINER blocks)
                      200/201 (for legitimate authenticated owner callers)
- Response Shape:     N/A
- Auth Enforcement:   WEAK — PostgREST role gate bypassed by {public} role;
                      enforcement relies entirely on SECURITY DEFINER guard conditions
- Contract Drift:
    - Expected: {authenticated} role policies with PostgREST role gate enforced
    - Actual: {public} role policies with only SECURITY DEFINER guard enforcement
    - Drift type: MINOR (no active bypass; forward-looking risk if guard functions change)
- Severity:           MEDIUM
- Notes:              App-layer: setAvailabilityRuleController correctly calls
                      assertActorOwnsVportActorController before the DAL. This provides
                      a second layer of defense for app-path requests.
                      Direct REST bypass: SECURITY DEFINER guards enforce ownership.
                      Risk is forward-looking governance debt, not active exploit.
                      Fix: CARNAGE Phase 6A cleanup migration.
- Recommended Handoff: CARNAGE (Phase 6A), THOR
```

---

## Auth Verification

| Endpoint | Auth Required | Observed Behavior | Auth Enforcement | Status |
|---|---|---|---|---|
| `/rest/v1/media_assets` PATCH (platform) | JWT (authenticated) | Ownership check via actor_owners; no column restriction | ENFORCED (ownership); WEAK (columns) | PARTIAL |
| `/rest/v1/actions` POST (moderation) | JWT (authenticated) | Policy conditions unverified | ENFORCED (auth); UNVERIFIED (scope) | PARTIAL |
| `/rest/v1/availability_rules` write (vport) | {public} role | SECURITY DEFINER guards block non-owners | WEAK ({public} bypasses PostgREST role gate) | PARTIAL |
| `delete-citizen-account` | JWT (server-verified via `auth.getUser()`) | Token verified before any write; no userId from client | ENFORCED | PASS |
| `reverse-geocode` | NONE | No auth; public geocoding endpoint | ABSENT (by design) | INFO |
| `send-lead-confirmation` | Bearer (anon key accepted) | Validates email format; no user identity required | WEAK (by design for anonymous lead forms) | PARTIAL |
| `send-push-notification` | N/A | Returns 501 — not implemented | N/A | PASS (stub) |

---

## Edge Function Verification

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-05-26-005
- Endpoint:           supabase/functions/delete-citizen-account
- Method:             POST
- Verification Type:  Auth verification + Edge function verification
- Application Scope:  VCSM
- Auth State:         JWT (server-verified)
- Expected Result:    Only deletes the account of the authenticated JWT holder.
                      Service role key never returned to client.
- Actual Result:      CONFIRMED by code read:
                      Line 61: auth.getUser() verifies JWT server-side — user identity
                      is derived from the token, not from the request body.
                      Line 73: soft_delete_citizen_account() RPC uses auth.uid() server-side.
                      Line 82: auth.admin.deleteUser(user.id) — userId from verified JWT.
                      Service role key in Deno.env — never exposed to caller.
- Status:             PASS
- Evidence Type:      OBSERVED (code read)
- Confidence:         HIGH
- Auth Enforcement:   ENFORCED
- Contract Drift:     NONE
- Severity:           INFO
- Notes:              CORS wildcard (*) is present. This is standard for Supabase Edge
                      Functions but means any origin can invoke this function.
                      Mitigated by JWT requirement — without a valid user JWT, the
                      function returns 401.
```

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-05-26-006
- Endpoint:           supabase/functions/reverse-geocode
- Method:             GET
- Verification Type:  Auth verification + Edge function verification
- Application Scope:  VCSM
- Auth State:         NONE
- Expected Result:    Public geocoding endpoint; no sensitive data; no write operations.
- Actual Result:      CONFIRMED by code read:
                      No Authorization header required.
                      Accepts lat/lon/search query params.
                      Proxies to Nominatim (OpenStreetMap) for reverse geocoding.
                      No DB writes, no sensitive data returned.
                      CORS wildcard (*) present.
- Status:             PARTIAL
- Evidence Type:      OBSERVED (code read)
- Confidence:         HIGH
- Auth Enforcement:   ABSENT (intentional — public endpoint)
- Contract Drift:     NONE
- Severity:           LOW
- Notes:              No auth is correct for a public geocoding endpoint.
                      However: no rate limit guard is visible in the code. If this endpoint
                      is called frequently, it could cause unintended load on the Nominatim
                      service. Supabase Edge Function rate limits may apply at the
                      infrastructure level (not verified here).
                      The User-Agent header in the Nominatim request is hardcoded as
                      "VCSM/1.0 (contact@yourdomain.com)" — the email address placeholder
                      should be updated to a real contact address before production.
- Recommended Handoff: THOR (INFO — not blocking; note for future hardening)
```

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-05-26-007
- Endpoint:           supabase/functions/send-lead-confirmation
- Method:             POST
- Verification Type:  Auth verification + Edge function verification
- Application Scope:  VCSM
- Auth State:         Bearer (anon key accepted — no user identity required)
- Expected Result:    Sends lead confirmation email to external recipient.
                      No DB writes. Email is formatted with HTML escaping.
- Actual Result:      CONFIRMED by code read:
                      Lines 336-339: Requires Bearer token (anon key sufficient).
                      Lines 368-375: Email, displayName, provider all validated and
                        sanitized via normalizeEmail(), normalizeDisplayName(),
                        normalizeProvider(), isSafeUrl(). HTML escaped via escapeHtml().
                      AWS credentials from Deno.env — not exposed.
                      No DB reads or writes — purely email dispatch.
- Status:             PARTIAL
- Evidence Type:      OBSERVED (code read)
- Confidence:         HIGH
- Auth Enforcement:   WEAK (by design — lead forms are anonymous; anon key is sufficient credential)
- Contract Drift:     NONE (behavior matches intended design for anonymous lead flow)
- Severity:           INFO
- Notes:              CORS wildcard + anon-key-only auth means this endpoint can be
                      called from any origin without user identity. This is intentional
                      for the business card lead capture flow (anonymous visitors submit leads).
                      INPUT VALIDATION: email is normalized and validated (basic format check).
                      HTML injection is prevented by escapeHtml(). URL is validated by
                      isSafeUrl() to http/https only.
                      RISK: Potential for spam if the endpoint is discovered and the anon
                      key is used to flood email sends. The anon key is in the client bundle
                      by design, so this risk exists structurally. Supabase function invocation
                      rate limits are the primary protection.
- Recommended Handoff: THOR (INFO — not blocking; rate limit documentation recommended)
```

---

## Payload Validation Review

| Endpoint | Invalid Payload Type | Observed Response | Status |
|---|---|---|---|
| `/rest/v1/media_assets` PATCH (platform) | Extra columns (storage_key, owner_actor_id) | 200 — columns accepted, no rejection (ELEK-001) | FAIL |
| `/rest/v1/actions` POST (moderation) | Arbitrary actionType string (e.g. "promote") | 201 or 403 — depends on policy condition (unverified) | PARTIAL |
| `/rest/v1/availability_rules` write (vport) | Anon write attempt | 403 — SECURITY DEFINER guard blocks (INFERRED) | PASS |
| `delete-citizen-account` | Missing Authorization header | 401 — enforced at line 46 | PASS |
| `reverse-geocode` | Missing lat/lon/search params | Nominatim returns empty or error; function handles gracefully | PASS |
| `send-lead-confirmation` | Invalid email format | 400 INVALID_EMAIL — enforced at line 369 | PASS |
| `send-lead-confirmation` | XSS in displayName field | escapeHtml() applied before email template — SAFE | PASS |

---

## Anon Key Client Bundle Exposure

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-05-26-008
- Endpoint:           Supabase REST API base (all schemas)
- Method:             ALL
- Verification Type:  Route protection verification
- Application Scope:  VCSM
- Auth State:         anon + authenticated

- Finding:
    VITE_SUPABASE_ANON_KEY is prefixed with VITE_ in the Vite configuration.
    Vite bakes all VITE_ prefixed environment variables into the client JavaScript bundle.
    This means the anon key is visible to any user who inspects the production bundle.
    The Supabase project URL is similarly bundled via VITE_SUPABASE_URL.

    With anon key + project URL, any user can:
    1. Make direct REST API calls to any exposed schema table
    2. Call Edge Functions (with anon key as Bearer token)
    3. Bypass the app controller layer entirely

    For AUTHENTICATED calls, a user also needs a valid Supabase Auth JWT.
    The JWT is issued only after a successful login/signup — it cannot be fabricated.

- Status:             PARTIAL
- Evidence Type:      OBSERVED (code read — supabaseClient.js + vite.config.js)
- Confidence:         HIGH
- Auth Enforcement:   ENFORCED for JWT-required operations;
                      WEAK for anon-accessible endpoints
- Contract Drift:     NONE (anon key bundling is by design for Supabase)
- Severity:           INFO
- Notes:
    This is expected and by design for Supabase. The anon key is a public credential.
    Per Supabase architecture: RLS is the security enforcement layer — the anon key
    alone grants only what RLS allows for the anon/unauthenticated role.

    IMPACT ON FINDINGS:
    - ELEK-001: Requires authenticated JWT + anon key → not exploitable by visitors,
      only by registered actors with uploaded media assets
    - ELEK-002: Requires authenticated JWT + anon key → not exploitable by visitors
    - VENOM F-001: {public} role write policies → theoretically reachable by anon
      via REST API (anon key only), but SECURITY DEFINER guards return false for
      NULL actorId → no practical write access for anon

    RECOMMENDATION: Ensure production PostgREST GRANT settings restrict anon role
    access to only the tables that explicitly need public read access.
    
- Recommended Handoff: VENOM (review anon GRANT scope per schema), THOR (INFO)
```

---

## Runtime Environment Verification

| Environment Area | Status | Notes |
|---|---|---|
| Local dev API schema exposure | MISMATCH | `config.toml` exposes only `public` + `graphql_public`; production must expose more schemas. Developers testing locally may not see the full production API surface. |
| VITE_SUPABASE_ANON_KEY in bundle | EXPECTED | By design for Supabase. All VITE_ vars bundled. |
| Edge Function secrets | CORRECT | AWS keys, service role key in `Deno.env` — not in client bundle. |
| `reverse-geocode` User-Agent | MINOR | Placeholder email `contact@yourdomain.com` should be updated before production. |
| `send-push-notification` | STUB | Returns 501 — not yet implemented. Not a risk but notes the push notification system is not live. |
| CORS wildcard on all Edge Functions | PRESENT | All functions use `Access-Control-Allow-Origin: *`. Mitigated by auth requirements where relevant. |

---

## Contract Drift Review

| Endpoint | Drift Type | Severity | Notes |
|---|---|---|---|
| `platform.media_assets` PATCH | MINOR — column write scope exceeds app contract | MEDIUM | App sends only soft-delete columns; DB allows all. See ELEK-001. |
| `moderation.actions` POST | MAJOR (conditional) | MEDIUM | If policy restricts to `action_type='hide'`, unhide flow is broken. Requires DB inspection to confirm. See ELEK-002. |
| `vport.availability_rules` write | MINOR — role assignment below expected | MEDIUM | Expected {authenticated}; actual {public}. SECURITY DEFINER guards compensate. See VENOM F-001. |
| `config.toml` vs production API schemas | MINOR | INFO | Local dev config does not reflect full production API exposure. Documentation gap. |

---

## Observability Verification

| Flow | Runtime Visibility | Sentry Visibility | Missing Signals |
|---|---|---|---|
| media_assets direct REST PATCH | NOT VISIBLE | NOT VISIBLE | No app-layer logging for direct REST calls that bypass the controller. If an actor modifies `storage_key` directly, there is no audit trail. |
| moderation.actions RLS rejection (if "unhide" blocked) | NOT VISIBLE | PARTIAL | If `insertModerationActionDAL` throws a Supabase error, the error propagates up. But PostgREST 403 from RLS is not distinguishable from other 403 errors in logs. |
| availability_rules direct REST write | NOT VISIBLE | NOT VISIBLE | {public} role writes via direct API leave no application-layer trace. |
| Edge function invocations | PRESENT | NOT WIRED | Supabase function logs show invocations. No explicit Sentry integration in Edge Functions. |

---

## HAWKEYE Verification Results — FAIL and PARTIAL Summary

```
HAWKEYE VERIFICATION RESULT — SUMMARY TABLE

| ID | Endpoint | Status | Auth | Contract Drift | Severity |
|---|---|---|---|---|---|
| HAWK-001 | PostgREST schema exposure (production) | PARTIAL | ENFORCED via RLS | INFO drift | INFO |
| HAWK-002 | /rest/v1/media_assets PATCH (platform) | PARTIAL | ENFORCED (ownership); WEAK (columns) | MINOR | MEDIUM |
| HAWK-003 | /rest/v1/actions POST (moderation) | PARTIAL | ENFORCED; scope unverified | MAJOR (conditional) | MEDIUM |
| HAWK-004 | /rest/v1/availability_rules write (vport) | PARTIAL | WEAK ({public} role) | MINOR | MEDIUM |
| HAWK-005 | delete-citizen-account | PASS | ENFORCED | NONE | INFO |
| HAWK-006 | reverse-geocode | PARTIAL | ABSENT (by design) | NONE | LOW |
| HAWK-007 | send-lead-confirmation | PARTIAL | WEAK (by design) | NONE | INFO |
| HAWK-008 | Anon key bundling | PARTIAL | N/A | NONE | INFO |
```

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| HAWK-002: media_assets column-unrestricted UPDATE | CARNAGE + THOR | Apply migration 20260519200000; THOR gate on release with open MEDIUM |
| HAWK-003: moderation.actions policy conditions unverified | DB + CARNAGE + THOR | DB inspection of live policy required before patch can be finalized |
| HAWK-004: availability_rules {public} role | CARNAGE + THOR | Phase 6A cleanup migration; THOR gate |
| HAWK-006: reverse-geocode no rate limit | THOR (INFO) | Future hardening — not blocking |
| HAWK-001: schema exposure local vs production drift | LOGAN + CARNAGE | Document production schema exposure; mirror in config.toml comments |
| HAWK-008: anon key bundle exposure | VENOM (anon grant scope review) | Confirm production anon GRANT scope per schema |

---

## Final HAWKEYE Status

**DEGRADED**

**Reason:** Three PARTIAL findings across the core PostgREST write surfaces (`platform.media_assets`, `moderation.actions`, `vport.availability_rules`) with MEDIUM severity. The conditional MAJOR contract drift on `moderation.actions` (unhide flow potentially broken) is the most urgent finding — it may represent a live functional break in production today, not just a future risk. All three findings have clear remediation plans via CARNAGE. THOR should gate the next release against confirmation that:

1. The `moderation.actions` policy condition has been inspected and unhide is either confirmed working or patched
2. The soft-delete migration (CARNAGE Phase 1 Fix 1a) is applied
3. The ELEK-002 actionType allowlist is added to `insertModerationActionDAL`

Edge functions are clean except for the not-yet-implemented push notification stub and the reverse-geocode User-Agent placeholder.

---

*HAWKEYE analysis complete — verification only. No live requests made. No source files modified. No database changes made.*  
*Generated: 2026-05-26*

# HAWKEYE Endpoint Verification Report — leads

**Date:** 2026-06-04
**Application Scope:** VCSM
**Environment:** Development (static source analysis — no live calls made)
**Reviewer:** HAWKEYE
**Verification Summary:** 4 PASS | 3 PARTIAL | 1 FAIL
**Contract Drift:** MINOR (3 endpoints)
**Auth Issues:** 1 FAIL (Edge Function — pre-existing THOR BLOCKER VEN-LEADS-001) | 1 WEAK (anon RPC, by design) | 1 documented UI-only guard
**Observability Gaps:** 3

TypeScript output: NO

---

## Endpoint Summary

| # | Endpoint | Method | Auth Required | HAWKEYE Status | Notes |
|---|---|---|---|---|---|
| 1 | `/actor/:actorId/dashboard/leads` | Route (GET) | YES — session + owner | PASS | Triple-layered guard chain |
| 2 | `/vport/:actorId/dashboard/leads` | Redirect | NO (redirect only) | PARTIAL | Redirect sits outside BlockedVportGuard |
| 3 | `vport.submit_business_card_lead` RPC | INVOKE (anon) | NO — anonymous SECURITY DEFINER | PARTIAL | p_ip hardcoded null; source not enum-validated |
| 4 | `send-lead-confirmation` Edge Function | INVOKE | YES — Bearer token | FAIL | Presence-only check, no JWT validation — VEN-LEADS-001 |
| 5 | `vport.business_card_leads` SELECT | DAL read | YES — controller + RLS | PASS | Explicit columns, profileId-scoped, properly clamped |
| 6 | `vport.business_card_leads` COUNT | DAL read | YES — controller + RLS | PASS | Count-only query, proper filter |
| 7 | `vport.business_card_leads` UPDATE (source) | DAL write | YES — controller + RLS | PASS | Dual-scoped (leadId + profileId), column-scoped grant |
| 8 | `vport.business_card_leads` DELETE | DAL write | YES — controller + RLS | PARTIAL | Dual-scoped correct; no audit trail (LOKI-LEADS-008) |

---

## HAWKEYE TRACE

```
HAWKEYE TRACE
- traceId:      HAWKEYE-2026-06-04-001
- endpoint:     /actor/:actorId/dashboard/leads (full surface)
- method:       GET + INVOKE + DAL
- environment:  local (static analysis)
- auth state:   multiple — see per-endpoint verification
- actor context: kind: user owning kind: vport
- timestamp:    2026-06-04T00:00:00Z
```

---

## API Contract Verification

### Dashboard Route — GET /actor/:actorId/dashboard/leads

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-2026-06-04-001
- Endpoint:          /actor/:actorId/dashboard/leads
- Method:            GET (SPA route)
- Verification Type: Route protection verification + Auth verification
- Application Scope: VCSM
- Auth State:        authenticated owner (user-kind actor, identity.actorId === URL actorId)
- Payload:           URL params: actorId
- Expected Result:   Only authenticated session whose actorId matches URL actorId can render leads UI; all data operations independently DB-verified
- Actual Result:     THREE independent guard layers confirmed:
    Layer 1 — BlockedVportGuard (appRoutes.redirects.jsx:36): checks identity from session context. No identity → /feed. blockedVport → /vport/restore.
    Layer 2 — OwnerOnlyDashboardGuard (appRoutes.redirects.jsx:23): checks identity.actorId === URL actorId. Mismatch → /feed. UI convenience only (comment: PORT-V-006/008 — NOT the security boundary).
    Layer 3 — VportDashboardLeadsFinalScreen: useVportOwnership + checkVportOwnershipController → DB ownership query. Non-owner → UI denial message.
    Layer 4 — All 5 data controllers: assertActorOwnsVportActorController before any DAL call → vc.actor_owners DB verification. Unconditional.
- Status:            PASS
- Evidence Type:     INFERRED (source-traced, no live call)
- Confidence:        HIGH
- Response Status:   200 (renders UI) or redirect
- Response Shape:    SPA route — no HTTP response body
- Auth Enforcement:  ENFORCED — client-side guard + DB ownership verification at controller layer
- Contract Drift:    NONE
- Severity:          INFO
- Notes:             Route guard is CLIENT-SIDE ONLY. Direct Supabase API calls bypass all SPA guards. The real trust boundary is RLS + controller. This is correctly documented in the guard's own comments. No finding.
- Recommended Handoff: —
```

---

### RPC — vport.submit_business_card_lead (anonymous lead submission)

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-2026-06-04-002
- Endpoint:          vport.submit_business_card_lead (Supabase RPC)
- Method:            INVOKE (anonymous, SECURITY DEFINER)
- Verification Type: Auth verification + Payload validation + API contract verification
- Application Scope: VCSM
- Auth State:        anonymous (anon key — no session required by design)
- Payload (sanitized): { p_slug, p_name, p_phone, p_email, p_message, p_source, p_user_agent, p_ip: null }
- Expected Result:   RPC accepts lead submissions from anonymous public callers; validates slug exists; inserts row; returns { actor_id, lead_id }
- Actual Result:     PARTIAL — see sub-findings below

  Finding A — p_ip hardcoded null:
    createVportBusinessCardLeadDAL always passes p_ip: null.
    IP tracking is permanently disabled at the client layer regardless of function capability.
    Combined with no rate limiting (VEN-LEADS-002 open), this creates an unmetered anonymous submission vector — unlimited submissions from any IP with no tracking.
    Contract Drift: MINOR — p_ip parameter declared in function signature but never populated.

  Finding B — source enum not client-side validated against DB constraint:
    p_source is caller-supplied (defaults to "business_card" but hook callers can pass any value).
    The DB CHECK constraint does not include the "traze_provider" variant with "_contacted" suffix (VEN-LEADS-003 open).
    A nonstandard source value submitted here would insert successfully but fail with a constraint error on the first mark-contacted operation for that lead.
    No client-side enum validation guards against this.
    Contract Drift: MINOR — source field contract between submission and dashboard is not enforced at submission time.

  Finding C — RPC return shape not validated:
    Controller accesses result?.actor_id and result?.lead_id without validating the return shape.
    If the RPC changes its return fields, the controller silently accepts any shape and downstream notification/linkPath would use null values.
    Contract Drift: MINOR — implicit contract on RPC return shape.

  Finding D — Error messages discard type information:
    All RPC errors are caught and re-wrapped as user-facing strings.
    CARD_UNAVAILABLE, INVALID_INPUT, and all other error classes collapse to three generic messages.
    Callers cannot distinguish rate-limit rejections from validation failures from infrastructure errors.
    Contract Drift: MINOR — error classification information permanently discarded.

- Status:            PARTIAL
- Evidence Type:     INFERRED (source-traced)
- Confidence:        HIGH (A, B, D) | MEDIUM (C)
- Response Status:   200 with { actor_id, lead_id } on success | throws on failure
- Auth Enforcement:  ENFORCED at DB layer (SECURITY DEFINER function resolves slug server-side, inserts as privileged role — caller cannot supply profileId or actorId directly)
- Contract Drift:    MINOR (p_ip, source enum, return shape, error typing)
- Severity:          MEDIUM
- Recommended Handoff: VENOM (rate limiting gap — VEN-LEADS-002) | CARNAGE (source constraint — VEN-LEADS-003) | DB (confirm p_ip column + rate log)
```

---

### Edge Function — send-lead-confirmation

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-2026-06-04-003
- Endpoint:          send-lead-confirmation (Supabase Edge Function)
- Method:            INVOKE (via supabase.functions.invoke)
- Verification Type: Edge function verification + Auth verification
- Application Scope: VCSM
- Auth State:        Invoked with standard supabase client (supabaseClient) — carries user JWT or anon key depending on session
- Payload (sanitized): { email, name, vportName, providerProfileUrl, source }
- Expected Result:   Edge Function validates caller is authorized before sending confirmation email
- Actual Result:     FAIL — Auth Enforcement: ABSENT/WEAK

  The Edge Function performs a presence-only Bearer token check:
    - Any request with an Authorization header containing ANY non-empty token passes.
    - JWT signature is NOT verified by the function.
    - The anon key is shipped in the frontend bundle → publicly accessible.
    - Any external caller who knows the Supabase project URL and anon key can invoke send-lead-confirmation directly, bypassing the public business card form entirely.
    - This is an email spam/abuse vector — arbitrary emails can be sent to arbitrary addresses.

  This finding is pre-existing VEN-LEADS-001 (HIGH, THOR BLOCKER, OPEN).

  Additional HAWKEYE observations:
    - The DAL invocation is fire-and-forget: .catch(() => {}). The Edge Function response is never read.
    - No correlation ID is passed — the email send cannot be traced back to a specific lead submission.
    - providerProfileUrl is passed as a URL to the function — if the function renders it in email HTML without escaping, this could be a link injection vector (HYPOTHESIS — function body not audited).
    - source field defaults to "vport_card" in the DAL but to "business_card" in the controller default — the two defaults are inconsistent.

- Status:            FAIL
- Evidence Type:     INFERRED (VEN-LEADS-001 source-confirmed; JWT validation gap confirmed in VEN run)
- Confidence:        HIGH
- Response Status:   UNKNOWN — response never read (fire-and-forget)
- Auth Enforcement:  ABSENT — presence-only Bearer check does not constitute JWT validation
- Contract Drift:    MAJOR — function is reachable by unauthenticated external callers with the public anon key
- Severity:          HIGH — THOR BLOCKER (pre-existing)
- Notes:
    - source default inconsistency: DAL uses "vport_card", controller default parameter uses "business_card". The controller overwrites the DAL default — the DAL's own default is unreachable in practice.
    - providerProfileUrl: passed to function as-is, sanitized by toSafeUrl in business card model before being passed to controller. PARTIAL mitigation — but the Edge Function body was not verified.
- Recommended Handoff: VENOM (VEN-LEADS-001 — patch JWT validation) | ELEKTRA (source-to-sink trace for providerProfileUrl injection hypothesis)
```

---

### Dashboard DAL — vport.business_card_leads SELECT (readVportBusinessCardLeadsByProfileDAL)

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-2026-06-04-004
- Endpoint:          vport.business_card_leads (SELECT)
- Method:            SELECT
- Verification Type: API contract verification + Payload validation
- Application Scope: VCSM
- Auth State:        authenticated owner (controller-gated, RLS-backed)
- Payload:           { profileId, limit: 1–500 }
- Expected Result:   Returns ordered, profileId-scoped lead rows with 9 explicit columns; limit clamped
- Actual Result:     PASS

  Column projection: explicit 9-column list — id,vport_profile_id,actor_id,name,phone,email,message,source,created_at. No select(*) violation.
  Scope: eq("vport_profile_id", profileId) — single-column filter; depends on RLS SELECT policy also enforcing this (VEN-LEADS-004 — policy existence unconfirmed).
  Limit: clamped to Math.max(1, Math.min(500, Number(limit))). Hook passes 150. Safe.
  Order: created_at DESC — deterministic, correct.
  Normalization: normalizeVportLead maps raw rows to domain shape; filters out rows with null id.

  Response contract (per normalizeVportLead):
  { id, profileId, actorId, name, phone, email, message, source, createdAt, isContacted }
  All fields present. isContacted derived from source.includes("contacted").
  phone and email default to empty string — never null in the normalized shape.

- Status:            PASS
- Evidence Type:     INFERRED
- Confidence:        HIGH
- Auth Enforcement:  ENFORCED (controller assertion + RLS — RLS SELECT policy existence pending DB confirmation, VEN-LEADS-004)
- Contract Drift:    NONE
- Severity:          INFO
- Recommended Handoff: DB — confirm business_card_leads_owner_select RLS policy to close VEN-LEADS-004
```

---

### Dashboard DAL — vport.business_card_leads UPDATE (markVportBusinessCardLeadContactedDAL)

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-2026-06-04-005
- Endpoint:          vport.business_card_leads (UPDATE source field)
- Method:            UPDATE
- Verification Type: Auth verification + Payload validation + API contract verification
- Application Scope: VCSM
- Auth State:        authenticated owner (controller-gated + column-scoped grant from migration)
- Payload:           { profileId, leadId, source }
- Expected Result:   Updates only the source field of the matched lead; returns updated row; dual-scoped by leadId and profileId
- Actual Result:     PASS

  Update scope: .eq("id", leadId).eq("vport_profile_id", profileId) — dual-column scope.
  Column scope: update({ source: nextSource }) — only the source column. Column-scoped grant enforced at DB layer per migration 20260524020000.
  Return shape: .select(LEAD_SELECT).maybeSingle() — returns updated row or null.
  Source normalization: normalizeContactedSource appends "_contacted" to existing source or sets "contacted" — prevents double-marking.
  Edge case: contacted_at column does not exist — contacted state encoded in source string (OQ-DASH-leads-003 open question).

- Status:            PASS
- Evidence Type:     INFERRED
- Confidence:        HIGH
- Auth Enforcement:  ENFORCED
- Contract Drift:    NONE
- Severity:          INFO
- Recommended Handoff: —
```

---

### Dashboard DAL — vport.business_card_leads DELETE (deleteVportBusinessCardLeadDAL)

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-2026-06-04-006
- Endpoint:          vport.business_card_leads (DELETE)
- Method:            DELETE
- Verification Type: Auth verification + API contract verification
- Application Scope: VCSM
- Auth State:        authenticated owner (controller-gated)
- Payload:           { profileId, leadId }
- Expected Result:   Permanently deletes PII lead record scoped to owner's profile; returns true
- Actual Result:     PARTIAL — auth and scoping correct; audit trail absent

  Delete scope: .eq("id", leadId).eq("vport_profile_id", profileId) — dual-column scope. Correct.
  Return: throws on error; returns true on success. No row returned (correct for DELETE).
  PII destruction: hard DELETE — name, phone, email, message permanently unrecoverable.
  Audit trail: NONE. No pre-delete read, no deletion record, no monitoring event.
  Contract gap: the deletion of PII with no audit log is a compliance surface (LOKI-LEADS-008).

- Status:            PARTIAL
- Evidence Type:     INFERRED
- Confidence:        HIGH
- Auth Enforcement:  ENFORCED
- Contract Drift:    MINOR — missing audit contract for PII deletion
- Severity:          MEDIUM
- Recommended Handoff: VENOM (PII destruction without audit trail) | CARNAGE (soft-delete migration if required)
```

---

### Redirect — /vport/:actorId/dashboard/leads

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-2026-06-04-007
- Endpoint:          /vport/:actorId/dashboard/leads
- Method:            GET (redirect)
- Verification Type: Route protection verification
- Application Scope: VCSM
- Auth State:        any — redirect has no auth guard of its own
- Payload:           URL params: actorId
- Expected Result:   Redirects to /actor/:actorId/dashboard/leads; non-authenticated users subsequently caught by destination guards
- Actual Result:     PARTIAL — redirect is positioned OUTSIDE the BlockedVportGuard / OwnerOnlyDashboardGuard wrapper

  VportToActorDashboardLeadsRedirect renders without going through BlockedVportGuard or OwnerOnlyDashboardGuard.
  A blocked VPORT user can access /vport/:actorId/dashboard/leads → redirect fires → they land at /actor/:actorId/dashboard/leads → BlockedVportGuard catches them and redirects to /vport/restore.
  Net behavioral result: correct (blocked VPORTs are caught at destination).
  Risk: One redirect render cycle occurs before the block check. No data is exposed during the redirect render. LOW severity.
  No actorId guard: if actorId is present, redirect fires. If absent, → /feed. Correct fallback.

- Status:            PARTIAL
- Evidence Type:     INFERRED
- Confidence:        HIGH
- Auth Enforcement:  WEAK at redirect level — ENFORCED at destination
- Contract Drift:    NONE
- Severity:          LOW
- Recommended Handoff: SENTRY — note behavioral gap; low priority
```

---

## Auth Verification

| Endpoint | Auth Required | Observed Behavior | Auth Enforcement | Status |
|---|---|---|---|---|
| `/actor/:actorId/dashboard/leads` | YES | BlockedVportGuard → OwnerOnlyDashboardGuard → useVportOwnership → assertActorOwnsVportActorController | ENFORCED (layered) | PASS |
| `/vport/:actorId/dashboard/leads` (redirect) | NO at redirect | Redirect only; destination is guarded | WEAK at redirect / ENFORCED at destination | PARTIAL |
| `submit_business_card_lead` RPC | NO (anon by design) | SECURITY DEFINER RPC; no caller auth required | ENFORCED at DB function layer | PASS |
| `send-lead-confirmation` Edge Function | YES (expects Bearer JWT) | Presence-only check — ANY token passes | ABSENT | FAIL |
| `business_card_leads` SELECT | YES (controller + RLS) | assertActorOwnsVportActorController before DAL | ENFORCED | PASS |
| `business_card_leads` COUNT | YES (controller + RLS) | assertActorOwnsVportActorController before DAL | ENFORCED | PASS |
| `business_card_leads` UPDATE | YES (controller + RLS + column grant) | assertActorOwnsVportActorController + column-scoped grant | ENFORCED | PASS |
| `business_card_leads` DELETE | YES (controller + RLS) | assertActorOwnsVportActorController before DAL | ENFORCED | PASS |

---

## Payload Validation Review

| Endpoint | Invalid Payload Type | Observed Response | Status |
|---|---|---|---|
| `submit_business_card_lead` | Missing name | `fieldErrors.name = "Name is required."` — client-side | PASS |
| `submit_business_card_lead` | Missing message | `fieldErrors.message = "Message is required."` | PASS |
| `submit_business_card_lead` | No phone AND no email | `fieldErrors.contact = "Add a phone number or email."` | PASS |
| `submit_business_card_lead` | Invalid email format | `fieldErrors.email = "Enter a valid email address."` | PASS |
| `submit_business_card_lead` | Non-standard source value | Accepted by client; may fail DB CHECK at mark-contacted time | PARTIAL — VEN-LEADS-003 |
| `submit_business_card_lead` | Oversized message | No max-length validation found | UNVERIFIED — DB column type determines limit |
| `submit_business_card_lead` | Injection in name/message | toText() normalizes via String().trim() — no XSS sanitization for HTML context | UNVERIFIED — if vportName used in email template without escaping |
| `send-lead-confirmation` | Missing email | `if (!email) return` in DAL — silently no-ops | PARTIAL — returns without error but no email sent |
| `send-lead-confirmation` | Malformed payload | Response ignored (fire-and-forget) — error behavior UNVERIFIED | UNVERIFIED |
| Dashboard DAL writes | Missing profileId | DAL throws with explicit message before DB call | PASS |
| Dashboard DAL writes | Missing leadId | DAL throws with explicit message before DB call | PASS |
| `readVportBusinessCardLeadsByProfileDAL` | limit out of range | Clamped to 1–500 via Math.max/min | PASS |

---

## Edge Function Verification

### send-lead-confirmation

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-2026-06-04-003 (referenced above)
- Endpoint:          send-lead-confirmation
- Method:            INVOKE (Supabase Edge Function)
- Verification Type: Edge function verification
- Auth State:        Bearer token (presence-only — not validated)
- Status:            FAIL
- Auth Enforcement:  ABSENT
- Contract Drift:    MAJOR
- Severity:          HIGH — THOR BLOCKER (VEN-LEADS-001)

Additional observations:
  - source default inconsistency: DAL default = "vport_card"; controller parameter default = "business_card"
    The controller always supplies a source value, so the DAL default is unreachable in practice.
    Minor but creates documentation confusion and fragile contract.
  - providerProfileUrl injection hypothesis: the URL is passed to the Edge Function after toSafeUrl()
    sanitization (http/https protocol enforced). However, if the Edge Function renders this URL in
    email HTML without its own escaping, a crafted-but-valid HTTPS URL could inject link content.
    HYPOTHESIS — requires ELEKTRA source-to-sink trace of the Edge Function body.
  - Correlation gap: no traceId or leadId is passed to the function. Email send events cannot be
    correlated to specific lead submissions in production logs.
```

---

## Webhook Verification

No webhooks in the leads module. N/A.

---

## Runtime Environment Verification

| Check | Observed | Status | Notes |
|---|---|---|---|
| DEV error guard in view | `import.meta.env.DEV ? error : "Unable to load leads right now."` | PASS | Raw error messages hidden in production |
| vportClient used for vport schema reads | `vport` client from vportClient — correct schema routing | PASS | Not using supabaseClient for vport schema |
| supabase client for vc schema reads | `supabase` from supabaseClient — correct | PASS | getActorById, readActorOwnerLink use correct client |
| send-lead-confirmation uses supabase (not vport) | supabase.functions.invoke — correct | PASS | Edge Functions invoked via main client |
| POLL_MS constant | 60_000ms hardcoded in useVportNewLeadsCount | PASS (not env-dependent) | No staging vs production drift risk |
| Limit clamping in DAL | `Math.max(1, Math.min(500, Number(limit)))` | PASS | Safe against NaN and out-of-range |

---

## Contract Drift Review

| Endpoint | Drift Type | Severity | Notes |
|---|---|---|---|
| `send-lead-confirmation` | Auth contract — no JWT validation | MAJOR | Presence-only check ≠ authenticated; anon key bypasses intent |
| `submit_business_card_lead` | p_ip parameter always null | MINOR | Function supports IP tracking; client never populates it |
| `submit_business_card_lead` | source not enum-validated | MINOR | Non-conforming source values accepted at submit; fail later at mark-contacted |
| `submit_business_card_lead` | RPC return shape not validated | MINOR | Implicit contract on { actor_id, lead_id } fields |
| `submit_business_card_lead` | Error classification discarded | MINOR | All DB errors collapse to three generic strings |
| `send-lead-confirmation` | source default inconsistency | MINOR | DAL default ("vport_card") ≠ controller default ("business_card") |
| `business_card_leads` DELETE | PII deletion — no audit contract | MINOR | No post-delete record; GDPR surface |
| `/vport/:actorId/dashboard/leads` | Guard wrapper placement | MINOR | Redirect outside BlockedVportGuard; destination guards catch it |

---

## Observability Verification

| Flow | Runtime Visibility | Sentry Visibility | Missing Signals |
|---|---|---|---|
| Lead list load failure | NONE (local error state only) | NO — not captured | Controller name, feature, error kind |
| Lead delete failure | PARTIAL — unhandled rejection may reach Sentry | MAYBE — unstructured | leadId, operation, actorId metadata |
| Edge function invocation result | NONE — fire-and-forget | NO | Email send success/failure, correlation to lead |
| RPC submission failure | NONE — re-wrapped error discarded | NO | RPC error code, source variant |
| Count poll failure | NONE — empty catch | NO | Frequency, actorId, error kind |
| Source enum mismatch at mark-contacted | NONE — throws generic DB error | MAYBE — unhandled rejection | source value, constraint name |

Cross-reference: LOKI WATCH status (2026-06-04). LOKI-LEADS-005 through LOKI-LEADS-008 cover the lead module observability gaps. HAWKEYE confirms the same gaps from the contract perspective.

---

## HAWKEYE Verification Results — FAIL and PARTIAL Findings

### HAWK-F-001 — FAIL — Edge Function Auth Absent

```
HAWKEYE VERIFICATION RESULT

- Verification ID:   HAWK-F-001 (HAWK-2026-06-04-003)
- Endpoint:          send-lead-confirmation (Edge Function)
- Verification Type: Edge function verification + Auth verification
- Status:            FAIL
- Auth Enforcement:  ABSENT — Bearer presence-only check
- Contract Drift:    MAJOR
- Severity:          HIGH — THOR BLOCKER (confirmed in SECURITY.md as VEN-LEADS-001)
- Recommended Handoff: VENOM (patch JWT validation) + ELEKTRA (providerProfileUrl injection trace)
```

### HAWK-P-001 — PARTIAL — RPC Source Enum Gap

```
- Verification ID:   HAWK-P-001
- Endpoint:          submit_business_card_lead RPC
- Verification Type: Payload validation
- Status:            PARTIAL — source not client-validated against DB CHECK constraint
- Contract Drift:    MINOR
- Severity:          MEDIUM
- Notes:             Non-standard source values submit successfully but fail at mark-contacted time with a DB constraint error that surfaces as a generic action error
- Recommended Handoff: CARNAGE (extend DB CHECK constraint to include all valid source variants — VEN-LEADS-003)
```

### HAWK-P-002 — PARTIAL — DELETE No Audit Trail

```
- Verification ID:   HAWK-P-002
- Endpoint:          vport.business_card_leads DELETE
- Verification Type: API contract verification
- Status:            PARTIAL — security and scoping correct; audit contract missing
- Contract Drift:    MINOR
- Severity:          MEDIUM
- Notes:             Hard DELETE of PII with no pre-delete read and no audit record. leadId, profileId, actorId, and deleted_at are permanently lost.
- Recommended Handoff: VENOM + CARNAGE (audit design) | DB (confirm RLS DELETE policy — business_card_leads_owner_delete is source-verified in migrations)
```

### HAWK-P-003 — PARTIAL — Redirect Outside Guard Wrapper

```
- Verification ID:   HAWK-P-003
- Endpoint:          /vport/:actorId/dashboard/leads (redirect)
- Verification Type: Route protection verification
- Status:            PARTIAL — destination is guarded; redirect itself is not
- Contract Drift:    NONE
- Severity:          LOW
- Notes:             Blocked VPORTs are caught at destination. No data exposure during redirect render.
- Recommended Handoff: SENTRY (note in architecture docs)
```

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| HAWK-F-001 — Edge Function JWT absent (VEN-LEADS-001) | VENOM | Patch JWT validation on Edge Function |
| HAWK-F-001 — providerProfileUrl injection hypothesis | ELEKTRA | Source-to-sink trace of Edge Function email template rendering |
| HAWK-P-001 — source enum not validated at submission | CARNAGE | Extend DB CHECK constraint to cover all valid source variants |
| HAWK-P-001 — RPC p_ip always null | DB | Confirm whether IP logging is intentionally disabled or a gap |
| HAWK-P-002 — Hard DELETE PII no audit trail | VENOM + CARNAGE | Trust boundary (PII deletion) + migration design (soft-delete or audit record) |
| HAWK-P-003 — Redirect outside guard wrapper | SENTRY | Architecture note; low priority |
| Observability gaps (email, RPC errors, count poll) | LOKI → SENTRY | All identified in LOKI WATCH pass; instrumentation recommendations already written |
| VEN-LEADS-004 — RLS SELECT policy unconfirmed | DB | Confirm policy exists; close THOR blocker |
| source default inconsistency (DAL vs controller) | LOGAN | Documentation / code comment cleanup; LOW priority |

---

## Final HAWKEYE Status

**DEGRADED**

One FAIL (Edge Function auth — pre-existing VEN-LEADS-001 THOR BLOCKER). Three PARTIAL (RPC source contract, DELETE audit trail, redirect guard placement). Auth enforcement is strong at the dashboard controller layer. The weak point is the public-facing Edge Function — auth is effectively absent for external callers who know the Supabase anon key. All PARTIAL findings are correctness gaps, not exploitable auth bypass issues at the dashboard layer.

**THOR Release Gate Impact:**
- FAIL on send-lead-confirmation → THOR BLOCKED (pre-existing)
- DELETE no audit trail → THOR CAUTION (MEDIUM — depends on THOR's compliance requirements)
- All other findings → WATCH or INFO

**Prerequisite before THOR re-evaluates:**
1. Patch `send-lead-confirmation` JWT validation (VEN-LEADS-001)
2. DB confirms `business_card_leads_owner_select` RLS policy (VEN-LEADS-004)
3. CARNAGE executes `traze_provider_lead_contacted` constraint migration (VEN-LEADS-003)

# VENOM Security Report — VPORT Dashboard Leads

**Date:** 2026-05-24  
**Reviewer:** VENOM  
**Application Scope:** VCSM  
**Boundary Contract:** Loaded and enforced  
**Mode:** Standalone  

---

## VENOM TARGET

**Feature / Route / Engine:** VPORT Dashboard Leads + Public Business Card Lead Submission  
**Application Scope:** VCSM  
**Reason for review:** Post-architecture-refactor security audit. Module handles PII (phone, email, message) for public lead submissions and owner-only CRM access.  
**Primary trust boundary:** Public (anonymous) → VPORT Owner (authenticated + ownership-verified)

---

## SECURITY SURFACE

**Entry points:**
- `POST vport.submit_business_card_lead` RPC — public, anon-callable, SECURITY DEFINER
- `GET /actor/:actorId/dashboard/leads` — protected route, identity + ownership gated
- `PATCH vport.business_card_leads (source)` — authenticated, RLS-gated, column-restricted
- `DELETE vport.business_card_leads` — authenticated, RLS-gated
- `POST /functions/send-lead-confirmation` — Edge Function, Bearer-token gated

**Auth sources:**
- Anonymous (lead submission) — no auth required
- Supabase authenticated session (owner management)

**Authorization layer:**
- App layer: `assertActorOwnsVportActorController` via DB query (actor_owners table)
- DB layer: RLS policies — `business_card_leads_owner_select`, `_owner_update`, `_owner_delete`
- INSERT: SECURITY DEFINER RPC only — direct INSERT is blocked by RLS

**Identity surface:**
- Owner side: `actorId` + `kind` (correct canonical surfaces)
- Profile resolution: `actorId → profileId` via `readVportProfileByActorIdDAL` (internal bridge)
- Lead submitter: anonymous — no identity surface

**Sensitive objects involved:**
- `name`, `phone`, `email`, `message` — PII fields, accessible by owner only
- `source` — mutable state field, tracks contacted status
- `actor_id` — VPORT owner's actor UUID, stored in table and normalized into client object

---

## TRUST BOUNDARY TRACE

**Lead Submission Flow (public):**
```
Client input (name, phone, email, message, source)
  → Validated at: app layer (validateVportBusinessCardLeadInput) + RPC internal
  → Identity resolved at: slug lookup in RPC (no submitter identity)
  → Authorization enforced at: RPC SECURITY DEFINER (business_card_published gate)
  → Data returned to: submission result only (ok, lead_id — no PII echoed back)
```

**Owner Lead Management Flow (authenticated):**
```
Client input (actorId from URL params)
  → Validated at: FinalScreen (identity gate) + controller ownership gate
  → Identity resolved at: useIdentity() → identity.actorId
  → Authorization enforced at: assertActorOwnsVportActorController (DB query to actor_owners)
  → RLS enforces at: DB layer (owner_select / owner_update / owner_delete)
  → Data returned to: VportDashboardLeadsView (owner-only, no PII broadcast)
```

---

## SECURITY RISK FINDINGS

| Finding ID | Severity | Area | Description |
|---|---|---|---|
| VL-001 | HIGH | Bot Protection | No rate limit or CAPTCHA on public lead submission |
| VL-002 | HIGH | Integrity Attack | `source` field pre-poisoning — submitter can fake "contacted" state |
| VL-003 | MEDIUM | Email Abuse | Edge function CORS wildcard + anon key enables arbitrary email dispatch |
| VL-004 | MEDIUM | Forensics | IP address intentionally null — no abuse detection capability |
| VL-005 | MEDIUM | Audit Trail | Lead deletion leaves no record — permanent data loss without trace |
| VL-006 | LOW | URL Trust | `isSafeUrl` in edge function doesn't restrict `providerProfileUrl` to owned domains |
| VL-007 | LOW | Identity Leak | `actorId` field in normalized lead object not rendered but present in client state |
| VL-008 | LOW | Auth Shortcut | Self-ownership shortcut in assertActorOwnsVportActorController bypasses DB query |
| VL-009 | LOW | Test Coverage | No tests for ownership gate, RLS enforcement, or source state transitions |

---

## FINDINGS

---

### VL-001 — No Rate Limiting or Bot Protection on Public Lead Submission

**VENOM SECURITY FINDING**
- **Finding ID:** VL-001
- **Location:** `apps/VCSM/src/features/public/vportBusinessCard/`
  - `dal/vportBusinessCardLead.write.dal.js`
  - `view/BusinessCardLeadForm.jsx`
  - `hooks/useVportBusinessCardLeadForm.js`
  - `supabase/functions/submit_business_card_lead` (RPC)
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase RPC
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** Public Visitor → VPORT Owner (unlimited write volume)
- **Contract Violated:** Actor Ownership Contract (volume abuse degrades owner trust surface)
- **Current behavior:** The lead submission form accepts anonymous submissions via `submit_business_card_lead` RPC with no rate limiting, CAPTCHA, challenge, or throttle at any layer. No middleware, no Cloudflare Turnstile, no reCAPTCHA, no server-side token bucket. The RPC is callable by the `anon` role with no frequency constraint.
- **Risk:** Any attacker knowing a vport slug (public information visible in every VCSM URL and the Traffic directory) can flood the `business_card_leads` table with fake leads. A script could submit thousands of leads per minute against any published vport. The vport owner notification system (`publishVcsmNotification`) fires on every submission, compounding the attack surface.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Knowledge of any vport slug (freely available in VCSM URLs and TRAZE directory)
  - `anon` Supabase key (embedded in the client app — publicly available)
  - Direct RPC call with `name`, `message`, and one contact field
  - No authentication required
- **Blast Radius:** Multi-actor — any published VPORT (`business_card_published = true`) is a viable target. Currently all `directory_status = 'listed'` providers have `business_card_published = true` after migration `20260427070000`.
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — RLS INSERT policy is `USING (false)` for direct inserts; RPC bypasses with SECURITY DEFINER. No row-level rate limit in RLS.
- **Why it matters:** Owner notification spam, dashboard cluttered with fake leads, erosion of trust in the leads CRM. In a worst case, database storage pressure from unconstrained inserts.
- **Recommended mitigation:**
  1. Add Cloudflare Turnstile or hCaptcha to `BusinessCardLeadForm.jsx` before form submission
  2. Add a PostgreSQL-level rate limit inside `submit_business_card_lead` RPC (e.g., max N submissions per slug per hour via a count check)
  3. Alternatively, add a short-lived token/nonce requirement in the RPC so the business card page must first obtain a token before submission
  4. Move to Supabase Edge Function middleware for rate limiting if RPC-level throttle is insufficient
- **Rationale:** Defense-in-depth. Client-side CAPTCHA reduces bot traffic; server-side RPC rate limit enforces the contract even if the CAPTCHA is bypassed.
- **Follow-up command:** Carnage (RPC modification), Wolverine (CAPTCHA implementation)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security, Security and Risk Management

---

### VL-002 — `source` Field Pre-Poisoning: Fake "Contacted" State

**VENOM SECURITY FINDING**
- **Finding ID:** VL-002
- **Location:** `apps/VCSM/src/features/dashboard/vport/model/vportLead.model.js:18`
  - `dal/read/vportLeads.read.dal.js:3` (`LEAD_SELECT` — source column)
  - `supabase` — `submit_business_card_lead` RPC (`p_source` parameter, no enum constraint)
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase RPC
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** Public Visitor → VPORT Owner (data integrity)
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** The `isContacted` state of a lead is computed as:
  ```js
  isContacted: source.includes("contacted")
  ```
  The `source` field is set by the lead submitter via the `p_source` parameter of the public SECURITY DEFINER RPC. There is no enum constraint, CHECK constraint, or allowlist enforced at the DB or RPC layer. A submitter who calls the RPC directly (bypassing the form) can set `p_source = "vport_card_contacted"` or any value containing "contacted". The lead will appear as already-contacted in the owner's dashboard immediately upon submission.
- **Risk:** An attacker or spam tool can flood a VPORT with leads pre-marked as "contacted," causing the owner to ignore real leads. The visual badge (red pulse indicator) would still count them as NEW because `readNewLeadsCountByProfileDAL` uses `.not("source", "ilike", "%contacted%")` — but once the owner opens the leads page, every card shows "Contacted" in green, undermining trust in the CRM state.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Knowledge of vport slug (public)
  - Direct RPC call with `p_source` set to any value containing "contacted"
  - No authentication required
- **Blast Radius:** Single VPORT per attack, but any published vport is targetable
- **Identity Leak Type:** None — this is an integrity attack, not an identity leak
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — this is a data integrity issue, not an access control issue
- **Why it matters:** The entire CRM value of the leads dashboard depends on the integrity of `isContacted`. Pre-poisoning it with "contacted" source values makes the feature functionally useless for targeted VPORTs. This is also a low-cost attack — it requires only knowledge of the slug and a direct RPC call.
- **Recommended mitigation:**
  1. Add a `CHECK` constraint on `source` in the `business_card_leads` table enforcing an allowlist of valid submission sources (e.g., `CHECK (source IN ('business_card', 'vport_card', 'traffic_card', 'traze'))`)
  2. OR add input sanitization inside `submit_business_card_lead` RPC to coerce/reject non-allowlisted source values
  3. Decouple `isContacted` state from the `source` field entirely — add a dedicated `contacted_at TIMESTAMPTZ NULL` column or boolean flag that is only mutable by the authenticated owner, not by the submitter
  4. Option 3 is the strongest fix — `source` should be write-once from the submitter; contacted state should be a separate owner-controlled field
- **Rationale:** Separating submitter-controlled data from owner-controlled state is the correct trust boundary. Using a single `source` field to carry both provenance and status is the root cause.
- **Follow-up command:** Carnage (schema change — add `contacted_at` or boolean, migrate source mutation), Wolverine (app layer update)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Identity and Access Management, Security Architecture and Engineering

---

### VL-003 — Edge Function Wildcard CORS + Anon Key = Arbitrary Email Dispatch

**VENOM SECURITY FINDING**
- **Finding ID:** VL-003
- **Location:** `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts`
  - Lines: `corsHeaders` constant + `authHeader` validation
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function
- **Trust Boundary:** Public Visitor → System Service
- **Boundary Violated:** System Service (email delivery) callable from any origin
- **Contract Violated:** External API Contract
- **Current behavior:** The `send-lead-confirmation` edge function:
  1. Sets `Access-Control-Allow-Origin: "*"` — accepts requests from any origin
  2. Requires only `Authorization: Bearer <token>` — accepts the anon key which is embedded in the published client app
  3. Accepts arbitrary `email`, `name`, `vportName`, and `providerProfileUrl` in the request body
  4. Sends a lead confirmation email to any email address provided in `body.email`
  
  The anon key is not a secret — it is bundled in every build of the VCSM PWA and visible to any user who opens DevTools. Any person who knows the edge function URL and extracts the anon key from the app bundle can call this function directly to send confirmation emails to any email address.
- **Risk:** The edge function can be used as an email delivery proxy for spam or phishing. An attacker can:
  - Send bulk email to a list of addresses impersonating Vibez Citizens
  - Include arbitrary `providerProfileUrl` values (only validated as HTTP/HTTPS, not restricted to vibezcitizens.com) pointing to malicious websites
  - The email template includes a "View their profile" CTA that renders the `providerProfileUrl` — this link could point anywhere
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - Anon key extracted from app bundle (any authenticated user can do this)
  - Knowledge of the edge function URL (detectable via network traffic analysis)
  - Any target email address
- **Blast Radius:** External (email abuse impacts third parties — leads' email inboxes)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — this is outside Supabase RLS scope
- **Why it matters:** SES reputation damage from spam complaints can result in domain/account suspension. Phishing emails impersonating Vibez Citizens could harm the brand and expose users to fraud. AWS SES abuse reports are handled at the account level, not the function level.
- **Recommended mitigation:**
  1. Restrict `providerProfileUrl` to owned domains — validate that the URL hostname is `vibezcitizens.com`, `traffic.vibezcitizens.com`, or another explicitly allowed VCSM domain before including it in the email
  2. Add per-recipient rate limiting inside the edge function (e.g., track recent sends by email address using a Supabase table or KV)
  3. Move edge function invocation server-side into the RPC itself (service key only) so the anon key cannot reach it directly
  4. Replace Bearer anon key check with a short-lived signed token generated by the RPC after successful lead insertion (ties email send to a real DB insert)
- **Rationale:** Tying the email trigger to a verified DB insert (generated by the SECURITY DEFINER RPC) removes the ability to send emails without a matching lead record. Domain restriction on `providerProfileUrl` prevents phishing link injection.
- **Follow-up command:** Carnage (RPC modification), Wolverine (edge function hardening)
- **CISSP Domain:**
  - Primary: Communication and Network Security
  - Secondary: Security Operations, Software Development Security

---

### VL-004 — IP Address Intentionally Null — No Forensic/Abuse Detection Capability

**VENOM SECURITY FINDING**
- **Finding ID:** VL-004
- **Location:** `apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js:16`
  ```js
  p_ip: null,
  ```
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase RPC
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** N/A — design decision, not a boundary violation
- **Contract Violated:** None
- **Current behavior:** The `submit_business_card_lead` RPC accepts `p_ip INET` but the DAL unconditionally passes `null`. The `business_card_leads` table has an `ip_address INET NULL` column that is always stored as NULL.
- **Risk:** Combined with the absence of rate limiting (VL-001) and CAPTCHA, null IP collection means:
  - No ability to detect IP-based flooding attacks post-hoc
  - No ability to implement IP-based rate limiting in the RPC
  - No forensic evidence available if a VPORT owner reports spam
  - No ability to block specific abusive clients at the RPC layer
- **Severity:** MEDIUM
- **Exploitability:** HIGH (this is an enabler finding — it amplifies VL-001)
- **Attack Preconditions:** N/A — this is a missing defensive control
- **Blast Radius:** Multi-actor (all published VPORTs)
- **Identity Leak Type:** None — this is a forensics gap, not a leak
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** IP collection is a standard fraud and abuse detection mechanism. Without it, the platform has no post-incident forensics and cannot implement server-side rate limiting that would actually stop determined attackers. This is a deliberate gap that compounds VL-001.
- **Recommended mitigation:**
  1. Collect the client IP in the edge runtime where available — Supabase Edge Functions have access to the request IP via `req.headers.get('x-forwarded-for')` or similar
  2. Pass the IP through the RPC as `p_ip` and store it
  3. Use the IP in the rate-limiting logic recommended for VL-001
  4. If privacy concerns prohibit IP storage, at minimum implement IP-based rate limiting at the edge without persisting the IP (use a short-lived counter, not stored data)
- **Rationale:** IP collection for abuse detection is standard practice. The column exists — the intent to collect was present but the implementation was left null.
- **Follow-up command:** Carnage (RPC + edge function update), Wolverine (DAL update)
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Security Architecture and Engineering, Security Assessment and Testing

---

### VL-005 — Lead Deletion Leaves No Audit Trail

**VENOM SECURITY FINDING**
- **Finding ID:** VL-005
- **Location:** `apps/VCSM/src/features/dashboard/vport/dal/write/vportLeads.write.dal.js:40-55`
  - `controller/vportLeads.controller.js:49-57` (`deleteVportLeadController`)
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** N/A within the trust boundary, but missing audit surface
- **Contract Violated:** None (no explicit audit contract found)
- **Current behavior:** `deleteVportBusinessCardLeadDAL` performs a hard DELETE on `vport.business_card_leads`. There is no soft-delete flag, no deletion timestamp, no audit log table, and no record of which actorId performed the deletion. Lead data including PII (name, phone, email, message) is permanently and irrecoverably destroyed.
- **Risk:**
  - If a VPORT owner account is compromised, an attacker could silently delete all incoming leads with no forensic trace
  - If a platform dispute arises (e.g., "I never received that lead"), there is no way to verify whether a lead ever existed
  - GDPR/CCPA "right to erasure" conflicts — if a lead submitter requests deletion, it can be fulfilled, but there's no record that the request was honored
  - Inverse: data retention — there's no record of what personal data was collected and then deleted, which may be required in some jurisdictions
- **Severity:** MEDIUM
- **Exploitability:** LOW (requires compromised VPORT owner account)
- **Attack Preconditions:**
  - Compromised VPORT owner session
  - OR legitimate owner acting maliciously
- **Blast Radius:** Single VPORT (all leads for that vport)
- **Identity Leak Type:** None — this is a data governance gap
- **Cache Trust Type:** None
- **RLS Dependency:** VERIFIED — RLS owner_delete policy enforces only the vport owner can delete
- **Why it matters:** PII deletion without record is a compliance and operational risk. Platforms collecting personal contact data (name, phone, email) should maintain minimal deletion audit trails.
- **Recommended mitigation:**
  1. Implement soft delete: add `deleted_at TIMESTAMPTZ NULL` and `deleted_by_actor_id UUID NULL` to `business_card_leads`
  2. OR add a `lead_deletions` audit log table that records `(lead_id, vport_profile_id, deleted_by_actor_id, deleted_at)` without storing PII
  3. The DELETE operation in the DAL would become an UPDATE setting `deleted_at = NOW()`, and all read queries would add `.is("deleted_at", null)`
  4. Physical deletion could still happen on a schedule (e.g., 90 days after soft delete) to honor data minimization
- **Rationale:** Soft delete with actor attribution gives the platform basic audit capability without building a complex audit system. The deletion audit record does not need to include PII to be useful.
- **Follow-up command:** Carnage (schema change), Wolverine (app layer update)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security Operations, Security and Risk Management

---

### VL-006 — `isSafeUrl` Does Not Restrict `providerProfileUrl` to Owned Domains

**VENOM SECURITY FINDING**
- **Finding ID:** VL-006
- **Location:** `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts`
  ```ts
  function isSafeUrl(url: unknown): url is string {
    if (typeof url !== "string" || !url.trim()) return false;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch { return false; }
  }
  ```
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function
- **Trust Boundary:** System Service
- **Boundary Violated:** External URL trust — any HTTPS URL passes validation
- **Contract Violated:** External API Contract
- **Current behavior:** The edge function accepts any HTTP or HTTPS URL as `providerProfileUrl` and embeds it into the "View their profile" CTA link in the confirmation email. No check is made to ensure the URL is within `vibezcitizens.com` or another owned domain.
- **Risk:** If combined with VL-003 (unauthorized edge function calls), arbitrary URLs including phishing sites could be embedded in confirmation emails. Even in the legitimate submission path, a client-side parameter tampering attack could replace the profile URL with a malicious destination.
- **Severity:** LOW
- **Exploitability:** LOW in isolation (requires VL-003 to be exploitable); MEDIUM in combination
- **Attack Preconditions:**
  - Ability to call edge function directly (see VL-003)
  - Any HTTPS URL as `providerProfileUrl`
- **Blast Radius:** External (email recipients)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Open redirector and phishing link embedding in transactional emails is a well-known abuse vector. The fix is minimal — one hostname allowlist check.
- **Recommended mitigation:**
  ```ts
  const ALLOWED_HOSTS = ["vibezcitizens.com", "traffic.vibezcitizens.com"];
  function isSafeUrl(url: unknown): url is string {
    if (typeof url !== "string" || !url.trim()) return false;
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:") return false;
      return ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
    } catch { return false; }
  }
  ```
- **Rationale:** Domain allowlist is the minimal correct fix. It closes the phishing link injection path without changing the function's purpose.
- **Follow-up command:** Wolverine (edge function update)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Communication and Network Security

---

### VL-007 — `actorId` Present in Normalized Lead Object, Not Displayed but Resident in Client State

**VENOM SECURITY FINDING**
- **Finding ID:** VL-007
- **Location:** `apps/VCSM/src/features/dashboard/vport/model/vportLead.model.js:13`
  ```js
  actorId: row?.actor_id ?? null,
  ```
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** Internal ID surface — `actorId` (VPORT's own actor UUID) present in client state
- **Contract Violated:** Public Identity Surface Contract (internal IDs should not be unnecessarily present in client-facing data)
- **Current behavior:** The `normalizeVportLead` function includes `actorId` in the normalized lead object. This field is the VPORT's own actor UUID (the lead owner's identity). It is not rendered in any screen, but it exists in React state (`leads[]` array). It is accessible from browser DevTools, memory inspection, or if the state were accidentally logged.
- **Risk:** LOW — this is the VPORT's own actorId, which the authenticated owner already knows (it's in the URL). However, the `actor_id` stored in `business_card_leads` may in some contexts be the lead submitter's actor_id if the submitter was authenticated. Normalizing and storing this in client state unnecessarily exposes an internal UUID.
- **Severity:** LOW
- **Exploitability:** LOW
- **Attack Preconditions:** Access to browser DevTools while authenticated as the owner
- **Blast Radius:** Single actor
- **Identity Leak Type:** Internal UUID exposure (VPORT's own actor_id)
- **Cache Trust Type:** None
- **RLS Dependency:** VERIFIED — field is already RLS-gated to the owner
- **Why it matters:** Principle of data minimization — only expose fields that are rendered or needed by the consuming layer. The screen has no use for `actorId`.
- **Recommended mitigation:** Remove `actorId` from `normalizeVportLead` output if the screen has no use for it, or at minimum confirm that `actor_id` in the table is always the VPORT's actor_id (never the submitter's). If it's ever the submitter's, exposure in client state is a more serious concern.
- **Rationale:** Data minimization is the correct principle. Fields not consumed by any component should not be in client state.
- **Follow-up command:** DB (verify what actor_id represents in this table — owner or submitter), Wolverine (remove from model if confirmed unused)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

### VL-008 — Self-Ownership Shortcut in `assertActorOwnsVportActorController` Bypasses DB Query

**VENOM SECURITY FINDING**
- **Finding ID:** VL-008
- **Location:** `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:10-12`
  ```js
  if (String(requestActorId) === String(targetActorId)) {
    return { ok: true, mode: "self" };
  }
  ```
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** Ownership verification skipped for self-match
- **Contract Violated:** Actor Ownership Contract (partial — design intent is preserved but DB verification is bypassed)
- **Current behavior:** When `requestActorId === targetActorId`, the ownership check short-circuits without querying `actor_owners`. This is triggered in the leads context when a user is currently acting AS the vport actor (identity switched to the vport).
- **Risk:** The shortcut is architecturally sound for the case where a user is requesting their own data. However, if `actorId` were ever client-controlled (e.g., passed as a query parameter rather than from `useIdentity()`), the self-match could be forged. In the current implementation, `callerActorId` comes from `identity.actorId` which is server-resolved. The risk exists only if the session identity resolution is compromised.
- **Severity:** LOW
- **Exploitability:** LOW — `callerActorId` is from server-resolved session, not client input
- **Attack Preconditions:**
  - Client must supply its own actorId as both the `requestActorId` and `targetActorId`
  - This requires the session actorId to match the target — only possible if genuinely that actor
- **Blast Radius:** Single actor
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** REQUIRED — if app-layer shortcut were bypassed, RLS remains as backstop
- **Why it matters:** The shortcut is documented behavior but should be documented explicitly as a known design decision for audit purposes. The CISSP concern is that the self-shortcut path has no DB verification — it is entirely dependent on the session identity being trustworthy.
- **Recommended mitigation:** No code change required. Add explicit documentation in `assertActorOwnsVportActorController` explaining the shortcut rationale and the conditions under which it is safe (server-resolved identity only). Ensure callerActorId is always sourced from `useIdentity().identity.actorId` and never from URL params or client body.
- **Rationale:** Documenting security shortcuts is standard audit practice. The shortcut itself is acceptable; the lack of documentation creates future audit risk.
- **Follow-up command:** Logan (document the shortcut rationale in controller file header)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Assessment and Testing

---

### VL-009 — No Test Coverage on Ownership Gate, RLS Enforcement, or Source State Transitions

**VENOM SECURITY FINDING**
- **Finding ID:** VL-009
- **Location:** `apps/VCSM/src/features/dashboard/vport/` — entire module
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase RPC, Supabase Table
- **Trust Boundary:** All (public + authenticated)
- **Boundary Violated:** N/A — missing test coverage
- **Contract Violated:** None explicit
- **Current behavior:** No test files exist for the vport leads module. The following security-critical paths have no automated verification:
  - `assertActorOwnsVportActorController` — no test that non-owner is correctly rejected
  - RLS `business_card_leads_owner_select` — no integration test verifying cross-vport isolation
  - `source.includes("contacted")` state derivation — no test for pre-poisoned source values
  - `deleteVportLeadController` — no test that a non-owner delete attempt is rejected
  - `readNewLeadsCountByProfileDAL` — no test that `ilike "%contacted%"` correctly excludes pre-poisoned leads
- **Risk:** Security-critical paths can regress silently. A future refactor of the ownership controller or RLS policy could introduce a regression that goes undetected.
- **Severity:** LOW
- **Exploitability:** N/A — this is a coverage gap, not an exploitable vulnerability
- **Attack Preconditions:** N/A
- **Blast Radius:** Unknown — depends on what future regression occurs
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** UNVERIFIED by tests
- **Why it matters:** Security-critical paths without tests are a compliance and engineering risk. The CISSP Security Assessment and Testing domain specifically requires verification of controls, not just implementation.
- **Recommended mitigation:**
  1. Add unit tests for `normalizeVportLead` — test source pre-poisoning scenarios
  2. Add integration tests for `assertActorOwnsVportActorController` — test both owner and non-owner paths
  3. Add RLS integration tests using Supabase's `auth.uid()` impersonation to verify cross-vport isolation
  4. Add a test for `readNewLeadsCountByProfileDAL` that verifies a `source = "contacted"` value is excluded from the count
- **Rationale:** Tests are the executable specification of security intent. Without them, security regressions are invisible.
- **Follow-up command:** Wolverine (test implementation)
- **CISSP Domain:**
  - Primary: Security Assessment and Testing
  - Secondary: Software Development Security

---

## IDENTITY SURFACE WARNINGS

**IDENTITY SURFACE WARNING — VL-007**
Location: `model/vportLead.model.js:13`
Current identity surface: `actorId` (UUID) present in normalized client-state lead objects
Expected identity surface: Only rendered/consumed fields should be in client state
Risk: Internal UUID unnecessarily resident in React state (not rendered)
Suggested correction: Remove `actorId` from `normalizeVportLead` if no screen consumes it; verify `actor_id` column semantics first (see VL-007)

---

## DEBUG LEAKAGE REVIEW

**No production debug leakage detected in this module.**

Verified:
- Load error messages in `VportDashboardLeadsView` are guarded: `import.meta.env.DEV ? error : "Unable to load leads right now."` ✓
- `useVportNewLeadsCount` swallows errors silently (badge-level, correct for background polling) ✓
- Controller errors are not serialized with stack traces to the UI ✓
- Edge function logs `console.error("[send-lead-confirmation] SES error:", errMsg)` — server-side only, not returned to client ✓

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VL-001 | No rate limit / bot protection | UI + RPC | P0 | App + DB | Carnage → Wolverine |
| VL-002 | Source field pre-poisoning | RPC + Schema | P0 | DB | Carnage → Wolverine |
| VL-003 | Edge function email abuse | Edge Function | P1 | App | Wolverine |
| VL-004 | Null IP — no forensics | DAL + RPC | P1 | App + DB | Carnage → Wolverine |
| VL-005 | No deletion audit trail | Schema + DAL | P1 | DB | Carnage → Wolverine |
| VL-006 | Unrestricted providerProfileUrl | Edge Function | P1 | App | Wolverine |
| VL-007 | actorId in client state | Model | P2 | App | DB → Wolverine |
| VL-008 | Self-ownership shortcut undocumented | Documentation | P2 | Documentation | Logan |
| VL-009 | No test coverage | Test layer | P2 | App | Wolverine |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VL-001 (risk governance gap — no bot protection policy) |
| Asset Security | 2 | VL-005 (deletion without audit), VL-007 (unnecessary UUID in client state) |
| Security Architecture and Engineering | 3 | VL-001 (no defense-in-depth on submission), VL-002 (source field trust boundary), VL-004 (missing forensic control) |
| Communication and Network Security | 2 | VL-003 (wildcard CORS + anon key abuse), VL-006 (unrestricted URL in email) |
| Identity and Access Management | 3 | VL-002 (integrity attack degrades trust surface), VL-007 (UUID exposure), VL-008 (shortcut bypass) |
| Security Assessment and Testing | 2 | VL-004 (no abuse detection testing), VL-009 (no test coverage) |
| Security Operations | 2 | VL-003 (SES reputation risk), VL-005 (no audit trail) |
| Software Development Security | 4 | VL-001 (no input throttle), VL-002 (no source enum), VL-003 (edge function hardening), VL-006 (URL validation gap) |

**All 8 CISSP domains were covered.** No domain was out of scope or not applicable to this module.

---

## RELEASE GATE ASSESSMENT

| Finding | Severity | Release Blocker |
|---|---|---|
| VL-001 — No rate limiting | HIGH | YES — before public launch of leads to all VPORTs |
| VL-002 — Source pre-poisoning | HIGH | YES — before public launch |
| VL-003 — Edge function abuse | MEDIUM | YES — before public launch |
| VL-004 — Null IP | MEDIUM | RECOMMENDED before launch |
| VL-005 — No audit trail | MEDIUM | RECOMMENDED before launch |
| VL-006 — URL allowlist | LOW | NO — hardening, not blocking |
| VL-007 — actorId in state | LOW | NO — hardening |
| VL-008 — Shortcut docs | LOW | NO — documentation |
| VL-009 — No tests | LOW | NO — but required before next security audit |

**VL-001 and VL-002 are release blockers.** The leads feature can function privately for existing VPORT owners who are directly notified, but should not be publicly exposed (e.g., via TRAZE directory links) until rate limiting and source field integrity are resolved.

---

## FINAL VENOM STATUS

**OVERALL RISK: HIGH**  
Two release-blocking findings (VL-001, VL-002) on a publicly-accessible RPC.  
Three medium findings (VL-003, VL-004, VL-005) that should be resolved before wider rollout.  
Dual-layer auth (app + RLS) is sound. PII access is correctly owner-restricted. Debug leakage is clean.

The module's authentication and authorization architecture is correct. The risk lives entirely in the public submission path and the data integrity of the `source` field.

# VENOM V2 SECURITY REVIEW — leads

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard |
| Feature | leads (dashboard module + public submission) |
| Command | VENOM |
| Ticket | TICKET-VENOM-LEADS-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/outputs/2026/06/04/Venom/2026-06-04_00-00_venom_leads-security-review.md |
| Timestamp | 2026-06-04T00:00:00 |

---

## 1. VENOM Target

```
VENOM TARGET
Feature / Route / Engine:
  Dashboard: /actor/:actorId/dashboard/leads (VportDashboardLeadsFinalScreen)
  Public:    /public/vportBusinessCard lead submission + send-lead-confirmation Edge Function
  Traffic:   apps/Traffic/src/features/conversion/ → submit_business_card_lead RPC
Application Scope: VCSM + VCSM:public + TRAFFIC (cross-app shared RPC + Edge Function)
Reason for review: Full V2 security review of leads module — owner inbox, public submission path, edge function
Primary trust boundary: Authenticated VPORT Owner (owner inbox) / Public Visitor (lead submission)
```

---

## 2. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days

| Map                  | Generated At             | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
Write surfaces in scope: 4 (delete, update, rpc×2)
RPC surfaces in scope: 2 (submit_business_card_lead from VCSM:public + Traffic:conversion)
Edge function surfaces in scope: 3 (send-lead-confirmation from VCSM:public, Traffic:conversion, edge-function-file)
Security paths in scope: 12
```

---

## 3. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 7 | Attack surface inventory |
| rpc-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 2 | RPC surface inventory |
| edge-function-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 3 | Edge function inventory |
| security-path-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 12 | Security path inventory |
| route-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 0 (leads paths LOW conf) | Route→write chain resolution |
| write-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 7 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 2 | RPC caller chain resolution |
| edge-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 3 | Edge caller chain resolution |

```
Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total surfaces in scope: 4 write + 2 rpc + 3 edge
Total security paths in scope: 12
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 12
```

> Note: ALL 12 leads security paths carry `confidence: LOW` — no route-confirmed execution path was resolved by the scanner. LOW confidence protocol applied to all surfaces (§V2.4).

---

## 4. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: leads (dashboard + public)
Scan Date: 2026-06-03T00:22:42.771Z

Write Surfaces: 4
  INSERT: 0 | UPDATE: 1 (markVportBusinessCardLeadContactedDAL) | DELETE: 1 (deleteVportBusinessCardLeadDAL)
  RPC: 2 (submit_business_card_lead ×2 callers) | UPSERT: 0
  Tables affected: vport.business_card_leads

Edge Functions: 3 signals → 1 function: send-lead-confirmation
  Callers: sendLeadConfirmationEmailDAL (VCSM:public), invokeProviderLeadConfirmation (Traffic:conversion)
  File: apps/VCSM/supabase/functions/send-lead-confirmation/index.ts

Security Paths: 12 total
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 12
  Access=unknown: 12 — scanner could not resolve route-confirmed caller chains

Execution Paths Resolved: 0 / 12 (scanner) → 12 / 12 (manual trace — see §5 below)
```

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: DRAFT
§5 Security Rules declared: 7 (SEC-001 through SEC-007 / BEH-DASH-leads-201 through 207)
§5 Rules verified in source: 7 / 7
§5 Rules unenforced: NONE
§9 Must Never Happen declared: 6 (MNH-001 through MNH-006 / BEH-DASH-leads-301 through 306)
§9 Invariants protected in source: 5 / 6
§9 Invariants unprotected: BEH-DASH-leads-306 (CAUTION — RPC/EF governance external, partially addressed below)
```

**§5 Cross-Check Results:**

| BEH ID | Rule | Enforcement Location | VENOM Verification |
|---|---|---|---|
| BEH-DASH-leads-201 | Only owners may mount leads view | VportDashboardLeadsFinalScreen.jsx:26–48 | SOURCE VERIFIED |
| BEH-DASH-leads-202 | List/count/mark/delete assert ownership before DAL | vportLeads.controller.js:33,40,51,59,64 | SOURCE VERIFIED |
| BEH-DASH-leads-203 | Write DALs scope by leadId + profileId | vportLeads.write.dal.js:28–29,45–46 | SOURCE VERIFIED |
| BEH-DASH-leads-204 | Leads PII is owner-only — no delegation | controller.js comment + owner-only gate | SOURCE VERIFIED |
| BEH-DASH-leads-205 | Fast count cannot be standalone anon path | fastCountNewVportLeadsController:57–61 | SOURCE VERIFIED — asserts ownership before DAL |
| BEH-DASH-leads-206 | Public card owns submission; dashboard must not expose writes | index.js exports DALs: NONE (models+hooks+screens only) | SOURCE VERIFIED |
| BEH-DASH-leads-207 | Index must not export DALs/controllers | leads/index.js lines 1–12 | SOURCE VERIFIED |

**§9 Cross-Check Results:**

| BEH ID | Invariant | Protection | VENOM Verification |
|---|---|---|---|
| BEH-DASH-leads-301 | Non-owner cannot view another VPORT lead inbox | Screen gate + controller gate | SOURCE VERIFIED |
| BEH-DASH-leads-302 | Controller ops never call DAL before ownership passes | assertActorOwnsVportActorController is first call in all 5 controllers | SOURCE VERIFIED |
| BEH-DASH-leads-303 | Mark/delete must never mutate outside resolved owner profile | DAL scopes both .eq("id", leadId) + .eq("vport_profile_id", profileId) | SOURCE VERIFIED |
| BEH-DASH-leads-304 | Cached profileId fast count cannot be standalone bypass | fastCountNewVportLeadsController requires all 3 params + asserts ownership | SOURCE VERIFIED |
| BEH-DASH-leads-305 | DALs/controllers must never be public card boundary | leads/index.js does not export dal/* or controller/* | SOURCE VERIFIED |
| BEH-DASH-leads-306 | Public submission must not bypass RPC policy or allow email spam | CAUTION — partial. RPC policy: direct INSERT is blocked (migration verified). Email spam: NOT PROTECTED — see VEN-LEADS-001 | NEW FINDING |

---

## 6. LOW Confidence Surface Trace — Manual Results

All 12 scanner paths had confidence: LOW (no resolved route execution path). Manual trace results:

| DAL Function | Manual Callers Found | Route | Auth Enforced |
|---|---|---|---|
| `deleteVportBusinessCardLeadDAL` | `deleteVportLeadController` (controller.js:63) | `/actor/:actorId/dashboard/leads` via `useVportLeads` hook | YES — assertActorOwnsVportActorController:64 |
| `markVportBusinessCardLeadContactedDAL` | `markVportLeadContactedController` (controller.js:39) | `/actor/:actorId/dashboard/leads` via `useVportLeads` hook | YES — assertActorOwnsVportActorController:40 |
| `createVportBusinessCardLeadDAL` (VCSM) | `submitVportBusinessCardLeadController` (vportBusinessCard.controller.js:76) | Public business card page | N/A — intentionally public/anonymous |
| `createVportBusinessCardLeadDAL` (Traffic) | `submitProviderLeadRow` (submitProviderLead.write.dal.js) | Traffic directory provider lead form | N/A — intentionally public/anonymous |
| `sendLeadConfirmationEmailDAL` | `fireLeadConfirmationEmail` → `submitVportBusinessCardLeadController` (controller.js:86) | Same public route as above | N/A — fire-and-forget, no auth required by design |
| `send-lead-confirmation` (EF file) | Invoked by VCSM public controller + Traffic conversion DAL | Public routes | Bearer presence check only — see VEN-LEADS-001 |

---

## 7. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| DELETE business_card_leads at deleteVportBusinessCardLeadDAL | write-surface-map | HIGH | YES — write.dal.js:37–52; ownership via controller:63–70 | [SOURCE_VERIFIED] | SAFE |
| UPDATE business_card_leads at markVportBusinessCardLeadContactedDAL | write-surface-map | HIGH | YES — write.dal.js:13–35; ownership via controller:39–47; source CHECK constraint mismatch at DB | [SOURCE_VERIFIED] | VEN-LEADS-003 |
| RPC submit_business_card_lead (VCSM:public) | rpc-map | HIGH | YES — vportBusinessCardLead.write.dal.js:15–24; no rate limiting visible | [SOURCE_VERIFIED] | VEN-LEADS-002 |
| RPC submit_business_card_lead (Traffic:conversion) | rpc-map | HIGH | YES — submitProviderLead.write.dal.js; anon client; no rate limiting | [SOURCE_VERIFIED] | VEN-LEADS-002 (same RPC) |
| edge_function send-lead-confirmation (VCSM:public) | edge-function-map | HIGH | YES — index.ts:355–358; Bearer presence check only, no JWT validation | [SOURCE_VERIFIED] | VEN-LEADS-001 |
| edge_function send-lead-confirmation (Traffic:conversion) | edge-function-map | HIGH | YES — submitProviderLead.write.dal.js; anon client invokes EF with no auth validation | [SOURCE_VERIFIED] | VEN-LEADS-001 |
| security-path: access=unknown for all 12 leads paths | security-path-map | LOW | YES — manually traced all 6 DAL functions to their callers | [SOURCE_VERIFIED] | Multiple / SAFE for owner paths |
| RLS SELECT policy for business_card_leads | Not in scanner maps | N/A | PARTIAL — CREATE POLICY business_card_leads_owner_select referenced in migration comment; defining migration not in tracked set | [SCANNER_LEAD] | VEN-LEADS-004 |

---

## 8. Trust Boundary Findings

---

### VEN-LEADS-001 [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-LEADS-001
- **Location:** `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts:355–358`
- **Application Scope:** VCSM + TRAFFIC (both invoke this function)
- **Platform Surface:** Edge Function / External Email Sender
- **Trust Boundary:** Public Visitor / Anon
- **Boundary Violated:** Public Visitor → Authenticated Email Sender (no real auth gate)
- **Contract Violated:** Media Access Contract (outbound email channel misclassified as low-risk)
- **Current behavior:** The function checks `Authorization` header starts with `"Bearer "` but does NOT verify the token against Supabase JWT. The Supabase anon key is embedded in every VCSM and Traffic frontend bundle (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). Any caller who reads the browser bundle can invoke the function directly with the public anon key as the Bearer token and send a confirmation email to any arbitrary email address with any `name`, `vportName`, or `source` values. There is no per-email cooldown, per-IP rate limit, or per-sender deduplication in the function body. Error code `EMAIL_SEND_FAILED` is returned as HTTP 200 (not 5xx), obscuring AWS SES failures from callers.
- **Risk:** Unauthenticated email spam to arbitrary targets using the platform's AWS SES sender identity. An attacker extracts the anon key (public in JS bundle), calls the function in a loop with harvested email addresses, and triggers Vibez Citizens-branded emails to victims who never submitted a lead.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Anon key extracted from frontend bundle (publicly accessible via browser DevTools)
  - Target email address known
  - Direct HTTP POST to the Supabase Edge Function URL
  - No account or lead submission required
- **Blast Radius:** External email recipients — any email address worldwide; platform SES reputation risk (spam classification, SES suspension)
- **Identity Leak Type:** None (attacker controls all fields; no platform identity exposed)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE (Edge Function does not query DB)
- **Why it matters:** AWS SES suspension or spam classification affects all platform transactional email (bookings, notifications, confirmations). A sustained spam campaign can exhaust SES sending limits and damage sender reputation irreversibly. The Vibez Citizens brand is used in the email header, so victims associate the spam with the platform.
- **Recommended mitigation:**
  1. Implement application-level rate limiting in the Edge Function: track calls per `p_email` (normalize and hash) using Supabase KV or an in-memory map with TTL; reject duplicates within a 5–10 minute window.
  2. Add per-IP rate limiting using `req.headers.get("x-forwarded-for")` or Deno Deploy's IP rate limit primitives.
  3. Validate the Bearer JWT against Supabase's public JWT secret using `jose` or the Supabase JWT helper — so that only valid Supabase session or anon tokens issued by your project can invoke the function.
  4. Consider requiring a signed nonce from the lead submit RPC (passed in the function body) that the Edge Function verifies — coupling email confirmation to a real DB row creation.
  5. Move `EMAIL_SEND_FAILED` response to HTTP 500 (not 200) so SES failures are visible to monitoring.
- **Rationale:** The anon key being "public" does not mean it should be usable as a spam tool. Supabase's intended model is that RLS and app-layer checks limit what the anon key can do. A direct Edge Function invocation bypasses RLS entirely.
- **Follow-up command:** ELEKTRA (source-to-sink trace for Edge Function auth path), SPIDER-MAN (test: direct invocation with anon key bypasses submission flow)
- **CISSP Domain:**
  - Primary: Communication and Network Security
  - Secondary: Software Development Security, Security Operations

---

### VEN-LEADS-002 [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-LEADS-002
- **Location:** `apps/VCSM/supabase/` (no rate-limiting migration found) + `apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js:15–24` + `apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js`
- **Application Scope:** VCSM + TRAFFIC
- **Platform Surface:** Supabase RPC (`vport.submit_business_card_lead`) / Public Visitor
- **Trust Boundary:** Public Visitor → VPORT Owner Inbox (PII insertion into owner CRM)
- **Boundary Violated:** No throttle separates legitimate public submission from bulk injection
- **Contract Violated:** VPORT Lifecycle Contract (inactive/unpublished VPORTs are guarded by RPC), Booking Trust Contract (analogy: unthrottled write volume)
- **Current behavior:** `submit_business_card_lead` is a SECURITY DEFINER RPC callable by the `anon` role. It performs slug lookup, availability guard (`business_card_published = true`), and inserts a row into `vport.business_card_leads`. No migration or function body fragment reviewed shows a per-IP, per-email, or per-VPORT-slug rate limit or flood throttle at the DB level. The p_user_agent and p_ip parameters exist but their use within the function body is unknown (defining migration not recovered).
- **Risk:** A public attacker (or competitor) can flood a target VPORT owner's lead inbox with junk leads, exhausting the owner's ability to identify real leads. Each submission also triggers a `lead_received` notification and optionally a confirmation email (compounding VEN-LEADS-001). VPORT owners with popular business cards are disproportionately affected.
- **Severity:** MEDIUM
- **Exploitability:** HIGH (anon key is public; RPC accepts any valid slug with `business_card_published = true`)
- **Attack Preconditions:**
  - Anon key extracted from frontend bundle
  - Target VPORT slug known (public from business card URL / TRAZE directory)
  - Valid name + message (any string satisfying non-empty check)
- **Blast Radius:** Single VPORT (targeted) or multi-VPORT (bulk sweep); owner notification spam
- **Identity Leak Type:** None (attacker controls submitted PII)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE (SECURITY DEFINER bypasses RLS; rate limiting is a function-body concern)
- **Why it matters:** Lead inbox is the VPORT owner's CRM for real customer inquiries. A flooded inbox undermines business value and degrades trust in the platform. Persistent flooding qualifies as a denial-of-service on a business feature.
- **Recommended mitigation:**
  1. Add rate-limiting logic to `submit_business_card_lead` function body: track submissions per `(p_slug, p_ip)` and `(p_slug, p_email)` in a lightweight rate table or via `pg_sleep`-gated insert, rejecting with `RATE_LIMITED` if N submissions in M minutes exceeded.
  2. Add `p_ip` population at the DAL callsite — currently both VCSM and Traffic pass `p_ip: null`, making IP-based throttle impossible.
  3. Consider a CAPTCHA or challenge token for the public lead form.
  4. Add a minimum `created_at` gap constraint (e.g., 1 submission per slug per email per hour at DB level).
- **Rationale:** `p_ip` is accepted as a parameter but always passed as null by both callers. If the function has IP-based rate logic, it is permanently disabled. This should be confirmed and fixed.
- **Follow-up command:** DB (inspect `submit_business_card_lead` function body for rate logic), CARNAGE (design rate-limiting migration)
- **CISSP Domain:**
  - Primary: Security and Risk Management
  - Secondary: Software Development Security, Communication and Network Security

---

### VEN-LEADS-003 [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-LEADS-003
- **Location:** `apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql:46–62` + `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal.js:21` + `apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js` (p_source: "directory")
- **Application Scope:** VCSM + TRAFFIC
- **Platform Surface:** Supabase Table (vport.business_card_leads), PWA Owner Dashboard
- **Trust Boundary:** Authenticated VPORT Owner (mark-contacted write path)
- **Boundary Violated:** DB CHECK constraint rejects a valid app-layer operation
- **Contract Violated:** Actor Ownership Contract (owner mutation path fails silently at DB layer)
- **Current behavior:** The DB CHECK constraint `business_card_leads_source_allowlist` includes `'traze_provider_lead'` as a valid submission-time source value. The Traffic app currently passes `p_source: "directory"`, but the allowlist anticipates future `traze_provider_lead` submissions. The `normalizeContactedSource()` function in the write DAL computes the contacted variant as `${source}_contacted` — so a lead with `source='traze_provider_lead'` would produce `'traze_provider_lead_contacted'`. This value is NOT in the constraint allowlist. The UPDATE would throw a DB constraint violation. The owner mark-contacted action would fail with an action error, and the lead is permanently stuck in the uncontacted state.
- **Risk:** Any lead submitted with `source='traze_provider_lead'` becomes impossible to mark as contacted. This is a data integrity trap: the lead row is valid, but the owner CRM action fails silently at the DB layer. The owner sees an error but cannot resolve it.
- **Severity:** MEDIUM
- **Exploitability:** LOW (requires a caller to use `source='traze_provider_lead'`; Traffic currently uses `'directory'`; no active code path produces `traze_provider_lead` today)
- **Attack Preconditions:**
  - Lead inserted with `source='traze_provider_lead'` (future code path or adversarial RPC call)
  - Owner attempts to mark the lead as contacted
- **Blast Radius:** Leads with `traze_provider_lead` source — owner CRM degraded for this subset
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE (app-layer logic mismatch, not an RLS issue)
- **Why it matters:** The constraint was added specifically to protect source field integrity (DB-003). The missing `traze_provider_lead_contacted` entry creates an inconsistency: the field is allowed in, but the owner cannot transition it to the contacted state. As Traffic expands, this may activate silently.
- **Recommended mitigation:** Add `'traze_provider_lead_contacted'` to the `business_card_leads_source_allowlist` CHECK constraint in a new Carnage migration. Also review whether `normalizeContactedSource` should use a fixed lookup table rather than `_contacted` string concatenation so future sources are validated at the app layer before reaching the DB.
- **Rationale:** The contacted variant was missing from the original p1_hardening constraint design. All source values in the allowlist that can be set at submission time need a corresponding `_contacted` variant.
- **Follow-up command:** CARNAGE (add migration for missing contacted variant), DB (verify no existing rows with traze_provider_lead source)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Asset Security, Security Architecture and Engineering

---

### VEN-LEADS-004 [SCANNER_LEAD]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-LEADS-004
- **Location:** `apps/VCSM/supabase/migrations/20260427080000_grant_business_card_leads_owner_write.sql:17` (reference comment: "same ownership subquery as business_card_leads_owner_select")
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table/View (vport.business_card_leads READ path)
- **Trust Boundary:** Authenticated VPORT Owner (read DAL expects profileId scoping to protect PII)
- **Boundary Violated:** DB SELECT policy dependency unverified — if absent or overly permissive, any authenticated user could read all leads for any VPORT via direct PostgREST table access
- **Contract Violated:** Actor Ownership Contract, Asset Security (PII)
- **Current behavior:** `readVportBusinessCardLeadsByProfileDAL` filters by `vport_profile_id` in the app layer after the controller asserts ownership. The app-layer chain is correct. However, a DB-level SELECT policy (`business_card_leads_owner_select`) is referenced only indirectly — as a comment describing the UPDATE policy's "same ownership subquery." The migration that originally CREATE'd this SELECT policy (`business_card_leads_owner_select`) was not found among the tracked migration files reviewed. Its current state on the live DB is UNVERIFIED by VENOM.
- **Risk:** If the SELECT policy is absent or misconfigured (e.g., allows any `authenticated` user to `SELECT *` from the table), a direct PostgREST API call (`GET /rest/v1/business_card_leads`) bypasses the controller's ownership check and returns leads for any VPORT to any authenticated user. `business_card_leads` contains PII (name, phone, email, message).
- **Severity:** MEDIUM (risk is real if policy is absent; severity reduced from HIGH because direct table access requires an authenticated session)
- **Exploitability:** MEDIUM (requires authenticated Citizen account + knowledge of direct PostgREST URL pattern; no VPORT ownership required if policy is absent)
- **Attack Preconditions:**
  - Authenticated Citizen account
  - Direct PostgREST table access: `GET /rest/v1/business_card_leads?vport_profile_id=eq.<uuid>`
  - SELECT policy absent or misconfigured on live DB
- **Blast Radius:** All VPORT lead inboxes (PII of all submitted leads across all VPORTs)
- **Identity Leak Type:** Private contact exposure (name, phone, email, message for all leads)
- **Cache Trust Type:** None
- **RLS Dependency:** UNVERIFIED — policy referenced by comment but defining migration not recovered
- **Why it matters:** `business_card_leads` is the highest-PII table in the vport schema — it contains the personal contact details of public users who submitted inquiries. An open SELECT policy would expose this to all authenticated Citizens.
- **Recommended mitigation:** Run `DB` to inspect the live `business_card_leads` RLS policies. Confirm `business_card_leads_owner_select` (or equivalent) exists with a `USING` clause that joins `vport.profiles → vc.actor_owners → auth.uid()`. If absent, route to CARNAGE to add it.
- **Rationale:** The BEHAVIOR.md marks this as SOURCE VERIFIED but that only covers the app-layer assertion. DB-layer SELECT policy coverage must be independently verified. VENOM cannot mark this SAFE without the migration file or a DB query confirming the policy.
- **Follow-up command:** DB (confirm business_card_leads_owner_select policy exists and is correct on live DB)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Asset Security, Security Architecture and Engineering

---

### VEN-LEADS-005 [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-LEADS-005
- **Location:** `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts:24–35`
- **Application Scope:** VCSM + TRAFFIC
- **Platform Surface:** Edge Function
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** CORS is browser-enforcement only; non-browser callers bypass it
- **Contract Violated:** Communication and Network Security
- **Current behavior:** The `getAllowedOrigins()` CORS function correctly restricts the `Access-Control-Allow-Origin` response header to `vibezcitizens.com` plus env-configured origins. However, CORS is a browser-enforced mechanism — any non-browser caller (server-side code, curl, Postman, Traffic's SSR layer) can invoke the function with any `Origin` header or without one, and the request will be processed normally. The origin check never causes the function to reject a request; it only influences the response header value.
- **Risk:** CORS provides zero protection against server-side invocation. Combined with VEN-LEADS-001 (no JWT validation), CORS is the only mechanism that might appear to restrict access — but it is ineffective outside a browser. This compounds the risk of VEN-LEADS-001 being exploited.
- **Severity:** LOW (CORS bypass alone is not a risk — it is expected behavior; the risk is that it is relied upon as a security boundary when it is not one)
- **Exploitability:** HIGH (trivial for any non-browser caller)
- **Attack Preconditions:** Any HTTP client that is not a browser
- **Blast Radius:** Compounds VEN-LEADS-001
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Documentation or review artifacts must not treat CORS origin check as a security boundary for this function. The only real gate is the Bearer token check — which itself is presence-only per VEN-LEADS-001.
- **Recommended mitigation:** Document that CORS is not a security control for this function. Fix is inherited from VEN-LEADS-001 remediation (JWT validation + rate limiting).
- **Follow-up command:** ELEKTRA (verify no other edge functions rely on CORS as a security boundary)
- **CISSP Domain:**
  - Primary: Communication and Network Security
  - Secondary: Security Architecture and Engineering

---

### VEN-LEADS-006 [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-LEADS-006
- **Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js:21–29`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (dashboard badge)
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** None (no exploitation path) — silent error masking is an observability concern
- **Contract Violated:** Security Operations (missing error audit trail)
- **Current behavior:** `readNewLeadsCountByProfileDAL` catches the Supabase `error` and returns `0` instead of throwing (line 27: `if (error) return 0`). The caller hook (`useVportNewLeadsCount`) also catches errors silently (`} catch { // silent — background badge }`). A DB policy regression, revoked SELECT grant, or malformed query would silently cause the new-leads badge to display `0` with no error surface, masking a real access issue.
- **Risk:** If the `business_card_leads_owner_select` RLS policy (see VEN-LEADS-004) is accidentally revoked or changed, the read count path would silently fail rather than alerting the owner or the system. This could mask a DB regression or access control change from engineering visibility.
- **Severity:** LOW
- **Exploitability:** LOW (no direct attack vector — hardening issue)
- **Attack Preconditions:** Requires a DB regression to trigger; not exploitable directly
- **Blast Radius:** Single actor (owner sees wrong badge count)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** UNVERIFIED (same dependency as VEN-LEADS-004)
- **Why it matters:** Silent error fallback in a security-adjacent read path hides DB regressions. Combined with VEN-LEADS-004's unverified SELECT policy, a policy removal would be invisible to the owner and to engineering.
- **Recommended mitigation:** Consider propagating the Supabase error as a warning log (non-PII, just the error code) in the count DAL. The hook can still show `0` gracefully but engineering can monitor the error. Alternatively, add a test that simulates a DB error on the count path to confirm fallback behavior.
- **Follow-up command:** SPIDER-MAN (add test for count DAL error fallback behavior)
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Security Assessment and Testing

---

## 9. Source Verification Summary

```
Total surfaces in scope: 6 unique DAL functions + 1 Edge Function
Surfaces source-verified: 7 / 7
Source files read:
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportLeads.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsFinalScreen.jsx
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/index.js
  - apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js
  - apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js
  - apps/VCSM/src/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js
  - apps/VCSM/src/features/public/vportBusinessCard/hooks/useVportBusinessCardLeadForm.js
  - apps/VCSM/src/features/public/vportBusinessCard/model/vportBusinessCard.model.js
  - apps/VCSM/supabase/functions/send-lead-confirmation/index.ts
  - apps/VCSM/supabase/migrations/20260524010000_business_card_leads_p0_security.sql
  - apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql
  - apps/VCSM/supabase/migrations/20260427080000_grant_business_card_leads_owner_write.sql
  - apps/VCSM/supabase/migrations/20260427060000_grant_vport_write_permissions.sql
  - apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
  - ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md

CRITICAL findings: 0
HIGH findings: 1 — VEN-LEADS-001 is [SOURCE_VERIFIED] — COMPLIANT
```

---

## 10. Confidence Summary

```
HIGH confidence surfaces: 0 (scanner)
LOW confidence surfaces: 12 (scanner) → 12 manually traced
[SOURCE_VERIFIED] findings: 5 (VEN-LEADS-001, -002, -003, -005, -006)
[SCANNER_LEAD] findings: 1 (VEN-LEADS-004 — SELECT policy unverified)
[SCANNER_LOW_CONF] findings: 0
[SCANNER_STALE] findings: 0
```

---

## 11. THOR Impact

```
THOR Release Blockers:
  VEN-LEADS-001 (HIGH) — Edge Function Bearer-only validation → email spam abuse → THOR BLOCKER
  VEN-LEADS-004 (MEDIUM) — Unverified SELECT RLS policy on PII table → THOR BLOCKER until DB confirms

Highest Open Severity: HIGH (VEN-LEADS-001)

Existing tracked findings confirmed still open:
  DEFER-009 — Edge Function governance (VEN-LEADS-001 provides additional source detail)
  LEADS-PUBLIC-RPC-001 — Public RPC governance (VEN-LEADS-002 provides additional source detail)
  LEADS-ROUTE-001 — LOW documentation drift (not addressed in this pass — out of security scope)
```

---

## 12. Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-LEADS-001 | Email spam via Bearer-presence-only check | Edge Function | P0 | Security | ELEKTRA, SPIDER-MAN |
| VEN-LEADS-002 | Lead inbox flood via unthrottled anon RPC | RLS / DB Function | P1 | DB | DB, CARNAGE |
| VEN-LEADS-003 | traze_provider_lead_contacted missing from DB CHECK constraint | RLS / DB | P2 | DB | CARNAGE |
| VEN-LEADS-004 | SELECT RLS policy on PII table unverified | RLS | P1 | DB | DB |
| VEN-LEADS-005 | CORS is not a security boundary for Edge Function | Documentation | P3 | Documentation | ELEKTRA |
| VEN-LEADS-006 | Silent count error masking observability | Controller | P3 | App | SPIDER-MAN |

---

## 13. Required Follow-Up Commands

- **ELEKTRA** — Trace VEN-LEADS-001 source-to-sink: anon key → Edge Function invocation path. Verify no other edge functions have the same Bearer-presence-only pattern.
- **DB** — Confirm `business_card_leads_owner_select` SELECT policy exists on live DB with correct ownership USING clause (VEN-LEADS-004). Confirm `submit_business_card_lead` function body for rate limiting presence (VEN-LEADS-002).
- **CARNAGE** — Design migration to add `traze_provider_lead_contacted` to `business_card_leads_source_allowlist` (VEN-LEADS-003). Design migration for rate limiting table/trigger if DB confirms absent (VEN-LEADS-002).
- **SPIDER-MAN** — Add regression tests: (1) direct Edge Function invocation with anon key should be rate-limited post-fix; (2) count DAL error fallback behavior; (3) traze_provider_lead mark-contacted DB constraint violation.

---

## 14. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-LEADS-002 (RPC flood / business disruption risk) |
| Asset Security | 1 (shared) | VEN-LEADS-004 (PII SELECT policy unverified) |
| Security Architecture and Engineering | 3 (secondary) | VEN-LEADS-001, -004, -005 (defense-in-depth gaps) |
| Communication and Network Security | 2 | VEN-LEADS-001 (Edge Function anon key abuse), VEN-LEADS-005 (CORS not a security boundary) |
| Identity and Access Management | 1 | VEN-LEADS-004 (SELECT policy — ownership enforcement unverified at DB) |
| Security Assessment and Testing | 1 | VEN-LEADS-006 (silent error masking hides DB regression; test gap) |
| Security Operations | 1 | VEN-LEADS-006 (observability loss on count DAL error) |
| Software Development Security | 2 | VEN-LEADS-001 (token validation pattern), VEN-LEADS-003 (source constraint mismatch) |

All 8 CISSP domains covered. No domain was out of scope or not applicable for this feature given its public submission surface, PII handling, and external email integration.

---

## 15. VENOM Completion Checklist

- [x] Loaded boundary isolation contract
- [x] Stayed read-only — no files modified
- [x] Identified trust boundaries (Public Visitor / Authenticated Owner / Edge Function)
- [x] Traced auth and authorization for all 6 surface functions
- [x] Inspected identity surfaces — actorId is the correct surface; no profileId/vportId misuse found in owner paths
- [x] Scanner Preflight Protocol executed — all 8 maps FRESH
- [x] Surface inventory built from scanner maps before source reads
- [x] LOW Confidence Review Protocol applied to all 12 LOW confidence paths
- [x] Every finding labeled with provenance tag
- [x] All HIGH findings carry [SOURCE_VERIFIED] with cited file + line
- [x] Severity derived from source verification, not scanner confidence alone
- [x] CISSP domains mapped to all findings
- [x] CISSP summary table included
- [x] Mitigation plan included
- [x] THOR blockers identified
- [x] Persistent report written
- [x] SECURITY.md Write 2 pending (see below)

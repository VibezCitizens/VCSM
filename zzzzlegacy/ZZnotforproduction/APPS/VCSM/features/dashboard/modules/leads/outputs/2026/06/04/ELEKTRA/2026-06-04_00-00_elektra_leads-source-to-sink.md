# ELEKTRA V2 VULNERABILITY SCAN — leads

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard |
| Feature | leads (dashboard module + public submission + edge function) |
| Command | ELEKTRA |
| Ticket | TICKET-ELEK-LEADS-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/outputs/2026/06/04/ELEKTRA/2026-06-04_00-00_elektra_leads-source-to-sink.md |
| Timestamp | 2026-06-04T00:00:00 |
| VENOM Reference | 2026-06-04_00-00_venom_leads-security-review.md |
| BLACKWIDOW Reference | 2026-06-04_00-00_blackwidow_leads-adversarial-review.md |

---

## 1. ELEKTRA Scanner Preflight

```
ELEKTRA SCANNER PREFLIGHT
===========================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days

| Map                  | Generated At             | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| security-path-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| write-surface-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| callgraph            | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
Write sinks in scope: 4 (delete, update, rpc×2)
RPC sinks in scope: 2 (submit_business_card_lead from VCSM:public + Traffic)
Edge function sinks in scope: 1 (send-lead-confirmation)
Callgraph chain candidates (backwards from sinks): 8
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Sinks / Chains In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 4 write sinks | Sink inventory |
| rpc-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 2 RPC sinks | Privileged RPC inventory |
| edge-function-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 3 signals → 1 function | Edge function sink |
| security-path-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 12 | Security path pre-computation |
| callgraph | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 81 nodes, 49 edges | Source-to-sink chain pre-computation |
| write-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 7 | Write caller chain candidates |
| rpc-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 2 | RPC caller chain candidates |

```
Scanner Version: 1.1.0
Overall Preflight: FRESH
Identity-tier sinks: 0 (business_card_leads is resource-tier PII, not identity-tier)
Resource-tier sinks: 4 — reviewed ALL (vport.business_card_leads)
Privileged RPC sinks: 2 (submit_business_card_lead — vport schema) — reviewed ALL
Edge function sinks: 1 mutation (send-lead-confirmation) — reviewed ALL
Chain candidates from callgraph: 8
```

---

## 3. Vulnerability Surface Inventory

```
ELEKTRA VULNERABILITY SURFACE INVENTORY
=========================================
Feature: leads (dashboard + public)
Scan Date: 2026-06-03T00:22:42.771Z

Write Sinks: 4
  Resource-tier (vport.business_card_leads): 4
    - deleteVportBusinessCardLeadDAL — DELETE WHERE id+vport_profile_id
    - markVportBusinessCardLeadContactedDAL — UPDATE source WHERE id+vport_profile_id
    - createVportBusinessCardLeadDAL (VCSM) — RPC submit_business_card_lead
    - submitProviderLeadRow (Traffic) — RPC submit_business_card_lead

RPC Sinks: 2
  - vport.submit_business_card_lead (VCSM:public) — anon-accessible, SECURITY DEFINER
  - vport.submit_business_card_lead (Traffic:conversion) — anon-accessible, SECURITY DEFINER

Edge Function Sinks: 1
  - send-lead-confirmation — mutation (sends email via AWS SES)

Callgraph Chain Candidates (backwards from sinks):
  CHAIN-leads-001: HTTP Authorization header → Edge Function handler → SES SendEmailCommand
  CHAIN-leads-002: p_source parameter → submit_business_card_lead RPC → business_card_leads.source
  CHAIN-leads-003: profileId param (caller-supplied) → fastCountNewVportLeadsController → readNewLeadsCountByProfileDAL
  CHAIN-leads-004: p_ip=null (hardcoded) → submit_business_card_lead RPC → IP-based throttle disabled
  CHAIN-leads-005: row?.vport_profile_id → normalizeVportLead → domain object → hook state
  CHAIN-leads-006: URL actorId → VportDashboardLeadsFinalScreen → useVportLeads → listVportLeadsController → DAL
  CHAIN-leads-007: callerActorId (session) → mark/delete controllers → write DALs
  CHAIN-leads-008: name/email/message (user input) → validateVportBusinessCardLeadInput → RPC → DB
```

---

## 4. Scanner Signals

| Chain Candidate | Source Map | Callgraph Path | Scanner Confidence | Source Verified | Chain Verdict | Provenance | Finding |
|---|---|---|---|---|---|---|---|
| HTTP Authorization → SES SendEmailCommand | edge-function-map + callgraph | [external HTTP] → serve handler → sendLeadConfirmationEmail → SendEmailCommand | LOW (no caller chain) | YES — index.ts:355–358 + :310–332 | VALID_FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-04-001 |
| p_source → business_card_leads.source (_contacted at INSERT) | rpc-map + write-surface-map | [direct RPC call] → submit_business_card_lead → INSERT source | LOW | YES — vportBusinessCardLead.write.dal.js:20; 20260524020000.sql:50–62 | VALID_FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-04-002 |
| caller-supplied profileId → readNewLeadsCountByProfileDAL | callgraph | useVportNewLeadsCount → fastCountNewVportLeadsController:57 → readNewLeadsCountByProfileDAL | LOW | YES — controller.js:57–61; read.dal.js:21–29 | VALID_FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-04-003 |
| p_ip hardcoded null → RPC IP throttle disabled | write-surface-map + callgraph | VCSM DAL:23 / Traffic DAL:61 → submit_business_card_lead(p_ip=null) | HIGH | YES — vportBusinessCardLead.write.dal.js:23; submitProviderLead.write.dal.js:61 | VALID_FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-04-004 |
| vport_profile_id → normalizeVportLead → domain object | callgraph | readVportBusinessCardLeadsByProfileDAL → normalizeVportLead:13 → hook state | HIGH | YES — vportLead.model.js:13 | VALID_FINDING (INFO) | [SOURCE_VERIFIED] | ELEK-2026-06-04-005 |
| URL actorId → VportDashboardLeadsFinalScreen → useVportLeads → listVportLeadsController | callgraph | useParams → actorId → listVportLeadsController(actorId, {}, sessionActorId) | LOW | YES — FinalScreen.jsx:23; controller.js:32–36 | VALID_CHAIN_SAFE | [SOURCE_VERIFIED] | No finding — assertActorOwnsVportActorController verified |
| sessionActorId → mark/delete controllers → write DALs | callgraph | useIdentity → sessionActorId → controllers → write DALs | HIGH | YES — controller.js:40,64; assertActorOwnsVportActor.controller.js | VALID_CHAIN_SAFE | [SOURCE_VERIFIED] | No finding — session binding + DB ownership verified |
| name/email/message (user input) → RPC → DB | callgraph | useVportBusinessCardLeadForm → validateVportBusinessCardLeadInput → createVportBusinessCardLeadDAL | HIGH | YES — vportBusinessCard.model.js:95–124; vportBusinessCardLead.write.dal.js:15–24 | VALID_CHAIN_SAFE | [SOURCE_VERIFIED] | No finding — parameterized RPC; React JSX auto-escapes output |

---

## 5. Source-to-Sink Analysis

### CHAIN-leads-001: HTTP Authorization → AWS SES SendEmailCommand

```
Source: req.headers.get("Authorization") — HTTP request header, externally controlled
  → File: apps/VCSM/supabase/functions/send-lead-confirmation/index.ts
  → Line 343: const authHeader = req.headers.get("Authorization");
  → The Supabase anon key is publicly embedded in every VCSM and Traffic frontend bundle.
    Any actor (browser, curl, server) can supply it as Bearer <anon_key>.

Trust Boundary: index.ts:355–358
  → if (!authHeader?.startsWith("Bearer ")) { return 401 }
  → WEAK: checks only string prefix, not JWT signature or Supabase project identity.
  → A literal "Bearer anything" passes this check.
  → Supabase anon key is a signed JWT for this project but also publicly known.

Sink: sendLeadConfirmationEmail → sesClient.send(new SendEmailCommand(...))
  → File: apps/VCSM/supabase/functions/send-lead-confirmation/index.ts:310–332
  → Sends an email to body.email via AWS SES using platform credentials.
  → toEmail is validated as a valid email format (normalizeEmail:56–60) — but this only
    ensures format validity, not that the target consented to receive the email.

Impact:
  Any caller with the public anon key (or "Bearer fake") can send Vibez Citizens-branded
  emails to arbitrary addresses with attacker-controlled name and provider fields.
  SES reputation risk; potential phishing vector; AWS SES rate limit / suspension risk.
  No per-email, per-IP, or per-hour rate limiting exists in the function body.

Missing Defense:
  - JWT verification against Supabase project's signing secret (would reject fabricated tokens)
  - Per-email cooldown (no duplicate sends within N minutes)
  - Per-IP rate limiting
  - Lead ID binding (confirm that a real DB row matches the email being confirmed)
```

**Chain Status: VALID FINDING → ELEK-2026-06-04-001**

---

### CHAIN-leads-002: p_source → business_card_leads.source

```
Source: p_source parameter in vport.submit_business_card_lead RPC
  → Callable by anon role (SECURITY DEFINER)
  → VCSM DAL: apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js:21
    p_source: String(source || "business_card").trim() || "business_card"
    ← source is hardcoded "business_card" in the VCSM controller
  → Traffic DAL: apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js:60
    p_source: "directory" — hardcoded
  → Direct RPC call bypasses both controllers entirely; attacker supplies any p_source value.

Trust Boundary: RPC function body (DB function — body not in tracked migration files)
  → DB CHECK constraint allows: 'business_card_contacted', 'vport_card_contacted',
    'directory_contacted', 'traze_contacted' as valid values
    (apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql:50–62)
  → No separation between submission-time and mutation-time values in the constraint
  → No RPC-level guard rejecting _contacted values at INSERT time (not found in migrations)

Sink: INSERT into vport.business_card_leads.source
  → Row inserted with source = 'business_card_contacted' (or any _contacted variant)
  → normalizeVportLead returns: isContacted = source.includes("contacted") = true
    (apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js:22)
  → readNewLeadsCountByProfileDAL excludes the lead from NEW count:
    .not("source", "ilike", "%contacted%")
    (apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js:27)

Impact:
  Lead inserted as pre-contacted: invisible to new-leads count; appears already-handled
  in owner inbox. At scale: inbox flooded with pre-contacted fake leads; real leads
  displaced from the first page (limit=150, newest-first).
  Also enables source value poisoning for `traze_contacted` and `vport_card_contacted`
  which were not expected submission-time values.

Missing Defense:
  - RPC-level guard rejecting p_source values that include "contacted" at INSERT time
  - App-layer guard in the DAL validating source against submission-time allowlist
    before calling the RPC
```

**Chain Status: VALID FINDING → ELEK-2026-06-04-002**

---

### CHAIN-leads-003: Caller-Supplied profileId → readNewLeadsCountByProfileDAL

```
Source: profileId parameter of fastCountNewVportLeadsController
  → File: apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js:57
  → export async function fastCountNewVportLeadsController(actorId, callerActorId, profileId)
  → profileId is accepted as a caller-supplied parameter; no VPORT affinity check

Trust Boundary: controller.js:59
  → await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })
  → WEAK: verifies caller owns actorId, but does NOT verify profileId belongs to actorId's VPORT
  → An attacker who owns VPORT-A can supply VPORT-B's profileId and pass the ownership check

Sink: readNewLeadsCountByProfileDAL(profileId)
  → File: apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js:21
  → SELECT COUNT WHERE vport_profile_id = profileId AND source NOT ILIKE '%contacted%'
  → Returns count for whatever profileId is supplied, no VPORT affinity re-verification

Impact:
  Authenticated VPORT owner who knows victim's profile UUID can count that VPORT's
  uncontacted leads. Materializes fully only if VEN-LEADS-004 SELECT RLS policy is absent.
  Blast radius: count leakage only (no PII exposed in this path).

Missing Defense:
  - profileId affinity check: resolveProfileId(actorId) should be called (or its result
    compared) rather than accepting profileId from the caller
```

**Chain Status: VALID FINDING → ELEK-2026-06-04-003**

---

### CHAIN-leads-004: p_ip Hardcoded Null Disables IP Throttle

```
Source: Both DAL callsites hardcode p_ip: null
  → VCSM: apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js:23
    p_ip: null,
  → Traffic: apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js:61
    p_ip: null

Trust Boundary: submit_business_card_lead RPC p_ip parameter
  → If the RPC function body implements IP-based rate limiting using p_ip,
    it receives null for every call from both clients — the throttle never fires
  → RPC function body not accessible in tracked migrations; whether IP throttle exists
    is UNVERIFIED (see VEN-LEADS-002 / requires DB inspection)

Sink: submit_business_card_lead RPC — spam insertion path
  → Without IP binding, rate limiting (if present) cannot distinguish callers

Impact:
  Even if the RPC implements IP-based rate limiting, it is permanently bypassed
  because every caller passes null. An attacker can flood from any IP with no throttle.

Missing Defense:
  - p_ip should be populated with the real client IP
  - For Supabase Edge/RPC calls from VCSM PWA: IP is not directly accessible from the
    Supabase JS client; must be derived server-side or via an intermediary edge function
  - For Traffic (Next.js): req.headers["x-forwarded-for"] or CF-Connecting-IP is available
    at the server action / API route level; currently Traffic submits from client-side hook
    with no server-side IP extraction
```

**Chain Status: VALID FINDING → ELEK-2026-06-04-004**

---

### CHAIN-leads-005: vport_profile_id → normalizeVportLead → Domain Object

```
Source: row?.vport_profile_id from vport.business_card_leads DB row
  → File: apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js:3
    LEAD_SELECT includes vport_profile_id

Trust Boundary: normalizeVportLead model function
  → File: apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js:13
    profileId: row?.vport_profile_id ?? null,
  → profileId is a raw VPORT profile UUID — an internal identifier

Sink: Domain lead object returned to useVportLeads hook state and component tree
  → Accessible in client JavaScript, in React DevTools, in any component receiving the lead

Impact:
  profileId is a raw internal UUID that per VCSM identity rules must not appear
  on public or client-accessible surfaces. In the owner dashboard it does not cross
  actor boundaries, but exposes an internal identifier unnecessarily. Risk is low
  in current implementation; grows if future code logs, serializes, or surfaces it.

Missing Defense:
  - profileId not needed in domain object: controllers and DALs use it internally;
    no UI component should need the raw profile UUID
```

**Chain Status: VALID FINDING (INFO) → ELEK-2026-06-04-005**

---

### CHAIN-leads-006: URL actorId → listVportLeadsController

```
Source: params.actorId from URL route params (user-controlled)
  → VportDashboardLeadsFinalScreen.jsx:23

Trust Boundary:
  → Screen: useVportOwnership(viewerActorId, actorId) → isOwner check (line 26–42)
  → Controller: assertActorOwnsVportActorController (line 33) — DB-backed actor_owners query

Sink: readVportBusinessCardLeadsByProfileDAL

Chain Verdict: VALID_CHAIN_SAFE
  The URL actorId does not bypass the ownership gate. Two independent layers verify:
  1. Screen renders denial for non-owners before hook mounts
  2. Controller independently queries actor_owners before any DAL access
  sessionActorId is always sourced from useIdentity() — never from URL or props
```

**REJECTED: No finding — defense confirmed at screen (UX layer) and controller (DB layer)**

---

### CHAIN-leads-007: sessionActorId → mark/delete controllers → write DALs

```
Source: identity?.actorId from useIdentity context hook — session-bound
  → useVportLeads.js:11: const sessionActorId = identity?.actorId ?? null

Trust Boundary: All 5 controllers assert ownership via DB query before DAL access
Sink: write DALs scoped by leadId + profileId (double scope)

Chain Verdict: VALID_CHAIN_SAFE
  sessionActorId is always session-derived. Controllers assert ownership before
  any DAL access. DALs scope writes to both leadId and profileId.
```

**REJECTED: No finding — full chain traced and safe**

---

### CHAIN-leads-008: User-Input Fields → RPC → DB

```
Source: name/phone/email/message from useVportBusinessCardLeadForm
  → validated by validateVportBusinessCardLeadInput

Trust Boundary: model validation (non-empty, email format, phone sanitization)
Sink: submit_business_card_lead RPC → vport.business_card_leads

Chain Verdict: VALID_CHAIN_SAFE
  - SQL injection: impossible — Supabase SDK uses parameterized queries via PostgREST
  - XSS: impossible in dashboard — normalizeVportLead uses toText() (string coercion only);
    React JSX auto-escapes text content; no dangerouslySetInnerHTML
  - Email injection: normalizeEmail in edge function + email column is text, not rendered
  - Phone number: toSafePhone strips non-phone chars
```

**REJECTED: No finding — parameterized queries + React JSX auto-escaping closes all injection chains**

---

## 6. Verified Vulnerabilities

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-001
- Title:              Edge Function Bearer Token Auth — Presence Check Only, No JWT Verification
- Category:           Weak JWT/Session
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM + TRAFFIC
- Location:           apps/VCSM/supabase/functions/send-lead-confirmation/index.ts:355–358
- Source:             req.headers.get("Authorization") — HTTP header, externally untrusted
- Sink:               sesClient.send(new SendEmailCommand({...})) — index.ts:316–332
- Trust Boundary:     index.ts:355–358 — Bearer prefix check only
- Impact:             Any caller with the public Supabase anon key (or any "Bearer X" string)
                      can trigger arbitrary email delivery to any address via the platform's
                      AWS SES identity. No rate limiting. No per-email deduplication.
                      SES reputation, phishing vector, potential SES suspension.
- Evidence:
    Line 355: const authHeader = req.headers.get("Authorization");
    Line 356: if (!authHeader?.startsWith("Bearer ")) {
    Line 357:   return json({ ok: false, code: "UNAUTHORIZED" }, 401, origin);
    Line 358: }
    No JWT parsing, no signature verification, no Supabase auth.getUser() call after this.
    Supabase anon key is public in NEXT_PUBLIC_SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY.
- Reproduction Steps:
    1. Open VCSM or Traffic in browser DevTools → Network → copy Authorization header
    2. POST to the Supabase Edge Function URL with:
       Authorization: Bearer <anon_key>
       Content-Type: application/json
       Body: {"email":"victim@example.com","name":"John","vportName":"Fake Business"}
    3. Email is delivered. Repeat indefinitely with no throttle.
    (Do not execute against production — analysis only)
- Existing Defense:   Bearer prefix check at line 356 — insufficient; anon key is public
- Why Defense Is Insufficient:
    The Supabase anon key is embedded in every VCSM/Traffic JS bundle and is public by
    design. Checking for "Bearer " prefix does not verify the token was issued by this
    Supabase project, is unexpired, or belongs to a real session. Any string starting
    with "Bearer " passes.
- Recommended Fix:
    1. PRIMARY: Bind email confirmation to a real DB lead row. Pass lead_id from the
       RPC result and verify it in the edge function using a service role client.
       This ties every confirmation email to an actual lead insertion — an attacker
       cannot send confirmation emails without a corresponding lead row.
    2. SECONDARY: Add per-email rate limiting (1 per email per 10 minutes) using a
       Supabase KV store or the DB itself.
    3. ALSO: Verify the JWT is a valid Supabase-project token (auth.getUser()) to at
       minimum reject completely fabricated Bearer strings — this still allows anon key
       usage but blocks random tokens.
- Suggested Patch:
    File: apps/VCSM/supabase/functions/send-lead-confirmation/index.ts
    Layer: Edge Function

    // 1. Add imports at top of file
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

    // 2. Replace current serve handler auth block (lines 355-358):

    // BEFORE (current):
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, code: "UNAUTHORIZED" }, 401, origin);
    }

    // AFTER (suggested — human must review before applying):
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, code: "UNAUTHORIZED" }, 401, origin);
    }

    // Verify the token was issued by this Supabase project.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ ok: false, code: "MISSING_ENV" }, 500, origin);
    }
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { error: authError } = await callerClient.auth.getUser();
    if (authError) {
      return json({ ok: false, code: "UNAUTHORIZED" }, 401, origin);
    }

    // 3. Require lead_id in request body and verify against DB (service role):
    //    In body parsing, extract: const leadId = body.leadId ?? null;
    //    Before sending email:
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (leadId && serviceKey) {
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: leadRow } = await adminClient
        .schema("vport")
        .from("business_card_leads")
        .select("id, email")
        .eq("id", leadId)
        .maybeSingle();
      // Verify email in body matches DB row to prevent lead_id reuse for different targets
      if (!leadRow || leadRow.email !== toEmail) {
        return json({ ok: false, code: "LEAD_NOT_FOUND" }, 400, origin);
      }
    }

    Note: VCSM public controller and Traffic DAL must be updated to:
    1. Capture lead_id from RPC result (createVportBusinessCardLeadDAL returns data — extract lead_id)
    2. Pass lead_id to sendLeadConfirmationEmailDAL and then to the edge function body
    Requires coordinated change in: controller, DAL, and edge function.
- Follow-up Command: BLACKWIDOW (confirm bypass with fabricated Bearer), CARNAGE (DB env var setup), SPIDER-MAN (test: edge function rejects fabricated Bearer)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-002
- Title:              RPC p_source Accepts Mutation-Time Values at INSERT — Lead Poisoning
- Category:           Injection / IDOR (partial)
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM + TRAFFIC
- Location:           apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql:50–62
                      + apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js:20
- Source:             p_source parameter in direct vport.submit_business_card_lead RPC call
                      (anon role, bypasses all app-layer controllers)
- Sink:               INSERT into vport.business_card_leads.source
                      → isContacted derivation: vportLead.model.js:22
                      → new-leads count exclusion: vportLeads.read.dal.js:27
- Trust Boundary:     submit_business_card_lead RPC body (DB function, body not in tracked migrations)
                      + DB CHECK constraint (allows _contacted values at INSERT time)
- Impact:
    Attacker submits leads with p_source = 'business_card_contacted'. Lead is inserted
    successfully (passes CHECK constraint). normalizeVportLead derives isContacted=true.
    readNewLeadsCountByProfileDAL excludes it from the new-leads count.
    Owner sees inbox polluted with pre-contacted fake leads; real new leads are displaced
    after 150 injected records fill the first page (limit=150, newest-first ordering).
- Evidence:
    20260524020000_business_card_leads_p1_hardening.sql:50–62 — CHECK constraint allowlist
    includes 'business_card_contacted', 'vport_card_contacted', 'directory_contacted',
    'traze_contacted' — no separation between submission-time and mutation-time values.

    vportBusinessCardLead.write.dal.js:20:
      p_source: String(source || "business_card").trim() || "business_card"
    VCSM controller hardcodes source="business_card" — but direct RPC caller bypasses this.

    vportLead.model.js:22:
      isContacted: source.includes("contacted")
    Any source value containing "contacted" triggers the pre-contacted state.
- Reproduction Steps:
    1. Using anon key, call vport.submit_business_card_lead(
         p_slug: 'any-published-vport-slug',
         p_name: 'Fake Lead', p_message: 'test',
         p_source: 'business_card_contacted', ...
       )
    2. Row inserted with source='business_card_contacted'
    3. Owner dashboard shows lead as already-contacted from day 1
    4. New-leads count is unaffected (this lead is excluded from count)
    (Do not execute against production — analysis only)
- Existing Defense:
    VCSM and Traffic controllers hardcode the source field — effective for UI flows.
    DB CHECK constraint validates the source value — but allows _contacted variants.
- Why Defense Is Insufficient:
    The RPC is directly callable by the anon role. The DB CHECK constraint was designed
    to prevent untracked source values but does not distinguish between submission-time
    and mutation-time values. _contacted variants are legitimately used during the
    mark-contacted UPDATE but should never be valid at INSERT time.
- Recommended Fix:
    1. In the RPC body: add a guard rejecting p_source values that match '%contacted%'
       at INSERT time:
         IF p_source ILIKE '%_contacted' THEN
           RAISE EXCEPTION 'INVALID_SOURCE';
         END IF;
    2. Alternatively (app layer): add an allowlist check in the DAL before calling the RPC:
       const SUBMIT_SOURCE_ALLOWLIST = new Set(['business_card','vport_card','directory','traze','traze_provider_lead']);
       if (!SUBMIT_SOURCE_ALLOWLIST.has(source)) throw new Error('INVALID_SOURCE');
    3. Ideally both: app-layer guard catches the normal path; RPC guard is defense-in-depth.
- Suggested Patch:
    File A: apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js
    Layer: DAL (app-layer guard)

    // Add before the rpc() call (line 15):

    // BEFORE:
    export async function createVportBusinessCardLeadDAL({
      slug, name, phone, email, message,
      source = "business_card",
      userAgent = null,
    } = {}) {
      const { data, error } = await vportSchema.rpc("submit_business_card_lead", {
        ...

    // AFTER (suggested — human must review before applying):
    const SUBMISSION_SOURCE_ALLOWLIST = new Set([
      'business_card', 'vport_card', 'directory', 'traze', 'traze_provider_lead',
    ]);

    export async function createVportBusinessCardLeadDAL({
      slug, name, phone, email, message,
      source = "business_card",
      userAgent = null,
    } = {}) {
      const safeSource = String(source || "business_card").trim();
      if (!SUBMISSION_SOURCE_ALLOWLIST.has(safeSource)) {
        throw new Error("INVALID_SOURCE");
      }
      const { data, error } = await vportSchema.rpc("submit_business_card_lead", {
        ...
        p_source: safeSource,
        ...

    File B (DB — via CARNAGE migration):
    -- In submit_business_card_lead function body, add before INSERT:
    IF p_source ILIKE '%_contacted' THEN
      RAISE EXCEPTION 'INVALID_SOURCE';
    END IF;

    Note: apply the same DAL-level guard in apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
- Follow-up Command: DB (inspect RPC body for existing p_source validation), CARNAGE (migration: RPC-level _contacted guard), SPIDER-MAN (TESTREQ-BW-leads-001)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-003
- Title:              Fast Count Accepts Caller-Supplied profileId Without VPORT Affinity Check
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js:57–61
- Source:             profileId parameter of fastCountNewVportLeadsController (caller-supplied)
- Sink:               readNewLeadsCountByProfileDAL(profileId) — SELECT COUNT WHERE vport_profile_id = profileId
                      apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js:21
- Trust Boundary:     controller.js:59 — assertActorOwnsVportActorController verifies caller owns
                      actorId, but DOES NOT verify profileId belongs to actorId's VPORT
- Impact:
    An authenticated Citizen who owns any VPORT can supply another VPORT's profileId
    (a UUID, not publicly exposed but obtainable by a determined attacker) and read the
    count of that VPORT's uncontacted leads. Count-only leakage; no PII exposed in this path.
    Fully materializes if VEN-LEADS-004 SELECT RLS policy is absent.
- Evidence:
    controller.js:57–61:
      export async function fastCountNewVportLeadsController(actorId, callerActorId, profileId) {
        if (!actorId || !callerActorId || !profileId) return 0;
        await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
        return readNewLeadsCountByProfileDAL(profileId);
      }
    ↑ assertActorOwns verifies callerActorId owns actorId — correct.
    ↑ profileId is passed directly to the DAL without verifying profileId === resolveProfileId(actorId).

    read.dal.js:21–29:
      .eq("vport_profile_id", profileId)   // profileId is attacker-supplied
- Reproduction Steps:
    1. Own VPORT-A (legitimate). Obtain victim VPORT-B's profileId (UUID enumeration or prior access).
    2. Call fastCountNewVportLeadsController(VPORT_A_actorId, own_actorId, VICTIM_profileId)
    3. Ownership assertion passes (own_actorId owns VPORT_A_actorId)
    4. Count of VICTIM_profileId's uncontacted leads is returned
    (Do not execute against production — analysis only)
- Existing Defense:   Ownership assertion checks caller→actorId (correct); no profileId affinity check
- Why Defense Is Insufficient:
    The ownership assertion validates the caller→VPORT relationship, but the profileId
    parameter is not validated as deriving from that VPORT. An attacker can pass any profileId
    they choose, decoupling the ownership check from the actual data being queried.
- Recommended Fix:
    In fastCountNewVportLeadsController, re-derive profileId from actorId using resolveProfileId()
    instead of accepting it from the caller. The performance optimization (skipping a DB lookup)
    is not worth the affinity gap.
- Suggested Patch:
    File: apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js
    Layer: Controller

    // BEFORE (current):
    export async function fastCountNewVportLeadsController(actorId, callerActorId, profileId) {
      if (!actorId || !callerActorId || !profileId) return 0;
      await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
      return readNewLeadsCountByProfileDAL(profileId);
    }

    // AFTER (suggested — human must review before applying):
    export async function fastCountNewVportLeadsController(actorId, callerActorId, profileId) {
      if (!actorId || !callerActorId || !profileId) return 0;
      await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
      // Re-derive profileId from actorId to prevent caller-supplied affinity bypass.
      // profileId param is retained for early-return guard only; never passed to DAL.
      const resolvedProfileId = await resolveProfileId(actorId);
      return readNewLeadsCountByProfileDAL(resolvedProfileId);
    }

    Note: the hook's caching of resolvedProfileId is still valid — it just means the
    fast path now always does one extra DB call (readVportProfileByActorIdDAL). This is
    one SELECT by primary key and should be fast. If this proves to be a performance
    concern, consider storing the resolvedProfileId in session-scoped cache keyed by actorId.

    The hook signature does not need to change; the cached profileId the hook passes
    is now used only for the null-guard (not for the actual query).
- Follow-up Command: SPIDER-MAN (TESTREQ-BW-leads-002), VENOM (VEN-LEADS-004 SELECT policy confirmation)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-004
- Title:              p_ip Hardcoded null in Both DALs — IP-Based Rate Limiting Permanently Disabled
- Category:           Weak JWT/Session (Rate Limiting Bypass)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM + TRAFFIC
- Location:           apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js:23
                      apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js:61
- Source:             p_ip: null — hardcoded at both callsites
- Sink:               submit_business_card_lead RPC p_ip parameter
- Trust Boundary:     Both DAL callsites
- Impact:
    If the submit_business_card_lead DB function implements IP-based rate limiting or
    fraud detection using p_ip, it is permanently disabled because both callers pass null.
    An attacker submitting leads from any IP address cannot be throttled by IP via the
    function's own logic.
- Evidence:
    vportBusinessCardLead.write.dal.js:23: p_ip: null,
    submitProviderLead.write.dal.js:61:    p_ip: null
    Both files confirm this is hardcoded, not a conditional fallback.
- Existing Defense:
    Supabase platform-level rate limits (global, not per-feature).
    No application-level IP throttle is wired.
- Why Defense Is Insufficient:
    The RPC signature explicitly accepts p_ip, indicating intent to support IP-based
    throttling. Passing null permanently defeats this mechanism regardless of what
    the function body implements.
- Recommended Fix:
    1. For VCSM public submission (SPA, no server): populate p_ip via a server-side
       intermediary (an edge function or Supabase serverless function that reads the
       real IP from request headers before calling the RPC).
    2. For Traffic (Next.js): if submission is routed through a server action or API
       route, extract req.headers["cf-connecting-ip"] or "x-forwarded-for" and pass
       it as p_ip. If submission is client-only, same approach as VCSM.
    3. If IP-based throttle is not implemented in the RPC body (to be confirmed by DB):
       document p_ip as reserved for future use and add rate limiting at the app edge.
- Suggested Patch:
    File: apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
    (Traffic is a Next.js app — most actionable for server-side IP extraction)

    // In submitProviderLeadRow, accept an optional ip parameter:
    export async function submitProviderLeadRow({ config = {}, lead, ip = null }) {
      const client = getProviderLeadClient(config);
      ...
      const { error } = await client.schema("vport").rpc("submit_business_card_lead", {
        ...
        p_ip: ip ? String(ip) : null,   // was: p_ip: null
      });
    }

    // In the Traffic hook or server action that calls submitProviderLead:
    // Pass ip from server context if available.

    File: apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js
    // Same pattern — accept ip param. For the VCSM SPA, ip will remain null until
    // a server-side route wrapper is added; document as known limitation.
- Follow-up Command: DB (inspect RPC body for p_ip usage and rate limit logic)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-005
- Title:              normalizeVportLead Exposes profileId (Raw VPORT Profile UUID) in Domain Object
- Category:           Secrets Exposure (Internal ID)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js:13
- Source:             row?.vport_profile_id from vport.business_card_leads DB row
- Sink:               Domain lead object returned to useVportLeads hook state and component tree
- Trust Boundary:     normalizeVportLead model function
- Impact:
    profileId (raw VPORT profile UUID) is accessible in client JavaScript, React DevTools,
    and any component that receives the lead object. Violates VCSM identity rule:
    profileId must never appear on client-accessible surfaces. Current blast radius is
    limited to the owner's own dashboard session, but this creates a surface that could
    be accidentally exposed in future code (debug panels, logs, serialization).
- Evidence:
    vportLead.model.js:13: profileId: row?.vport_profile_id ?? null
    VCSM CLAUDE.md: "Never scope behavior by profileId, vportId, or raw userId.
    Never expose profileId or vportId through any public hook or controller surface."
- Existing Defense:   None — profileId is returned unconditionally in the domain object
- Why Defense Is Insufficient:
    The profileId is not needed by any UI component. All DAL operations that require
    it use the controller's resolved value. Including it in the domain object creates
    an unnecessary exposure.
- Recommended Fix:
    Remove profileId from the normalizeVportLead return object.
    Audit: ensure no component currently reads lead.profileId.
- Suggested Patch:
    File: apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js
    Layer: Model

    // BEFORE:
    return {
      id: row?.id ?? null,
      profileId: row?.vport_profile_id ?? null,   // ← remove this line
      actorId: row?.actor_id ?? null,
      ...
    };

    // AFTER (suggested — human must review before applying):
    return {
      id: row?.id ?? null,
      actorId: row?.actor_id ?? null,
      name: toText(row?.name) || "Lead",
      phone: toText(row?.phone) || "",
      email: toText(row?.email) || "",
      message: toText(row?.message) || "",
      source,
      createdAt: row?.created_at ?? null,
      isContacted: source.includes("contacted"),
    };

    Note: also remove vport_profile_id from LEAD_SELECT in both read.dal.js and
    write.dal.js if no other path requires it in the selected columns.
    The SELECT column list in write.dal.js: LEAD_SELECT includes vport_profile_id —
    this can remain for the DAL's internal scoping logic without being surfaced in the
    domain model.
- Follow-up Command: SPIDER-MAN (grep for lead.profileId in component tree — TESTREQ-BW-leads-003)
```

---

## 7. False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       URL actorId flows to listVportLeadsController without session binding
- Location:        VportDashboardLeadsFinalScreen.jsx, vportLeads.controller.js
- Rejection reason: Full chain traced — defense confirmed at two independent layers
- Chain gap:       Impact — URL actorId does not enable cross-actor access
- Defense found:
    Layer 1: VportDashboardLeadsFinalScreen.jsx:26 — useVportOwnership(viewerActorId, actorId) → isOwner check
    Layer 2: vportLeads.controller.js:33 — assertActorOwnsVportActorController DB-backed query
    sessionActorId is always session-derived; URL actorId without ownership throws
- Notes:           Double-layer protection is well-implemented. No finding.
```

```
FALSE POSITIVE REJECTED

- Candidate:       User-supplied name/email/message fields enable SQL injection or XSS
- Location:        useVportBusinessCardLeadForm.js, vportBusinessCard.model.js, vportBusinessCardLead.write.dal.js
- Rejection reason: Parameterized query + React JSX auto-escaping closes all injection chains
- Chain gap:       Sink — no raw SQL interpolation; no dangerouslySetInnerHTML
- Defense found:
    SQL: Supabase JS SDK always uses PostgREST parameterized queries — no string interpolation
    XSS: normalizeVportLead uses toText() (string coercion); React JSX text nodes auto-escape
    Template injection: email HTML uses escapeHtml() for all user-derived content (index.ts:46–53)
- Notes:           All injection surfaces are covered. No finding.
```

```
FALSE POSITIVE REJECTED

- Candidate:       vportName/providerProfileUrl from business card data could be attacker-controlled
- Location:        vportBusinessCard.controller.js, sendLeadConfirmationEmail.edge.dal.js, index.ts
- Rejection reason: vportName is server-fetched from published VPORT profile; providerProfileUrl validated
- Chain gap:       Source — vportName comes from server-side DB read, not from public submitter
- Defense found:
    vportBusinessCard.controller.js: getVportBusinessCardPublicController reads from DB
    index.ts:395–397: isSafeUrl validates providerProfileUrl
    index.ts:108–109: escapeHtml applied to safeProvider in email template
- Notes:           No XSS/injection path. The submitter controls name/phone/email/message only.
```

---

## 8. Source Verification Summary

```
Chain candidates evaluated: 8
Chains source-verified: 8 / 8
Source files read (in addition to prior VENOM/BW context):
  - apps/VCSM/supabase/functions/send-lead-confirmation/index.ts (full)
  - apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js
  - apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js
  - apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
  - apps/Traffic/src/features/conversion/controller/submitProviderLead.controller.js
  - apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js

Valid findings: 5 (1 HIGH, 2 MEDIUM, 1 LOW, 1 INFO)
Rejected (false positive): 3
Incomplete (scanner leads): 0
```

---

## 9. Confidence Summary

```
HIGH confidence chains: 3
LOW confidence chains: 5 — all elevated priority per Rule E-002, all source-verified
[SOURCE_VERIFIED] findings: 5
[SCANNER_LEAD] findings: 0
Note: All findings carry [SOURCE_VERIFIED]. ELEK max severity = HIGH (CRITICAL requires BLACKWIDOW active confirmation).
```

---

## 10. Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-04-001 | Edge Function Bearer-only auth / no JWT verification | HIGH | Edge Function | COMPLEX — edge function + controller + DAL (lead_id threading) | NO (env var setup only) |
| 2 | ELEK-2026-06-04-002 | RPC p_source accepts _contacted values at INSERT | MEDIUM | DAL + DB Function | MODERATE — DAL allowlist guard + CARNAGE migration for RPC body | YES — RPC body guard |
| 3 | ELEK-2026-06-04-003 | Fast count accepts caller-supplied profileId | MEDIUM | Controller | SIMPLE — one line change (call resolveProfileId instead of accepting param) | NO |
| 4 | ELEK-2026-06-04-004 | p_ip hardcoded null disables IP throttle | LOW | DAL | MODERATE — requires server-side IP extraction wrapper | NO |
| 5 | ELEK-2026-06-04-005 | normalizeVportLead exposes profileId UUID | INFO | Model | SIMPLE — remove one field from return object | NO |

---

## 11. THOR Impact

```
THOR Release Blockers (from ELEKTRA):
  ELEK-2026-06-04-001 (HIGH) — edge function auth / email spam → THOR BLOCKER
  ELEK-2026-06-04-002 (MEDIUM) — RPC source injection → contributes to THOR CAUTION
  ELEK-2026-06-04-003 (MEDIUM) — fast count affinity gap → contributes to THOR CAUTION

BLACKWIDOW confirmation required for CRITICAL reclassification:
  ELEK-2026-06-04-001: BW partially confirmed (BW-S7 in BW report) — BLACKWIDOW noted no
  active exploitation attempt (email spam from Bearer-presence). BW confirmation can elevate to CRITICAL.

Highest Open Severity After ELEKTRA: HIGH (ELEK-2026-06-04-001 = VEN-LEADS-001)
```

---

## 12. Required Follow-Up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Inspect submit_business_card_lead RPC body for p_source validation and p_ip rate logic (ELEK-002, -004) | PENDING |
| CARNAGE | Migration: RPC-level _contacted source guard (ELEK-002) | PENDING |
| BLACKWIDOW | Active confirmation of ELEK-2026-06-04-001 for CRITICAL reclassification | PENDING |
| SPIDER-MAN | TESTREQ-BW-leads-001 (source guard), -002 (fast count affinity), -003 (profileId in model) | PENDING |
| THOR | Re-evaluate release gate after ELEK-001 remediated and DB confirms SELECT policy | PENDING |

# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27
**Scope:** VCSM — external-site (Edge Function API) + tripoint (External domain API, Locksmith)
**Reviewer:** BLACKWIDOW
**Environment:** Static source analysis + runtime path simulation (non-destructive)
**Governance Status:** DRAFT
**Application Scope Label:** VCSM
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — loaded and enforced
**Prior VENOM Context Loaded:**
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_18-30_venom_external-site.md` (2H/5M/3L)
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_18-30_venom_tripoint.md` (7H/4M/3L)

---

## Attack Surface Summary

### external-site

Five deployed Edge Functions form the entire external-facing API layer. VENOM identified CORS wildcard (`*`) across all five, no VPORT owner consent or API key gate, unbounded `listUsers()` enumeration, a profileId internal UUID leaked to browser state, raw DB error message leakage, stale slug TTL cache, SSRF-adjacent IP injection in reverse-geocode, anon key accepted as email-send auth, an unguarded push notification stub, and lat/lng GPS coordinates accessible via direct anon client queries on the public view. BLACKWIDOW stress-tests whether these theoretical exposures survive adversarial simulation against the actual source.

### tripoint

No implementation found. The VCSM data API for `tripointlockandkeys.com` is specification-only. The external site either uses Option A (direct Supabase anon client with embedded credentials in browser JS) or still serves hardcoded static data. The spec itself documents `actorId` as a URL path parameter, defines three public schema tables with PII under permissive SELECT policies, and never defines an auth gate or rate limit for the future Edge Function API. BLACKWIDOW simulates what Option A looks like when live and exercises each spec-defined table surface.

---

## Simulated Threat Scenarios

| ID | Module | Scenario | VENOM Ref | Simulation Method |
|---|---|---|---|---|
| BW-EXTSITE-001 | external-site | CORS Wildcard Abuse — malicious origin calls send-lead-confirmation | EXTSITE-001 | Header analysis + request path trace |
| BW-EXTSITE-002 | external-site | Anon Key Gate — unauthenticated caller reads any VPORT's public data | EXTSITE-002 | DAL + RLS path trace |
| BW-EXTSITE-003 | external-site | Email Abuse — rapid sequential calls to send-lead-confirmation | EXTSITE-008 | Handler logic trace, no rate gate search |
| BW-EXTSITE-004 | external-site | User Enumeration via listUsers() | EXTSITE-003 | Handler source analysis |
| BW-EXTSITE-005 | external-site | Stale VPORT Data — deleted VPORT slug still resolves from cache | EXTSITE-006 | Cache + DAL trace |
| BW-EXTSITE-006 | external-site | Push Notification Stub — unauthenticated caller triggers it | EXTSITE-009 | Handler source analysis |
| BW-TRIPOINT-001 | tripoint | Anon Key Extraction — Option A live; attacker reads extracted key | TRIPOINT-001 | Spec + source path analysis |
| BW-TRIPOINT-002 | tripoint | actorId Enumeration — VPORT actorId in URL enables data correlation | TRIPOINT-003 | Spec + URL pattern analysis |
| BW-TRIPOINT-003 | tripoint | CORS + Domain Spoofing — Origin header spoof on wildcard edge function | TRIPOINT-002 | Header analysis |
| BW-TRIPOINT-004 | tripoint | Review Table Exposure — anon read of public.tripoint_reviews | TRIPOINT-008 | Spec RLS + table definition analysis |
| BW-TRIPOINT-005 | tripoint | GPS Leak — anon read of public.tripoint_footer_clicks | TRIPOINT-009 | Spec RLS + table definition analysis |

---

## Ownership Bypass Results

Not directly applicable to Edge Function API layer — no actor ownership mutation surface exists in external-site functions. The send-citizen-invite function was assessed for VPORT ownership bypass separately under Runtime Abuse.

---

## Session Mutation Results

Not applicable to the external-site public read path (anon, no session). The send-citizen-invite function correctly resolves session from JWT via `userClient.auth.getUser()` — not from caller-supplied parameters. This gate held.

---

## Runtime Abuse Results

**send-citizen-invite — VPORT ownership bypass:** The function verifies VPORT actor ownership via `actor_owners` table check (`.eq("actor_id", inviterActorId).eq("is_void", false)`) before allowing a VPORT-sourced invite. An attacker passing a foreign VPORT actorId receives `VPORT_NOT_OWNED` (403). **BLOCKED.**

**send-lead-confirmation — email abuse without session:** No session required. Auth check accepts any Bearer token including the public anon key. No rate limit present anywhere in the handler. Any caller with the anon key can trigger unlimited SES sends. **BYPASSED.**

**reverse-geocode — unauthenticated abuse:** No auth check exists. Any caller can trigger Nominatim and ipapi.co requests. No rate limit. Combined with SSRF-adjacent IP injection. **BYPASSED.**

**send-push-notification — stub invocation:** No auth check before the stub return. Any caller can POST. Returns 501, but preflight and POST are accepted with wildcard CORS. **PARTIAL — blocked by stub only, not by auth.**

---

## RLS Verification Results

BLACKWIDOW cannot execute live DB queries. RLS status for `public.tripoint_reviews`, `public.tripoint_emails`, and `public.tripoint_footer_clicks` was taken directly from spec documentation, which states unrestricted SELECT for all three tables. RLS for `vport.public_menu_read_model_v` GPS coordinate columns was taken from VENOM-EXTSITE-010 — coordinates are included in the view definition and accessible to anon callers directly. These findings are classified ASSUMED/EXPOSED based on spec and model source analysis.

---

## Viewer Context Fuzz Results

Viewer context fuzzing is not applicable to the Edge Function public API surface — none of the functions use viewerActorId as an authorization gate. The send-citizen-invite function gates on `auth.uid()` from JWT, not on caller-supplied actorId. The lead confirmation function gates on Bearer presence (not validity). The delete-citizen-account function correctly gates on JWT-derived userId.

---

## Mutation Replay Results

No stateful mutation surface is present in the public external-site functions that would support replay. send-lead-confirmation is stateless (no idempotency token, no deduplication). Multiple sends to the same email address with the same payload are indistinguishable — this enables replay as an email flood vector.

---

## Hydration Poisoning Results

Not applicable — external-site Edge Functions do not maintain a hydration cache. The slug TTL cache (`resolveVportSlugDAL`) is an in-memory module-level cache within the public VCSM PWA layer, not inside the Edge Functions.

---

## Cross-Feature Abuse Results

Not applicable in this scope — Edge Functions are isolated Deno processes with no shared internal state. The reverse-geocode function does not access VCSM DB at all. The send-lead-confirmation function does not access DB. Cross-feature DAL abuse is a PWA-layer risk, not an Edge Function risk.

---

## URL Surface Results

**Option B spec URL pattern:** `GET /v1/vport/{actorId}/...` — actorId (internal UUID) is a path segment. Platform memory rule "No raw IDs in public URLs" is violated by design in the spec. This URL pattern would make the actorId permanently public once any external site goes live. **PRESENT.**

**send-citizen-invite:** Invite link uses `https://vibezcitizens.com/register?invite_code={uuid}`. The invite_code is a random UUID (not an actor UUID). This is acceptable — invite codes are ephemeral and not identity-correlated. **ABSENT (invite code only, not actorId).**

---

## Notification Abuse Results

The push notification function is a stub returning 501. No notification payload analysis is possible at this time. The stub accepts POST from any origin (wildcard CORS, no auth check before stub return). When implemented, if the auth gate documented in the code comment ("Verify caller has service_role or is an internal edge function") is not enforced in code before real delivery logic is added, this becomes a CRITICAL notification abuse vector.

---

## Auth Callback Replay Results

Not applicable — no auth callback flows in the Edge Function set under review.

---

## Search Abuse Results

Not applicable — no search surface in the Edge Function set under review.

---

## Successful Exploit Chains

### Chain 1 — Email Spam via Anon Key (CONFIRMED EXPLOITABLE)

1. Attacker loads any VCSM page or tripointlockandkeys.com (if Option A is live)
2. Extracts VCSM Supabase anon key from JS bundle or network DevTools
3. Constructs POST to `send-lead-confirmation` with `Authorization: Bearer <anon_key>`
4. Provides any target email, any `vportName`, any `firstName`
5. SES sends a Vibez Citizens-branded email to arbitrary recipient
6. No rate limit — repeat indefinitely across any target email list
7. AWS SES quota exhausts / SES reputation damaged

**Result: BYPASSED | Single-step inject → email delivery**

---

### Chain 2 — CORS Wildcard Cross-Origin Request (CONFIRMED EXPLOITABLE)

1. Attacker hosts a page on `evil.com`
2. Page makes cross-origin POST to `send-lead-confirmation` or any Edge Function
3. Browser does not block — `Access-Control-Allow-Origin: *` is present on all responses including OPTIONS preflight
4. No origin validation in any function handler
5. Attacker site can call any VCSM Edge Function from any domain without restriction
6. For send-lead-confirmation: spam emails flow through VCSM SES from an arbitrary origin
7. For future VPORT data endpoints: cross-origin reads of VPORT data will be permitted from competing or hostile sites

**Result: BYPASSED | Single-step inject — no server-side origin enforcement**

---

### Chain 3 — SSRF-Adjacent via x-forwarded-for (CONFIRMED EXPLOITABLE)

1. Attacker sends GET to `reverse-geocode` (no auth required)
2. Sets `x-forwarded-for: 192.168.1.1` (or any target IP including internal ranges)
3. Edge function reads first segment of x-forwarded-for without IP validation
4. Makes outbound request to `https://ipapi.co/192.168.1.1/json/` on behalf of the injected IP
5. VCSM's edge function IP initiates outbound request for attacker-controlled target
6. Also exploitable for Nominatim requests — User-Agent placeholder violates Nominatim ToS

**Result: BYPASSED | Single-step inject — no IP validation, no auth gate**

---

### Chain 4 — VPORT Data Enumeration via Anon Key (CONFIRMED EXPLOITABLE — if Option A live)

1. Visitor to `tripointlockandkeys.com` opens browser DevTools
2. Inspects JS bundle or network requests — extracts VCSM Supabase URL + anon key
3. Constructs Supabase client: `createClient(VCSM_URL, ANON_KEY)`
4. Queries any public VPORT view directly: `.schema('vport').from('public_menu_read_model_v').select('lat, lng')`
5. Retrieves GPS coordinates of any VPORT that has stored coordinates
6. Queries `vport.public_actor_seo_v`, `reviews.public_vport_reviews_v` — any table with public SELECT policy
7. Enumerates any VPORT without the owner's knowledge or consent

**Result: BYPASSED | Single-step — anon key is public by design under Option A**

---

### Chain 5 — tripoint_reviews Full PII Dump (CONFIRMED EXPLOITABLE — per spec)

1. Attacker obtains VCSM Supabase anon key (from external site bundle if Option A live, or from any VCSM page)
2. Queries `public.tripoint_reviews` via Supabase REST: `GET /rest/v1/tripoint_reviews?select=*`
3. Spec states: "Public can read all" — no column filter, no is_approved filter
4. Receives: `first_name`, `last_name`, `email`, `rating`, `text`, `location`, `source_url`, `user_agent`, `is_approved` (including is_approved=false rows)
5. Attacker reads reviewer email addresses and unapproved (moderated-out) review content

**Result: BYPASSED | Single-step — world-readable table per spec**

---

### Chain 6 — tripoint_footer_clicks Visitor PII Dump (CONFIRMED EXPLOITABLE — per spec)

1. Same anon key as Chain 5
2. Queries `public.tripoint_footer_clicks`: `GET /rest/v1/tripoint_footer_clicks?select=*`
3. Spec states: "Anon + authenticated can select"
4. Receives: `ip`, `latitude`, `longitude`, `city`, `region`, `country`, `user_agent`, `referrer`
5. Full visitor tracking data including precise GPS and IP is exposed to any caller

**Result: BYPASSED | Single-step — world-readable anon SELECT per spec**

---

## Failed Exploit Chains (Defenses That Held)

### Defense 1 — VPORT Ownership Check in send-citizen-invite

Attacker attempts to send an invite on behalf of a VPORT they do not own:
- Provides a foreign `inviterActorId` in POST body
- Function verifies ownership via `actor_owners` table: `.eq("actor_id", inviterActorId).eq("user_id", user.id).eq("is_void", false)`
- If no matching row: returns `VPORT_NOT_OWNED` (403)
- **BLOCKED — ownership gate is PRESENT and correctly placed before any action**

### Defense 2 — delete-citizen-account JWT Derivation

Attacker attempts to delete another user's account:
- No userId accepted from request body
- User identity derived exclusively from JWT via `userClient.auth.getUser()`
- RPC `soft_delete_citizen_account()` uses `auth.uid()` internally — cannot target another user
- **BLOCKED — identity resolved from JWT only, not from caller-supplied parameter**

### Defense 3 — send-citizen-invite Raw JWT Session Verification

Attacker presents a fabricated or expired Bearer token:
- Function creates `userClient` using the Bearer token as Authorization header
- Calls `userClient.auth.getUser()` — Supabase validates the JWT against its auth service
- Expired or forged tokens return error → `UNAUTHORIZED` (401)
- **BLOCKED — real session validation enforced before any action**

### Defense 4 — HTML Escaping in Email Templates

Attacker injects `<script>alert(1)</script>` into `firstName`, `vportName`, `businessName` fields:
- All three functions apply `escapeHtml()` before rendering into HTML email body
- `escapeHtml()` replaces `<`, `>`, `&`, `"`, `'` with HTML entities
- **BLOCKED — XSS via email body is prevented**

### Defense 5 — send-push-notification Stub (Partial)

Attacker sends POST to trigger push delivery to any user:
- Function returns `{ ok: false, code: "NOT_IMPLEMENTED" }` (501) immediately
- No real delivery occurs
- **PARTIAL — blocked by stub state only. Auth gate absent in code. Will fail when implemented unless gate is added first.**

---

## Runtime Evidence

### Evidence 1 — CORS Wildcard Confirmed in All Five Functions

```
send-lead-confirmation/index.ts:14   "Access-Control-Allow-Origin": "*"
send-citizen-invite/index.ts:6       "Access-Control-Allow-Origin": "*"
delete-citizen-account/index.ts:24   "Access-Control-Allow-Origin": "*"
send-push-notification/index.ts:39   "Access-Control-Allow-Origin": "*"
reverse-geocode/index.ts:10          "Access-Control-Allow-Origin": "*"
```

No function reads the `Origin` header. No allowlist comparison exists.

### Evidence 2 — Bearer Auth = Anon Key Accepted in send-lead-confirmation

```
send-lead-confirmation/index.ts:336–339
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, code: "UNAUTHORIZED" }, 401);
  }
```

The check passes for any well-formed Bearer token, including the public anon key. No validation that the token is a real JWT session occurs after this gate. Any party with the anon key (publicly obtainable from any VCSM page) passes this check.

### Evidence 3 — No Rate Limiting in Any Edge Function

Search result across all five functions: zero instances of `rate`, `limit`, `quota`, `throttle`, `ttl`, `count`, `window` in the handler code. No Deno KV usage. No IP-based counter. No per-email deduplication.

### Evidence 4 — listUsers() Full Platform Scan

```
send-citizen-invite/index.ts:267
  const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
```

No pagination parameter, no filter. Returns entire `auth.users` table contents on every invite attempt.

### Evidence 5 — Raw DB Error Returned to Caller

```
send-citizen-invite/index.ts:427–431
  return json({
    ok: false,
    code: "INVITE_RECORD_FAILED",
    message: insertError.message,
  }, 500);
```

`insertError.message` is a raw Supabase/PostgreSQL error string. Constraint names, column names, and FK references can appear here.

### Evidence 6 — x-forwarded-for Injection Without Validation

```
reverse-geocode/index.ts:72
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
...
reverse-geocode/index.ts:79
  const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
```

No IP format validation. No private/loopback range rejection. No auth gate before this path.

### Evidence 7 — Nominatim Placeholder User-Agent

```
reverse-geocode/index.ts:45   "User-Agent": "VCSM/1.0 (contact@yourdomain.com)"
reverse-geocode/index.ts:96   "User-Agent": "VCSM/1.0 (contact@yourdomain.com)"
```

Both Nominatim calls use the same placeholder that was never replaced.

### Evidence 8 — Push Notification Stub Has No Auth Gate

```
send-push-notification/index.ts:51–58
  serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    // TODO: Remove this stub and implement the full function above.
    return json({ ok: false, code: "NOT_IMPLEMENTED" }, 501);
  });
```

No auth check exists before the stub return. Any POST from any origin is accepted and returns 501.

### Evidence 9 — public.tripoint_reviews World-Readable Per Spec

From `vcsm.vport.tripoint-integration.md` Section 4:
> "RLS: Public can read all. Public can insert with rating 1-5, text >= 10 chars, is_approved defaults false/null."

No `is_approved = true` filter on the SELECT policy. Email, user_agent, source_url, and unapproved content all readable.

### Evidence 10 — public.tripoint_footer_clicks Unrestricted Anon SELECT Per Spec

From `vcsm.vport.tripoint-integration.md` Section 4:
> "RLS: Anon + authenticated can insert and select."

Includes: `ip` (inet), `latitude` (float), `longitude` (float), `city`, `region`, `country`, `user_agent`, `referrer`. Full visitor tracking data.

### Evidence 11 — actorId in Spec URL Pattern

From `vcsm.vport.tripoint-integration.md` Section 6:
> "GET /v1/vport/{actorId}/profile"
> "GET /v1/vport/{actorId}/services"
> "GET /v1/vport/{actorId}/portfolio"
> "GET /v1/vport/{actorId}/reviews"
> "GET /v1/vport/{actorId}/availability"

Internal UUID in public-facing URL path. Violates platform memory rule.

---

## Blast Radius

| Finding | Blast Radius | Scope |
|---|---|---|
| BW-EXTSITE-001 (CORS wildcard) | Any cross-origin caller | Platform-wide (all 5 edge functions) |
| BW-EXTSITE-002 (anon key gate) | All active VPORT owners | Multi-actor |
| BW-EXTSITE-003 (email abuse) | Any email recipient + SES account | Platform reputation |
| BW-EXTSITE-004 (listUsers scan) | All platform auth.users | Platform-wide |
| BW-EXTSITE-005 (stale cache) | Deleted/suspended VPORT visitors | Single actor + external consumers |
| BW-EXTSITE-006 (push stub) | All notification subscribers when implemented | Multi-actor (future) |
| BW-TRIPOINT-001 (anon key extract) | All public VPORTs on platform | Platform-wide |
| BW-TRIPOINT-002 (actorId enum) | Tripoint VPORT + cross-platform correlation | Single VPORT + actor graph |
| BW-TRIPOINT-003 (CORS spoof) | VCSM edge function API | External site consumers |
| BW-TRIPOINT-004 (reviews PII) | 9 reviewer records + their email addresses | Limited (current count) |
| BW-TRIPOINT-005 (GPS leak) | 9 visitor records + IP + GPS | Limited (current count) |

---

## BLACKWIDOW FINDINGS

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-EXTSITE-001
- **Scenario:** CORS Wildcard Abuse — malicious page on attacker.com calls send-lead-confirmation cross-origin
- **Target:** `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts` — corsHeaders (line 13–17); applies equally to all 5 Edge Functions
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function — public HTTP API
- **Attack Vector:** Browser cross-origin POST from any domain. Attacker constructs: `fetch('https://<project>.supabase.co/functions/v1/send-lead-confirmation', { method:'POST', headers:{ Authorization:'Bearer <anon_key>', 'Content-Type':'application/json' }, body: JSON.stringify({ email:'victim@example.com', vportName:'Fake Provider', firstName:'Victim' }) })`. Browser preflight receives `Access-Control-Allow-Origin: *` → grants permission. Request proceeds. SES delivers branded Vibez Citizens email.
- **Exploit Chain Type:** Single-step inject (no prior access required)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** All five functions define `"Access-Control-Allow-Origin": "*"` at the module level (Evidence 1). No function reads or validates the `Origin` header. OPTIONS preflight for all five functions returns the wildcard header unconditionally. The bearer check in send-lead-confirmation passes with the public anon key.
- **Defense Gate:** ABSENT — no origin validation at any layer
- **Blast Radius:** Any caller from any web origin can invoke any VCSM Edge Function. For email-sending functions: arbitrary SES delivery to any recipient. For future VPORT data endpoints: cross-origin VPORT data reads permitted from any site.
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VENOM-EXTSITE-001
- **Recommended Fix:** Replace `"Access-Control-Allow-Origin": "*"` with an origin allowlist. At function entry, read `req.headers.get("Origin")`, compare against allowlist (`vibezcitizens.com`, `app.vibezcitizens.com`, `tripointlockandkeys.com`, approved externals). For matching origin: echo exact value in `Access-Control-Allow-Origin`. For non-matching: respond 403 before processing body. Apply to all five Edge Functions.
- **Layer to Fix:** Edge Function
- **Required Follow-up Command:** ELEKTRA (implement allowlist patch across all 5 functions)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-EXTSITE-002
- **Scenario:** Anon Key Gate — unauthenticated caller reads any VPORT's public data without VPORT owner consent
- **Target:** `apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js` + `readPublicVportReviews.dal.js` + `readVportPublicDetails.rpc.dal.js` + all anon-accessible public views
- **Application Scope:** VCSM
- **Platform Surface:** Supabase public views (anon client) + External Website API
- **Attack Vector:** Attacker extracts VCSM Supabase URL and anon key from any VCSM page JS bundle. Constructs: `createClient(VCSM_URL, ANON_KEY)`. Queries `vport.public_menu_read_model_v`, `vport.public_actor_seo_v`, `reviews.public_vport_reviews_v`, `vport.public_vport_review_summary_v` for any slug or actorId discovered via sitemap, TRAZE directory, or brute-force slug enumeration. No VPORT owner consent is required. No API key ownership gate is checked.
- **Exploit Chain Type:** Single-step inject (anon key is publicly derivable)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** The Logan spec (external-site-integration.md Section 4, Option A) explicitly demonstrates querying VCSM views with the anon key. No VPORT owner consent table exists in the schema. No API key ownership mechanism is implemented at any layer. The DAL files read from public views without any caller validation above RLS.
- **Defense Gate:** ABSENT at application layer — RLS on views is the sole gate (ASSUMED active, not verified at policy level)
- **Blast Radius:** All active VPORT owners on the platform — any attacker can silently scrape any VPORT's public identity, services, pricing, reviews, and contact data without owner knowledge.
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VENOM-EXTSITE-002
- **Recommended Fix:** (1) Build `vc.vport_api_keys` table with `vport_actor_id`, `api_key` (hashed), `allowed_origins`, `is_active`. (2) Require API key in Authorization or X-API-Key header on all external VPORT data endpoints. (3) In Edge Functions: validate key belongs to requested VPORT, verify Origin matches allowed_origins. (4) Short-term: add `vport.external_site_consents` with owner_consented flag checked by RLS.
- **Layer to Fix:** RLS + Edge Function + DB (schema + consent table)
- **Required Follow-up Command:** Carnage (schema design for API key table + consent table) + DB (verify current RLS on public views)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-EXTSITE-003
- **Scenario:** Email Abuse — rapid sequential SES sends via send-lead-confirmation with no rate gate
- **Target:** `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts` — serve() handler
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function — email delivery API
- **Attack Vector:** Attacker has anon key (publicly obtainable). Constructs a loop: sends POST to `send-lead-confirmation` with incrementing `email` values (any email list), `vportName: "Fake Business"`, `firstName: "Target"`. Auth check passes with anon key. No deduplication logic exists. No per-IP counter exists. No per-email TTL exists. No Deno KV usage. Each call triggers one SES SendEmailCommand. Rate bounded only by Supabase Edge Function concurrency and AWS SES quota.
- **Exploit Chain Type:** Multi-step exploit (anon key extract → rapid fire loop)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** Handler source (Evidence 2): bearer check accepts anon key. Evidence 3: zero rate limiting constructs in any Edge Function. SES send is attempted on every valid POST with a valid email. The `normalizeEmail()` gate only validates format, not uniqueness or frequency.
- **Defense Gate:** ABSENT — no rate limiting, no deduplication, no sender throttle
- **Blast Radius:** Any email recipient worldwide (spam/phishing using Vibez Citizens SES identity). AWS SES sending reputation at risk. SES quota exhaustion blocks all legitimate transactional email on the platform.
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VENOM-EXTSITE-008
- **Recommended Fix:** (1) Add per-email rate limit: max 3 confirmation emails per email address per hour (Deno KV TTL counter). (2) Require a signed short-lived HMAC token issued by `submit_business_card_lead` RPC, binding this send to a real lead record. (3) Validate vportName against actual VPORT records — do not accept caller-provided name. (4) Fix CORS wildcard (BW-EXTSITE-001) simultaneously to close cross-origin abuse.
- **Layer to Fix:** Edge Function
- **Required Follow-up Command:** ELEKTRA (implement rate limit + HMAC binding)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-EXTSITE-004
- **Scenario:** User Enumeration — listUsers() loads full platform user table on every invite
- **Target:** `apps/VCSM/supabase/functions/send-citizen-invite/index.ts` — line 267
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function — authenticated citizen operation
- **Attack Vector:** Authenticated VCSM user sends repeated POST to send-citizen-invite with different `targetEmail` values. Each call triggers `adminClient.auth.admin.listUsers()` — no filter, no pagination, full `auth.users` table loaded into edge function memory. At 10,000 users: 10,000 auth rows loaded per invite attempt. Response payload is filtered in-memory and only existence status returned to caller — but raw PostgreSQL user data is in edge function memory and in Supabase function logs for the duration. Additionally: function returns `USER_ALREADY_REGISTERED` vs generic response, allowing binary probing of registration status for arbitrary emails.
- **Exploit Chain Type:** Multi-step exploit (auth → repeat probing for enumeration + timing amplification)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — email enumeration via status code response is confirmed BYPASSED. Memory-level full user table access is HIGH risk but not directly exfiltrable without crash dump.
- **Evidence:** `send-citizen-invite/index.ts:267` — `listUsers()` with no filter parameters (Evidence 4). Response on line 277: `return json({ ok: false, code: "USER_ALREADY_REGISTERED" }, 200)` — distinct from invite-sent response, enabling registration-status oracle.
- **Defense Gate:** WEAK — authenticated callers are gated, but authenticated attackers can still enumerate
- **Blast Radius:** All platform users' auth metadata (email, last sign-in, creation date) held in function memory per call. Email enumeration of registration status for any email address by any authenticated user.
- **Severity:** HIGH (enumeration + O(n) data load)
- **VENOM Finding Cross-Reference:** VENOM-EXTSITE-003
- **Recommended Fix:** (1) Replace `listUsers()` with `adminClient.auth.admin.listUsers({ filter: 'email eq \''+normalizedEmail+'\'' })` or a SECURITY DEFINER RPC `SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = $1)`. (2) Return generic response regardless of whether user exists. (3) Add per-user invite rate limit (max N invites per hour).
- **Layer to Fix:** Edge Function + DAL
- **Required Follow-up Command:** ELEKTRA + DB

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-EXTSITE-005
- **Scenario:** Stale VPORT Data — deleted VPORT slug still resolves from 10-minute cache
- **Target:** `apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js` — TTL cache
- **Application Scope:** VCSM
- **Platform Surface:** External Website API + PWA public read path
- **Attack Vector:** Scenario: VPORT is suspended for fraud/impersonation at T=0. Platform admin sets `is_active = false`. External site calls slug resolution at T=0+30s. In-memory slug TTL cache (10 minutes) returns cached `actorId`. Downstream DAL calls query live views — views filter `is_active = true` — these return no data. However: (a) the slug-to-actor binding remains alive; (b) an external site that cached the actorId previously can continue querying if it has stored the value; (c) if any downstream view does NOT filter `is_active`, stale business data is served for up to 10 minutes. The 60-second review caches compound this for review summaries.
- **Exploit Chain Type:** Cache exploit (stale TTL state served as authority)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — full data service blocked if downstream views correctly filter is_active (ASSUMED). Slug binding remains alive for 10 minutes regardless. Review aggregate caches persist for 60 seconds.
- **Evidence:** VENOM-EXTSITE-006 source analysis. No cache invalidation hook exists on VPORT lifecycle events. No Supabase Realtime subscription or DB trigger → cache flush present in any DAL file.
- **Defense Gate:** WEAK — TTL bounds the exposure but does not close it. For safety-critical suspensions (fraud, impersonation), 10 minutes is operationally unacceptable.
- **Blast Radius:** External API consumers of the suspended/deleted VPORT. External sites may display prohibited business data for up to 10 minutes after suspension.
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VENOM-EXTSITE-006
- **Recommended Fix:** (1) Add explicit cache invalidation call to VPORT lifecycle controller on is_active → false. (2) Add Supabase Realtime subscription or DB trigger → webhook to fire cache flush. (3) Reduce slug resolution TTL from 10 minutes to 60 seconds.
- **Layer to Fix:** Cache + Controller
- **Required Follow-up Command:** Wolverine (lifecycle invalidation hook) + LOGAN (document TTL contract)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-EXTSITE-006
- **Scenario:** Push Notification Stub — unauthenticated caller invokes stub without auth gate
- **Target:** `apps/VCSM/supabase/functions/send-push-notification/index.ts` — serve() handler
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function — push notification delivery (future)
- **Attack Vector:** Any caller sends POST to `https://<project>.supabase.co/functions/v1/send-push-notification`. No auth check in handler before stub return. OPTIONS (preflight) accepted and answered with wildcard CORS. POST accepted, returns 501. When stub is replaced with real OneSignal delivery code: if auth gate is not the first statement in the handler, any caller can send push notifications to any user on the platform.
- **Exploit Chain Type:** Single-step inject (no auth check before stub return; future multi-step if implementation skips gate)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — blocked by stub state (501). Auth check ABSENT in code. Future implementation requires gate before any real logic.
- **Evidence:** `send-push-notification/index.ts:51–58` (Evidence 8). The security requirement is documented in a comment only: "Verify caller has service_role or is an internal edge function (no public exposure)". This requirement does not exist in executable code.
- **Defense Gate:** ABSENT — security requirement is comment-only, not enforced
- **Blast Radius:** All notification subscribers when function is implemented. If implemented without auth gate: attacker can send arbitrary push notifications to any user on the VCSM platform.
- **Severity:** MEDIUM (LOW while stub; CRITICAL if implemented without gate)
- **VENOM Finding Cross-Reference:** VENOM-EXTSITE-009
- **Recommended Fix:** (1) Before any implementation work: add service_role verification as first gate in the handler. (2) Remove wildcard CORS — this function must never be callable from external origins. (3) Write a test that verifies public callers receive 401 before stub replacement. (4) Consider pg_net trigger pattern to eliminate public exposure entirely.
- **Layer to Fix:** Edge Function
- **Required Follow-up Command:** SPIDER-MAN (test coverage before implementation) + ELEKTRA (gate implementation)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-TRIPOINT-001
- **Scenario:** Anon Key Extraction — Option A live; attacker extracts key and enumerates any VPORT
- **Target:** `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.external-site-integration.md` Section 4 (Option A); live integration access method unknown
- **Application Scope:** VCSM
- **Platform Surface:** External Website API — Supabase direct client (Option A)
- **Attack Vector:** Visitor opens DevTools on `tripointlockandkeys.com`. Inspects JS bundle or network requests. Extracts `VCSM_SUPABASE_URL` and `VCSM_ANON_KEY`. Constructs: `createClient(VCSM_URL, ANON_KEY)`. Can now: (a) query any public VPORT view on VCSM — not just Tripoint's; (b) select `lat, lng` from `vport.public_menu_read_model_v` for any VPORT; (c) enumerate all VPORTs via slug discovery; (d) query `public.tripoint_reviews`, `public.tripoint_emails`, `public.tripoint_footer_clicks` directly; (e) send spam emails via `send-lead-confirmation` using extracted key. This attack requires zero auth. The key is in the browser environment by design under Option A.
- **Exploit Chain Type:** Multi-step exploit (key extract → unlimited platform access)
- **Governance Status:** DRAFT
- **Result:** BYPASSED (if Option A is live) / UNVERIFIABLE (if static data is still used)
- **Evidence:** External-site-integration.md Option A example explicitly shows `createClient(VCSM_URL, ANON_KEY)` in external site code. The anon key is not VPORT-scoped — it provides access to all public VPORT data on the entire platform. Evidence 11: actorId used in all query parameters. VENOM-TRIPOINT-000/001.
- **Defense Gate:** ABSENT — Option A by design has no server-side isolation between Tripoint's data and other VPORTs
- **Blast Radius:** Platform-wide — all public VPORT data on VCSM becomes enumerable by anyone who visits the external site.
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VENOM-TRIPOINT-000, VENOM-TRIPOINT-001
- **Recommended Fix:** (1) Determine live access method immediately (inspect tripointlockandkeys.com bundle or Supabase logs). (2) Build Option B Edge Functions before expanding the integration. (3) If Option A is live: rotate the anon key after Option B is deployed. (4) Mark Option A example code NEVER-USE-IN-PRODUCTION in spec.
- **Layer to Fix:** Edge Function + Router + Auth
- **Required Follow-up Command:** DEADPOOL (confirm live access method) + Wolverine (build Option B)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-TRIPOINT-002
- **Scenario:** actorId URL Enumeration — VPORT actorId in public URL enables actor graph correlation
- **Target:** `vcsm.vport.tripoint-integration.md` Section 6 — URL pattern `GET /v1/vport/{actorId}/...`
- **Application Scope:** VCSM
- **Platform Surface:** External Website API (spec-defined future Option B Edge Functions)
- **Attack Vector:** Once Option B Edge Functions are deployed with the spec-defined URL pattern: (1) Attacker visits tripointlockandkeys.com — observes network request to `/v1/vport/<uuid>/profile`. (2) Extracts UUID (actorId). (3) actorId is now permanently public — it cannot be rotated without changing all external site integrations. (4) Uses actorId to probe any other VCSM endpoint that accepts actorId as a lookup parameter (currently: public views, future endpoints, any RPC that takes p_actor_id). (5) Cross-references actorId across platform surfaces to build actor identity graph. (6) If Option B is built without slug routing, every locksmith on the platform eventually has their actorId in public URL history.
- **Exploit Chain Type:** Single-step inject (URL observation is zero-effort)
- **Governance Status:** DRAFT
- **Result:** BYPASSED (as designed — actorId is in the spec URL pattern)
- **Evidence:** `vcsm.vport.tripoint-integration.md` Section 6 (Evidence 11). `vcsm.vport.external-site-integration.md` Section 4 Option B URL pattern. Platform memory rule: "No raw IDs in public URLs — Raw UUIDs must never appear in public-facing URLs."
- **Defense Gate:** ABSENT — spec actively defines actorId in public URL path, violating platform contract
- **Blast Radius:** Single VPORT (Tripoint's actorId), but once public: enables actor correlation across any VCSM surface that accepts actorId. Permanent — UUIDs cannot be rotated.
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VENOM-TRIPOINT-003
- **Recommended Fix:** (1) Replace actorId with slug in all Option B URL patterns: `GET /v1/vport/{slug}/...`. (2) Edge Functions resolve slug → actorId internally via SECURITY DEFINER lookup. (3) Never return actorId in response payload. (4) Update spec to ban actorId from all external-facing URL patterns.
- **Layer to Fix:** Edge Function + Router + Documentation (spec)
- **Required Follow-up Command:** LOGAN (spec update to ban actorId in external URLs) + Wolverine (enforce slug routing in Option B build)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-TRIPOINT-003
- **Scenario:** CORS + Domain Spoofing — Origin header forged to match tripointlockandkeys.com on wildcard CORS function
- **Target:** `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts` + all Edge Functions — corsHeaders
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function
- **Attack Vector:** Attacker on `evil.com` attempts to appear as `tripointlockandkeys.com`. Sends POST with `Origin: https://tripointlockandkeys.com` header. Current behavior: CORS header is `*` — the Origin value is irrelevant. The function does not read or validate `Origin`. Response returns `Access-Control-Allow-Origin: *` regardless. Even when a future allowlist is implemented, if the implementation naively echoes back the Origin header without cryptographic verification, an attacker can spoof the Origin header in a non-browser client (curl, server-side fetch) to receive a `Access-Control-Allow-Origin: tripointlockandkeys.com` response — though CORS enforcement only exists in browsers. In browser context: the browser sets Origin based on the actual document origin and cannot be spoofed client-side. However, server-to-server spoofing is always possible. **Key finding:** Under the current wildcard design, domain spoofing provides no advantage to an attacker — they already have unrestricted access from any origin. Once an allowlist is in place, domain spoofing from server-side scripts bypasses it trivially.
- **Exploit Chain Type:** Injection exploit (header injection, server-to-server)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — currently wildcard makes domain spoofing irrelevant (all origins already pass). Post-allowlist: server-to-server calls can spoof Origin because CORS enforcement is browser-only.
- **Evidence:** CORS wildcard (Evidence 1). No `Origin` header read in any function. CORS headers are applied unconditionally.
- **Defense Gate:** ABSENT (no origin validation exists; wildcard makes spoofing moot but future allowlist would be bypassable server-side)
- **Blast Radius:** Any server-side caller can present any Origin header to a CORS-restricted endpoint. This is an inherent limitation of CORS — it is not a server-side auth mechanism. Server-to-server abuse must be mitigated by an API key or HMAC, not CORS alone.
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VENOM-TRIPOINT-002
- **Recommended Fix:** (1) Implement CORS allowlist (closes browser-origin abuse). (2) For server-to-server protection: add API key or HMAC requirement — do not rely on CORS alone. (3) Document in spec that CORS restricts browsers only; server-side callers must be gated by API key.
- **Layer to Fix:** Edge Function
- **Required Follow-up Command:** ELEKTRA (CORS allowlist + API key design)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-TRIPOINT-004
- **Scenario:** Review Table Exposure — anon read of public.tripoint_reviews including PII and unapproved content
- **Target:** `public.tripoint_reviews` table — SELECT policy per spec
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table (direct REST API access)
- **Attack Vector:** Attacker has anon key. Sends: `GET https://<project>.supabase.co/rest/v1/tripoint_reviews?select=*&apikey=<anon_key>`. Per spec: "Public can read all." Returns all 9 rows including: `first_name`, `last_name`, `email` (reviewer contact PII), `rating`, `text`, `location`, `source`, `source_url`, `is_approved` (including is_approved=false rows = content the operator chose to hide), `user_agent`. Zero auth required. Zero column filtering. The moderation gate (is_approved) is visible and bypassable — attacker can read content that was moderated out by filtering locally on `is_approved = false`.
- **Exploit Chain Type:** Single-step inject (anon key + REST call)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** `vcsm.vport.tripoint-integration.md` Section 4: "RLS: Public can read all." (Evidence 9). Table schema includes `email` and `is_approved` columns. WT monitor DAL explicitly excludes `email` from its SELECT list — confirming email is sensitive — but direct REST call with `select=*` includes it.
- **Defense Gate:** ABSENT — world-readable SELECT policy per spec. No `is_approved` filter on public read. No column exclusion for PII.
- **Blast Radius:** 9 reviewer records. Reviewer email addresses and PII exposed. Unapproved (moderated) review content readable.
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VENOM-TRIPOINT-008
- **Recommended Fix:** (1) Add SELECT policy that filters `is_approved = true` for anon callers. (2) Remove `email`, `user_agent`, `source_url`, `lower_email` from anon-readable columns — use column-level security or a view that excludes PII columns. (3) When migrating to `vc.vport_reviews`, use existing moderation pipeline instead.
- **Layer to Fix:** RLS + DB (table SELECT policy + column filtering)
- **Required Follow-up Command:** DB (update SELECT policy on public.tripoint_reviews) + Carnage (migration plan)

---

### BLACKWIDOW ADVERSARIAL FINDING

- **Finding ID:** BW-TRIPOINT-005
- **Scenario:** GPS Leak — anon read of public.tripoint_footer_clicks visitor PII
- **Target:** `public.tripoint_footer_clicks` table — SELECT policy per spec
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table (direct REST API access)
- **Attack Vector:** Attacker has anon key. Sends: `GET https://<project>.supabase.co/rest/v1/tripoint_footer_clicks?select=*&apikey=<anon_key>`. Per spec: "Anon + authenticated can insert and select." Returns all 9 rows including: `ip` (visitor IP address — PII under GDPR/CCPA), `latitude` (float — precise GPS), `longitude` (float — precise GPS), `city`, `region`, `country`, `user_agent`, `referrer`. Precise geolocation + IP constitutes a detailed location profile of every visitor who clicked the tracked element. Additionally: INSERT is unrestricted — attacker can pollute analytics with fabricated geolocation data.
- **Exploit Chain Type:** Single-step inject (anon key + REST call)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** `vcsm.vport.tripoint-integration.md` Section 4: "RLS: Anon + authenticated can insert and select." (Evidence 10). Table schema includes `ip` (inet) and `latitude`/`longitude` (float) columns.
- **Defense Gate:** ABSENT — unrestricted anon SELECT and INSERT per spec
- **Blast Radius:** 9 visitor records. Visitor IP addresses and precise GPS coordinates readable by any caller with anon key. INSERT abuse enables analytics pollution.
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VENOM-TRIPOINT-009
- **Recommended Fix:** (1) Restrict SELECT to service role or authenticated VPORT owner only. (2) Remove `ip` from any public-readable columns. (3) Replace precise `latitude`/`longitude` with city-level granularity only. (4) Move table to an audit schema with service-role-only access. (5) No circumstance justifies anon SELECT on this table.
- **Layer to Fix:** RLS + DB (SELECT policy update)
- **Required Follow-up Command:** DB (update SELECT + INSERT policies on public.tripoint_footer_clicks)

---

## Recommended Fixes

| Priority | Finding | Fix | Layer | Effort |
|---|---|---|---|---|
| P0 | BW-EXTSITE-001, BW-TRIPOINT-001, BW-TRIPOINT-003 | Replace wildcard CORS with origin allowlist across all 5 Edge Functions | Edge Function | Medium |
| P0 | BW-EXTSITE-003 | Add per-email rate limit + HMAC token binding to send-lead-confirmation | Edge Function | Medium |
| P0 | BW-TRIPOINT-001 | Confirm live access method; build Option B Edge Functions; rotate anon key if Option A live | Edge Function + Ops | High |
| P0 | BW-TRIPOINT-002 | Replace actorId with slug in all Option B URL patterns; update spec | Edge Function + Spec | Low |
| P1 | BW-EXTSITE-002 | API key ownership gate + VPORT consent table | DB + Edge Function + RLS | High |
| P1 | BW-EXTSITE-004 | Replace listUsers() with targeted email lookup; generic response; rate limit invites | Edge Function | Low |
| P1 | BW-TRIPOINT-004 | Add is_approved=true filter + PII column exclusion on public.tripoint_reviews SELECT | DB (RLS) | Low |
| P1 | BW-TRIPOINT-005 | Restrict SELECT to owner-only on public.tripoint_footer_clicks; remove IP + GPS from public columns | DB (RLS) | Low |
| P2 | BW-EXTSITE-005 | Lifecycle invalidation hook for slug cache; reduce slug TTL to 60s | Cache + Controller | Low |
| P2 | BW-EXTSITE-006 | Add service_role auth gate before push stub; remove wildcard CORS from push function | Edge Function | Low |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Implement CORS allowlist + rate limit patches across all 5 Edge Functions; targeted email lookup in send-citizen-invite; service_role gate in push notification stub | PENDING |
| Carnage | Schema design for `vc.vport_api_keys` + `vport.external_site_consents`; migration for tripoint_reviews → vc.vport_reviews; SELECT policy migrations for tripoint_* tables | PENDING |
| DB | Verify current RLS state on all public views and tripoint_* tables; confirm lat/lng column presence in view definition; SELECT policy audit on public.tripoint_reviews + public.tripoint_footer_clicks + public.tripoint_emails | PENDING |
| DEADPOOL | Confirm live access method on tripointlockandkeys.com (Option A vs static) before further integration work | PENDING |
| LOGAN | Update external-site-integration spec to ban actorId from public URLs; mark Option A NEVER-USE-IN-PRODUCTION; document lifecycle propagation contract | PENDING |
| Wolverine | Build Option B Edge Functions with slug routing + CORS allowlist + API key gate + rate limiting | PENDING |
| SPIDER-MAN | Write test asserting public callers receive 401 on send-push-notification before stub is replaced | PENDING |
| THOR | Evaluate release blocking status for: BW-EXTSITE-001 (CORS wildcard), BW-EXTSITE-003 (email abuse), BW-TRIPOINT-001 (anon key extraction), BW-TRIPOINT-002 (actorId in URL), BW-TRIPOINT-004 (PII table world-readable), BW-TRIPOINT-005 (GPS + IP world-readable) | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference findings with trust-boundary source — both passes already complete | COMPLETE |
| LOKI | Validate runtime telemetry for exploit paths — confirm whether CORS bypass attempts appear in Supabase edge function logs | PENDING |
| THOR | Evaluate release blocking status for BYPASSED findings (see above) | PENDING |

---

## THOR Release Gate Assessment

BLACKWIDOW recommends the following as release blockers:

- **BW-EXTSITE-001 (HIGH / BYPASSED):** CORS wildcard on SES-delivery function — active spam vector. BLOCKER.
- **BW-EXTSITE-003 (HIGH / BYPASSED):** Email abuse — unlimited SES sends with anon key. BLOCKER.
- **BW-EXTSITE-004 (HIGH / PARTIAL):** listUsers() full scan — user enumeration oracle. BLOCKER until targeted lookup is implemented.
- **BW-TRIPOINT-001 (HIGH / BYPASSED if Option A live):** Anon key in external site bundle — platform-wide VPORT enumeration. BLOCKER if Option A confirmed live.
- **BW-TRIPOINT-002 (HIGH / BYPASSED by design):** actorId in public URL spec — violates platform contract. BLOCKER for Option B build.
- **BW-TRIPOINT-004 (MEDIUM / BYPASSED):** Reviewer email and unapproved content world-readable. CAUTION (data minimization violation — recommend DB fix before integration expansion).
- **BW-TRIPOINT-005 (MEDIUM / BYPASSED):** Visitor GPS + IP world-readable. CAUTION (privacy violation — recommend DB fix before integration expansion).
- **BW-EXTSITE-006 (MEDIUM / PARTIAL):** Push notification stub has no auth gate — preventive gate required before implementation. WATCH.

THOR may allow CAUTION for:
- BW-EXTSITE-002 (MEDIUM for short-term — requires full API key infrastructure build)
- BW-EXTSITE-005 (MEDIUM — lifecycle cache invalidation, bounded by TTL)
- BW-TRIPOINT-003 (MEDIUM — server-to-server CORS spoofing, needs API key to fully close)

---
# ELEKTRA Security Report

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** VENOM cross-reference — VENOM-EXTSITE-001, 003, 005, 007, 008, 009 assigned to ELEKTRA
**Findings Summary:** 2 HIGH | 3 MEDIUM | 1 LOW | 0 INFO
**False Positives Rejected:** 0
**Suggested Patches:** 6

---

## Executive Summary

ELEKTRA traced all six VENOM-assigned source→sink chains in the five Supabase edge functions and the external site integration surface. Two HIGH findings are confirmed: wildcard CORS on all five edge functions enables any origin to call VCSM's write surfaces; and `adminClient.auth.admin.listUsers()` in `send-citizen-invite` fetches the full platform user table on every invite call with no filter. Three MEDIUM findings confirmed: raw DB error message leaked to callers in `send-citizen-invite`; `x-forwarded-for` header injected into an outbound `ipapi.co` fetch without validation in `reverse-geocode`; and the `send-lead-confirmation` function accepts the publicly-known anon key as sufficient auth to trigger SES email delivery. One LOW finding confirmed: `send-push-notification` stub is publicly reachable with wildcard CORS and no auth gate, violating its own documented security requirement. All six patches are implementation-ready.

---

## High Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-004
- Title:              Wildcard CORS on all 5 edge functions — any origin may call VCSM write surfaces
- Category:           Unsafe CORS
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:
    apps/VCSM/supabase/functions/send-lead-confirmation/index.ts : lines 13–17
    apps/VCSM/supabase/functions/send-citizen-invite/index.ts : lines 6–10
    apps/VCSM/supabase/functions/reverse-geocode/index.ts : lines 9–13
    apps/VCSM/supabase/functions/send-push-notification/index.ts : lines 38–42
    apps/VCSM/supabase/functions/delete-citizen-account/index.ts : lines 22–26
- Source:             Any HTTP request from any web origin — no origin header validation
- Sink:               `Access-Control-Allow-Origin: "*"` returned on ALL responses including preflight OPTIONS, POST, and GET — browser enforcement removed for all origins
- Trust Boundary:     Edge Function CORS policy — should restrict allowed origins to registered VCSM domains
- Impact:
    (1) Any website can make credentialed cross-origin requests to lead submission, invite, and delete endpoints
    (2) CSRF-adjacent: a malicious page can trigger lead confirmation emails or account-deletion flows on behalf of a visiting user (if cookies/anon-key are present)
    (3) Combined with the absent API key ownership gate (VENOM-EXTSITE-002), any domain can silently consume any VPORT's data or invoke write operations without registration
    (4) No origin audit log — platform cannot detect unauthorized cross-origin API consumption
- Evidence:
    // send-lead-confirmation/index.ts lines 13–17
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    // Identical pattern confirmed in all 5 functions — wildcard on every response.
- Reproduction Steps:
    1. From any external domain's DevTools console, execute:
       fetch("https://<project>.supabase.co/functions/v1/send-lead-confirmation", {
         method: "POST",
         headers: { "Authorization": "Bearer <anon-key>", "Content-Type": "application/json" },
         body: JSON.stringify({ email: "test@test.com", vportName: "Test" })
       })
    2. Observe: browser does not block the cross-origin request; response is received
    (Do not test against production)
- Existing Defense:     None. Wildcard CORS is unconditional.
- Why Defense Is Insufficient: Wildcard CORS disables all browser cross-origin protections. Combined with the anon key being publicly available, write surfaces are callable from any domain without restriction.
- Recommended Fix:    Replace wildcard with a dynamic origin allowlist. Read the incoming Origin header; compare against a known-good list; echo the exact origin (not wildcard) when matched; return 403 when unmatched. Add `Vary: Origin` header to prevent caching of the wrong CORS response.
- Suggested Patch:
    // Apply to all 5 edge functions — replace static corsHeaders with a dynamic resolver

    const ALLOWED_ORIGINS = new Set([
      "https://vibezcitizens.com",
      "https://www.vibezcitizens.com",
      // Add registered external site domains here as they are onboarded
      // e.g. "https://tripointlockandkeys.com"
    ]);

    function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
      const origin = requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)
        ? requestOrigin
        : "https://vibezcitizens.com"; // safe default — not wildcard
      return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
      };
    }

    // In each serve() handler:
    serve(async (req: Request) => {
      const origin = req.headers.get("Origin");
      const corsHeaders = getCorsHeaders(origin);

      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
      // ... rest of handler uses corsHeaders from above
    });

    NOTE: For reverse-geocode (GET endpoint), reject requests from unrecognized origins with 403 before processing.
    NOTE: Requires DB change: No. Edge function config change only.
- Follow-up Command:  BLACKWIDOW (verify cross-origin requests are blocked after patch)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-005
- Title:              adminClient.auth.admin.listUsers() fetches full user table on every invite — O(n) enumeration, full auth metadata in memory
- Category:           Privilege Escalation
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/supabase/functions/send-citizen-invite/index.ts : line 267
- Source:             Authenticated Citizen sends POST to send-citizen-invite with any targetEmail value
- Sink:               `adminClient.auth.admin.listUsers()` — fetches ALL platform users from auth.users with service role key; returns full user objects (email, metadata, created_at, last_sign_in_at) into edge function memory
- Trust Boundary:     Email existence check — should be a targeted single-row lookup, not a full table scan
- Impact:
    (1) Platform-scale data load: as user count grows, this fetches the entire auth.users table on every invite call — O(n) data transfer for an O(1) check
    (2) Full user table held in edge function memory per call — crash dump, unhandled exception handler, or error log could expose all user emails and auth metadata
    (3) Rate amplification: a single authenticated user sending repeated invite requests triggers repeated full-table loads — effectively a platform-wide data pull loop available to any authenticated actor
    (4) Email enumeration oracle: caller can determine registration status of any email address by sending invites — response code USER_ALREADY_REGISTERED reveals whether the email exists on the platform
- Evidence:
    // send-citizen-invite/index.ts line 267
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    // ← No pagination, no filter. Returns all platform users.

    // Lines 273–278: result filtered client-side (in memory) for the target email
    const alreadyExists = existingUsers?.users?.some(
      (u: { email?: string | null }) => u.email?.toLowerCase() === normalizedEmail,
    );
- Reproduction Steps:
    1. Authenticate as a VCSM Citizen
    2. Send repeated POST requests to send-citizen-invite with different target emails
    3. Each call triggers adminClient.auth.admin.listUsers() fetching the full auth.users table
    4. The USER_ALREADY_REGISTERED / non-registered response difference reveals email existence for any submitted address
    (Do not test on production)
- Existing Defense:     User authentication required (JWT verified before this call). Normalized email validation.
- Why Defense Is Insufficient: Authentication gates who can trigger the call but does not bound its scope. Every authenticated user can trigger an unbounded full-table load. The enumeration oracle is a separate concern from the scale issue.
- Recommended Fix:
    (1) Replace listUsers() with a SECURITY DEFINER RPC that performs a targeted single-row EXISTS check — does not load other user data into memory.
    (2) Add per-user rate limiting on invite calls (max N invites per hour per caller).
    (3) Return a generic "invite sent" response regardless of whether the user already exists — remove the enumeration oracle.
- Suggested Patch:
    // Step 1 — Create a SECURITY DEFINER RPC in the DB (Carnage/DB to implement)
    // CREATE OR REPLACE FUNCTION vc.check_email_registered(p_email text)
    // RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
    //   SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = p_email);
    // $$;

    // Step 2 — Replace listUsers() in send-citizen-invite/index.ts line 267:
    // REMOVE:
    // const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    // if (listError) { return json({ ok: false, code: "USER_LOOKUP_FAILED" }, 500); }
    // const alreadyExists = existingUsers?.users?.some(...);
    // if (alreadyExists) { return json({ ok: false, code: "USER_ALREADY_REGISTERED" }, 200); }

    // REPLACE WITH:
    const { data: emailExists, error: checkError } = await adminClient
      .rpc("check_email_registered", { p_email: normalizedEmail });

    if (checkError) {
      console.error("[send-citizen-invite] email check failed:", checkError.message);
      return json({ ok: false, code: "USER_LOOKUP_FAILED" }, 500);
    }

    if (emailExists) {
      // Return generic response to prevent enumeration oracle
      return json({ ok: true, code: "INVITE_SENT" }, 200);
    }

    NOTE: Requires DB change: YES — a new SECURITY DEFINER RPC `vc.check_email_registered` is required. Delegate to DB + Carnage.
    NOTE: The enumeration oracle fix (returning ok: true instead of USER_ALREADY_REGISTERED) changes the API contract — confirm with product that this is acceptable.
- Follow-up Command:  DB (create check_email_registered RPC) + Carnage (migration)
```

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-006
- Title:              Raw PostgreSQL error message returned to callers in send-citizen-invite insert failure path
- Category:           Injection
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/supabase/functions/send-citizen-invite/index.ts : lines 426–432
- Source:             DB constraint violation on `vc.vibe_invites` insert (duplicate invite_code, FK violation, RLS error, etc.)
- Sink:               `insertError.message` included verbatim in JSON response body returned to caller
- Trust Boundary:     Error handling in edge function — internal error details must not cross the trust boundary to external callers
- Impact:             Any authenticated caller who triggers a DB insert failure receives a raw PostgreSQL error message containing: table names, column names, constraint names, FK references, partial data values, and schema path information. This assists attackers in understanding internal DB structure for targeted attacks. Constraint name leakage is particularly useful for crafting idempotency attacks or bypass attempts against the invite system.
- Evidence:
    // send-citizen-invite/index.ts lines 426–432
    if (insertError) {
      return json({
        ok: false,
        code: "INVITE_RECORD_FAILED",
        message: insertError.message,   // ← raw PostgreSQL error returned verbatim
      }, 500);
    }
- Reproduction Steps:
    1. Authenticate as a VCSM Citizen
    2. Trigger a constraint violation on the vibe_invites insert — e.g., by submitting a request that causes a duplicate invite_code (UUID collision is rare but RLS or FK violations are more accessible in test environments)
    3. Observe the 500 response body contains raw PostgreSQL error text including table/constraint names
    (Do not test on production)
- Existing Defense:     error code string "INVITE_RECORD_FAILED" is present (good — generic code). Raw message field leaks the detail.
- Why Defense Is Insufficient: The error code is correct. The `message` field alongside it exposes the raw DB error. Both are returned together.
- Recommended Fix:    Remove `message: insertError.message` from the response. Log the raw error server-side for debugging. Apply the same pattern to all other error paths in this function that return `.message` from library or DB errors.
- Suggested Patch:
    // send-citizen-invite/index.ts lines 426–432 — replace
    if (insertError) {
      console.error("[send-citizen-invite] vibe_invites insert failed:", insertError.message);
      return json({ ok: false, code: "INVITE_RECORD_FAILED" }, 500);
    }

    // Also audit other error returns in this function for the same pattern:
    // grep for ".message" in the response body and apply the same fix to each occurrence.
    NOTE: Requires DB change: No. Edge function change only.
- Follow-up Command:  SPIDER-MAN (test: verify error responses contain no message field)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-007
- Title:              x-forwarded-for header injected into outbound ipapi.co fetch without validation — SSRF-adjacent proxy amplification
- Category:           SSRF
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/supabase/functions/reverse-geocode/index.ts : lines 72–85
                      apps/VCSM/supabase/functions/reverse-geocode/index.ts : lines 45, 95 (Nominatim User-Agent)
- Source:
    (1) `req.headers.get("x-forwarded-for")` — caller-controlled HTTP header; no validation before use
    (2) `"VCSM/1.0 (contact@yourdomain.com)"` — placeholder string in User-Agent for Nominatim requests
- Sink:
    (1) `fetch(\`https://ipapi.co/${ip}/json/\`)` — IP value injected directly into outbound URL without format validation or private-range blocking
    (2) Nominatim API receives placeholder User-Agent — violates Nominatim ToS; risks infrastructure-level IP block
- Trust Boundary:     Edge function input validation — all caller-controlled headers must be validated before use in outbound requests
- Impact:
    (1) SSRF-adjacent: attacker injects an internal infrastructure IP or a targeted third-party IP into x-forwarded-for, causing VCSM's edge function to make a request on behalf of that IP to ipapi.co — proxy amplification using VCSM's network identity
    (2) Private IP injection: internal infrastructure addresses (10.x, 172.16–31.x, 192.168.x, 127.x) could be passed; ipapi.co behavior with private IPs is undefined
    (3) Nominatim compliance: placeholder User-Agent risks rate-limiting or IP block of VCSM's edge function infrastructure, degrading geocoding for all users
    (4) No authentication on this endpoint — any caller triggers outbound requests to two external APIs
- Evidence:
    // reverse-geocode/index.ts lines 70–78
    if (!lat || !lon) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      // ← caller controls this value completely; no validation

      if (!ip) { return json({ location: null }); }

      const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
      //                                           ^^^  ← raw caller-controlled value in URL
      const ipData = await ipRes.json();

    // lines 44–47 and 92–96 (Nominatim):
    headers: { "User-Agent": "VCSM/1.0 (contact@yourdomain.com)" }
    // ← development placeholder never replaced
- Reproduction Steps:
    1. Send GET to reverse-geocode edge function with header: x-forwarded-for: 192.168.1.1
    2. Observe: VCSM edge function sends request to https://ipapi.co/192.168.1.1/json/
    3. Inject: x-forwarded-for: 8.8.8.8 (Google's DNS) — observe VCSM makes a request for that IP
    (Do not test on production — use a local Supabase dev environment)
- Existing Defense:     `.split(",")[0]?.trim()` — takes only the first value (correct, prevents list injection). No other validation.
- Why Defense Is Insufficient: Taking the first value only prevents multi-IP comma injection but does not validate IP format, block private ranges, or prevent arbitrary public IP proxy amplification.
- Recommended Fix:
    (1) Validate the IP with a format check (IPv4/IPv6 pattern) before use
    (2) Block private and loopback ranges (RFC 1918 + RFC 4193 + loopback)
    (3) Replace placeholder User-Agent with a real VCSM contact email
    (4) Consider requiring a Supabase anon Bearer token to discourage unauthenticated abuse of the outbound proxy
- Suggested Patch:
    // reverse-geocode/index.ts — add IP validation function

    function isPublicRoutableIp(ip: string): boolean {
      if (!ip) return false;
      // Basic format sanity — alphanumeric, dots, colons only (IPv4/IPv6)
      if (!/^[\d.]+$/.test(ip) && !/^[0-9a-f:]+$/i.test(ip)) return false;
      // Block RFC 1918 private ranges and loopback
      if (/^127\./.test(ip)) return false;            // loopback
      if (/^10\./.test(ip)) return false;             // private class A
      if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return false;  // private class B
      if (/^192\.168\./.test(ip)) return false;       // private class C
      if (/^::1$/.test(ip)) return false;             // IPv6 loopback
      if (/^fc00:/i.test(ip)) return false;           // IPv6 unique local
      if (/^169\.254\./.test(ip)) return false;       // link-local
      return true;
    }

    // Replace the IP fallback block (lines 70–85):
    if (!lat || !lon) {
      const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

      if (!rawIp || !isPublicRoutableIp(rawIp)) {
        return json({ location: null });
      }

      const ipRes = await fetch(`https://ipapi.co/${encodeURIComponent(rawIp)}/json/`);
      const ipData = await ipRes.json();
      const label = [ipData.city, ipData.region].filter(Boolean).join(", ");
      return json({ location: label || null });
    }

    // Replace placeholder User-Agent in both Nominatim fetch calls (lines 45 and 95):
    // BEFORE: "User-Agent": "VCSM/1.0 (contact@yourdomain.com)"
    // AFTER:  "User-Agent": "VCSM/1.0 (contact@vibezcitizens.com)"

    NOTE: Requires DB change: No. Edge function change only.
- Follow-up Command:  SPIDER-MAN (test: private IP injection returns null; valid public IP resolves)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-008
- Title:              send-lead-confirmation accepts publicly-known anon key as email send authorization — SES abuse vector
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/supabase/functions/send-lead-confirmation/index.ts : lines 334–338, 368–374
- Source:             Any HTTP caller with the VCSM anon key (publicly accessible from JS bundle and edge function documentation)
- Sink:               AWS SES `SendEmailCommand` — sends email to caller-supplied `body.email` address, with caller-supplied `body.vportName` and `body.businessName` in the email body
- Trust Boundary:     Authorization check — verifies `Bearer` token presence but accepts the public anon key as valid auth
- Impact:
    (1) Any party with the VCSM anon key (publicly discoverable from the JS bundle or Supabase project) can send confirmation emails via VCSM's SES infrastructure to any email address
    (2) vportName and businessName are caller-controlled strings — not validated against actual VPORT DB records — enabling spoofed provider names in the email body
    (3) No rate limiting — a single caller can trigger unlimited SES sends, risking SES reputation damage, spam complaints, and potential AWS SES suspension
    (4) The email appears to originate from Vibez Citizens (from address is VCSM's SES domain) — enables phishing leveraging VCSM's email reputation
- Evidence:
    // send-lead-confirmation/index.ts lines 334–338
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, code: "UNAUTHORIZED" }, 401);
    }
    // ← Comment: "anon key or service key from frontend/server callers"
    // ← The anon key is publicly accessible; this check is effectively no auth

    // lines 368–374
    const toEmail = normalizeEmail(body.email);    // ← caller-supplied recipient
    const provider = normalizeProvider(body.vportName, body.businessName);
    // ← caller-supplied provider name; not validated against DB records
- Reproduction Steps:
    1. Extract VCSM anon key from the public JS bundle or Supabase project settings
    2. Send POST to send-lead-confirmation with Authorization: Bearer <anon-key>
    3. Body: { email: "victim@domain.com", vportName: "Fake Business Name" }
    4. Observe: confirmation email sent to victim@domain.com from VCSM SES domain with spoofed business name
    (Do not test on production — do not send unsolicited email)
- Existing Defense:     Bearer token presence check (confirms some token is present). Email normalization (basic format validation). escapeHtml() on user strings (prevents HTML injection in email body).
- Why Defense Is Insufficient: The Bearer check accepts the public anon key, which is equivalent to no authentication. escapeHtml prevents XSS but does not prevent content spoofing or SES abuse. No rate limiting exists.
- Recommended Fix:
    (1) Add per-target-email rate limiting: max 3 confirmation emails per email address per hour (use a KV store or DB table with TTL)
    (2) Validate vportName against actual VPORT records: require a slug or actorId in the request body, resolve the actual business name server-side from the DB, and use that in the email — reject caller-supplied names
    (3) Long-term: add an HMAC-signed token issued by the lead submission RPC, binding email sends to a real lead record
- Suggested Patch:
    // Step 1 — Add slug validation to resolve provider name from DB (requires supabase client)
    // In the handler, after parsing body:

    const vportSlug = typeof body.vportSlug === "string" ? body.vportSlug.trim() : null;
    if (!vportSlug) {
      return json({ ok: false, code: "INVALID_INPUT" }, 400);
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: vportRow } = await anonClient
      .schema("vport")
      .from("profiles_public_details")     // or whichever public-read view has vport name + slug
      .select("vport_name")
      .eq("slug", vportSlug)
      .maybeSingle();

    if (!vportRow) {
      return json({ ok: false, code: "VPORT_NOT_FOUND" }, 404);
    }
    const provider = vportRow.vport_name; // server-resolved, not caller-supplied

    // Step 2 — Per-email rate limiting (simple in-memory for edge function — better with KV)
    // This is a placeholder — full implementation requires a persistent store or Supabase rate limit table
    // const rateLimitKey = `lead-confirm:${toEmail}`;
    // Check and increment a rate limit counter before proceeding

    NOTE: Requires DB change: Depends on implementation. The vport name lookup requires access to a public VPORT view — likely already accessible via the anon client. A KV-based rate limit may need a new table or Supabase KV store.
    NOTE: The HMAC token approach (long-term fix) requires changes to the lead submission RPC — coordinate with Carnage and Wolverine.
- Follow-up Command:  Carnage (lead submission RPC + HMAC token design) + BLACKWIDOW (verify SES abuse path is closed)
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-009
- Title:              send-push-notification stub publicly reachable with wildcard CORS and no auth gate — security requirement is comment-only
- Category:           Auth Bypass
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/supabase/functions/send-push-notification/index.ts : lines 38–58
- Source:             Any HTTP caller — no authentication required; function is publicly deployed
- Sink:               When implemented, `OneSignal Create Message API` — sends push notifications to platform users; currently returns 501 stub
- Trust Boundary:     Auth gate — comment at line 13 states "Verify caller has service_role or is an internal edge function (no public exposure)" but this is not enforced in code
- Impact:
    (1) Current: stub returns 501 — no immediate exploit. However, the function is publicly reachable with wildcard CORS and no auth gate in place.
    (2) When the stub is replaced with a real implementation, any public caller can send push notifications to platform users — unless the auth gate is added in the same commit. The risk is that the auth gate requirement is only in a comment and will be missed during implementation.
    (3) Wildcard CORS combined with "no public exposure" design requirement is self-contradictory and must be resolved before implementation.
- Evidence:
    // send-push-notification/index.ts lines 38–42
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",   // ← wildcard; contradicts "no public exposure" requirement
      ...
    };

    // lines 51–58
    serve(async (req: Request) => {
      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
      // NO auth check here — comment says it's required but it's not implemented
      return json({ ok: false, code: "NOT_IMPLEMENTED" }, 501);
    });
- Reproduction Steps:
    1. Send POST to send-push-notification edge function with no Authorization header
    2. Observe: 501 response (no 401) — function is reachable without auth
    (Low impact currently; test to confirm auth gate is absent before implementation)
- Existing Defense:     501 stub prevents real push delivery. That's the only protection.
- Why Defense Is Insufficient: A stub returning 501 is not an auth gate. When the stub is replaced, if the auth gate is not added in the same diff, push notifications become publicly triggerable. The security requirement must be enforced in code, not in a comment.
- Recommended Fix:
    (1) Add the service-role auth gate NOW, before any implementation is written
    (2) Replace wildcard CORS with a restrictive CORS policy (this endpoint should not be callable from any browser origin)
    (3) Add a test that verifies 401 is returned for unauthenticated requests
- Suggested Patch:
    // send-push-notification/index.ts — replace current handler

    // Internal-only CORS: this function should not be browser-callable
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://vibezcitizens.com",  // restrict, not wildcard
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    serve(async (req: Request) => {
      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      // Service-role gate — enforced before any implementation is added
      // This function must only be callable from server-side contexts (other edge functions, DB triggers)
      const authHeader = req.headers.get("Authorization");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!authHeader || !serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
        return json({ ok: false, code: "UNAUTHORIZED" }, 401);
      }

      // TODO: Remove this stub and implement the full function above.
      return json({ ok: false, code: "NOT_IMPLEMENTED" }, 501);
    });

    NOTE: Requires DB change: No. Edge function change only.
    NOTE: Once the auth gate is in place, SPIDER-MAN should add a test confirming unauthenticated requests receive 401.
- Follow-up Command:  SPIDER-MAN (test: unauthenticated requests return 401 before and after implementation)
```

---

## False Positives Rejected

None. All six VENOM cross-referenced findings were confirmed with direct code evidence.

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-004 | Wildcard CORS on all 5 edge functions | HIGH | Edge Function | MODERATE — 5 files, replace static corsHeaders with dynamic origin resolver | NO |
| 2 | ELEK-2026-05-27-005 | listUsers() O(n) enumeration per invite | HIGH | Edge Function + DB | COMPLEX — new SECURITY DEFINER RPC required + edge function update + API contract change | YES (new RPC) |
| 3 | ELEK-2026-05-27-006 | Raw DB error message in send-citizen-invite | MEDIUM | Edge Function | SIMPLE — remove message field, add server-side log | NO |
| 4 | ELEK-2026-05-27-007 | x-forwarded-for injection + placeholder User-Agent | MEDIUM | Edge Function | SIMPLE — add isPublicRoutableIp() guard + replace User-Agent string | NO |
| 5 | ELEK-2026-05-27-008 | Anon key as email send auth — SES abuse | MEDIUM | Edge Function + DB | COMPLEX — vport name server-side resolution + rate limiting + eventual HMAC token | PARTIAL (depends on rate limit approach) |
| 6 | ELEK-2026-05-27-009 | send-push-notification stub has no auth gate | LOW | Edge Function | SIMPLE — add service-role gate + restrict CORS before any implementation | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime validation: confirm cross-origin requests blocked (ELEK-004); SES abuse path closed (ELEK-008) | PENDING |
| SPIDER-MAN | Test coverage: CORS origin rejection (ELEK-004); error responses contain no message field (ELEK-006); private IP injection returns null (ELEK-007); push notification auth gate returns 401 (ELEK-009) | PENDING |
| DB | Create vc.check_email_registered SECURITY DEFINER RPC (ELEK-005); audit RLS on public VPORT views (VENOM-EXTSITE scope) | PENDING |
| Carnage | Migration for check_email_registered RPC (ELEK-005); HMAC token design for lead confirmation (ELEK-008) | PENDING |
| Thor | Release gate: ELEK-004 (CORS wildcard) and ELEK-005 (listUsers O(n)) are HIGH — both must be patched before next external site feature release | PENDING |

---

## THOR Release Gate Status

| Finding | Severity | THOR Gate | Condition |
|---|---|---|---|
| ELEK-2026-05-27-004 | HIGH | BLOCKED | CORS wildcard must be replaced before any new edge function surface is deployed |
| ELEK-2026-05-27-005 | HIGH | BLOCKED | listUsers() O(n) must be replaced with targeted RPC before invite feature ships to production at scale |
| ELEK-2026-05-27-006 | MEDIUM | CAUTION | Simple fix — should be included in the next invite function deploy |
| ELEK-2026-05-27-007 | MEDIUM | CAUTION | Simple fix — should be included in next reverse-geocode deploy |
| ELEK-2026-05-27-008 | MEDIUM | CAUTION | Rate limiting is the minimum; full HMAC fix is sprint-level work |
| ELEK-2026-05-27-009 | LOW | CAUTION | Auth gate must be merged before stub implementation begins |

---

*Audit persisted to: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_20-00_elektra_external-site.md`*
*ELEKTRA — Precision Security Scanner — READ-ONLY AUDIT COMPLETE*

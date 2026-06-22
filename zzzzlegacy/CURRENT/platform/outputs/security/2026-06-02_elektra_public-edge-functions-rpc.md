# ELEKTRA Security Report
# Date: 2026-06-02
# Scope: VCSM
# Reviewer: ELEKTRA
# Scan Trigger: VENOM cross-reference (TICKET-PUBLIC-VENOM-001) + post-patch verification (TICKET-PUBLIC-VENOM-001-PATCH)
# Findings: 1 HIGH | 2 MEDIUM | 1 LOW | 0 INFO
# False Positives Rejected: 2
# Suggested Patches: 4

---

## Scan Target

**Feature:** public (vportBusinessCard + vportMenu)
**Target surfaces:**
- send-lead-confirmation edge function
- send-citizen-invite edge function
- reverse-geocode edge function
- send-push-notification edge function
- delete-citizen-account edge function
- vport.read_business_card_public RPC (DB layer)
- Post-patch chain verification: PUBLIC-001/002/005

---

## Executive Summary

ELEKTRA scanned the `features/public` edge function surfaces and DB-layer RPC surfaces exposed by the public sub-modules. The post-patch verification confirms PUBLIC-001 and PUBLIC-002 are correctly resolved at the application layer. Two prior HIGH findings (ELEK-027-001 wildcard CORS, BLOCK-INVITE-003 public-surface classification) are rejected as false positives — current source shows proper CORS validation and authenticated-only access respectively. The highest confirmed finding is SES abuse via `send-lead-confirmation`: the publicly-known Supabase anon key is sufficient to send arbitrary confirmation emails using VCSM's SES infrastructure with no rate limiting. A second notable finding is an O(n) full user table scan in `send-citizen-invite` combined with an email enumeration oracle.

---

## High Findings

### ELEK-2026-06-02-001

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-02-001
- Title:              Unauthenticated SES Email Abuse via send-lead-confirmation
- Category:           Auth Bypass
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/supabase/functions/send-lead-confirmation/index.ts:343-423
- Source:             HTTP POST body: { email, vportName, name, providerProfileUrl, source }
                      Authorization header: any Bearer token (anon key accepted)
- Sink:               sesClient.send(new SendEmailCommand(...)) line 321
                      toEmail derived from body.email — line 388
- Trust Boundary:     Line 357: authHeader?.startsWith("Bearer") — format check only.
                      Supabase anon key is a valid Bearer token and is publicly distributed.
- Impact:             Any actor with the Supabase anon key (retrievable from app bundle or
                      DevTools) can send SES-delivered emails to arbitrary addresses,
                      set provider name to any string, flood any inbox with no rate limit.
                      Email appears from Vibez Citizens' verified SES sender.
- Evidence:
    // index.ts:354-358
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, code: "UNAUTHORIZED" }, 401, origin);
    }
    // No userClient.auth.getUser() call — anon key passes this check.

    // index.ts:388-392
    const toEmail = normalizeEmail(body.email);
    // toEmail is fully caller-controlled; no session binding.

    // index.ts:320-338
    await sesClient.send(new SendEmailCommand({ Destination: { ToAddresses: [toEmail] }, ... }));

- Reproduction Steps:
    1. Extract anon key from VCSM app bundle.
    2. POST to send-lead-confirmation with Authorization: Bearer <ANON_KEY>
       Body: { "email": "any@example.com", "name": "Test", "vportName": "Custom Name" }
    3. SES email delivered to any@example.com.
    (Chain confirmed from source. No production exploitation performed.)

- Existing Defense:    Bearer format check. HTML escaping on email content. Proper CORS.
- Why Defense Is Insufficient: Token format ≠ token validity. Anon key is public.
- Recommended Fix:
    Option A (preferred): Add userClient.auth.getUser() verification after Bearer check.
    Option B: Move email delivery to a PostgreSQL trigger on the leads table (no public edge function needed).
    Option C (partial): Add per-IP/per-email rate limiting via Upstash Redis.

- Suggested Patch:
    // After Bearer check in index.ts, add:
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ ok: false, code: "UNAUTHORIZED" }, 401, origin);
    }
    // NOTE: If anonymous lead submission must trigger email delivery,
    // use Option B (PostgreSQL trigger) instead.

- Follow-up Command:  CARNAGE, DB, BLACKWIDOW
```

---

## Medium Findings

### ELEK-2026-06-02-002

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-02-002
- Title:              O(n) Full User Table Scan + Email Enumeration Oracle in send-citizen-invite
- Category:           Privilege Escalation (information disclosure)
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/supabase/functions/send-citizen-invite/index.ts:269-280
- Source:             body.targetEmail from authenticated caller
- Sink:               adminClient.auth.admin.listUsers() line 269
                      Response: { code: "USER_ALREADY_REGISTERED" } line 280
- Trust Boundary:     JWT auth gate is correct (auth.getUser() at line 241).
                      The O(n) scan and enumeration oracle are implementation-level issues.
- Impact:
    (1) Email enumeration: any authenticated user can determine whether any email is
        registered by observing USER_ALREADY_REGISTERED in the response.
    (2) O(n) DoS amplification: full user table scan per invite call.
    (3) invite_code returned in response (line 492) — inviter can bypass email delivery
        and use the invite link directly.
- Evidence:
    // index.ts:269-280
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    );
    if (alreadyExists) {
      return json({ ok: false, code: "USER_ALREADY_REGISTERED" }, 200);
    }
- Existing Defense:    JWT authentication. CORS restriction. Self-invite check.
- Why Defense Is Insufficient:
    listUsers() has no server-side filter — returns all users. Response leaks registration status.
- Recommended Fix:
    Replace listUsers() with a SECURITY DEFINER RPC check_email_registered(p_email text).
    Remove USER_ALREADY_REGISTERED response code — use INVITE_NOT_AVAILABLE instead.
    Remove invite_code from response body.

- Suggested Patch:
    // Replace lines 269-280 with:
    const { data: alreadyExists, error: checkError } = await adminClient
      .rpc("check_email_registered", { p_email: normalizedEmail });
    if (checkError) { return json({ ok: false, code: "USER_LOOKUP_FAILED" }, 500); }
    if (alreadyExists) { return json({ ok: false, code: "INVITE_NOT_AVAILABLE" }, 200); }

    // Remove invite_code from final response (line 492):
    return json({ ok: true, invite_id: inviteRow.id }, 200);

- Follow-up Command:  CARNAGE (create check_email_registered RPC), DB, BLACKWIDOW
```

### ELEK-2026-06-02-003

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-02-003
- Title:              DB-level read_business_card_public RPC Still Returns profile_id
- Category:           IDOR/BOLA (residual DB-layer exposure after app-layer patch)
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCard.read.dal.js:7
                      (Supabase RPC: vport.read_business_card_public)
- Source:             Direct Supabase REST API call: POST /rest/v1/rpc/read_business_card_public
                      { p_slug: "any-known-slug" } with anon key
- Sink:               vport.get_business_card_sections(p_profile_id) — callable with extracted profile_id
- Trust Boundary:     App-layer patch correctly stripped profile_id from JS response.
                      DB-layer RPC still returns profile_id in raw output.
- Impact:             Non-browser callers (curl, Postman, server code) with the anon key can
                      call read_business_card_public → receive profile_id → call
                      get_business_card_sections with arbitrary profile_id.
                      Bypasses the app-layer patch entirely.
- Evidence:
    // vportBusinessCard.read.dal.js:7 — RPC returns raw data including profile_id
    const { data, error } = await vportSchema.rpc("read_business_card_public", { p_slug: key });
    // Post-patch controller: row.profile_id used internally — confirms RPC outputs it.
- Existing Defense:    App-layer model strips profile_id from JS client response.
                       CORS restricts browser calls. But Supabase REST API is directly
                       accessible to non-browser clients.
- Why Defense Is Insufficient:
    CORS does not protect server-side callers or tools like curl/Postman.
    Anon key is public. RPC has no server-side ownership check beyond anon role grant.
- Recommended Fix:
    CARNAGE: Remove profile_id from read_business_card_public RPC output column list.
    OR: Modify get_business_card_sections to accept slug instead of profile_id.

- Suggested Patch:
    -- Supabase migration (CARNAGE):
    -- Recreate read_business_card_public without profile_id in RETURNS TABLE
    -- Remove profile_id from SELECT list in function body.
    -- All other columns preserved.

- Follow-up Command:  CARNAGE, DB
```

---

## Low Findings

### ELEK-2026-06-02-004

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-02-004
- Title:              lat/lon Not URL-Encoded in reverse-geocode Nominatim Request
- Category:           Injection (parameter injection into external API)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/supabase/functions/reverse-geocode/index.ts:110-116
- Source:             lat and lon from URL query string (url.searchParams.get)
- Sink:               fetch(https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon})
- Trust Boundary:     No encodeURIComponent() applied to lat/lon before URL construction.
                      Compare: search param IS correctly encoded.
- Impact:             Parameter injection into Nominatim request. Cannot redirect to internal
                      resources — host is hardcoded. Limited to altering Nominatim behavior.
- Evidence:
    const lat = url.searchParams.get("lat");   // user-controlled
    const lon = url.searchParams.get("lon");   // user-controlled
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    // If lat="1.0&format=xml", Nominatim receives format=xml overriding format=json.
- Existing Defense:    Host hardcoded. search param correctly encoded.
- Why Defense Is Insufficient: Inconsistent encoding.
- Recommended Fix:
    Apply encodeURIComponent to lat and lon. Optionally add numeric range validation.

- Suggested Patch:
    // Before:
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    // After:
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    // Also add: numeric validation — parseFloat and range check [-90,90]/[-180,180]

- Follow-up Command:  VENOM
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       ELEK-2026-05-27-001 — Wildcard CORS on all 5 edge functions
- Location:        apps/VCSM/supabase/functions/ (all 5 functions)
- Rejection reason: Source inspection of all 5 functions confirms proper CORS validation.
                    No function has Access-Control-Allow-Origin: * in current source.
- Chain gap:        Impact — wildcard CORS pattern not present in code.
- Notes:   All 5 functions use either hardcoded "https://vibezcitizens.com" or an allowlist
           function with BASE_ORIGIN fallback. Prior finding reflects a historical state.
           CURRENT docs should update ELEK-2026-05-27-001 to RESOLVED per source.
           Caveat: send-lead-confirmation and reverse-geocode use ALLOWED_ORIGINS env var
           for additional origins — misconfiguration could reintroduce wildcard behavior.
           Deployment config audit recommended as INFO action.
```

```
FALSE POSITIVE REJECTED

- Candidate:       BLOCK-INVITE-003 — O(n) listUsers from PUBLIC surface
- Location:        apps/VCSM/supabase/functions/send-citizen-invite/index.ts:241
- Rejection reason: Function requires valid JWT (userClient.auth.getUser() at line 241).
                    Anon key callers receive 401. Not a public surface vulnerability.
- Chain gap:        Source — "anonymous callers" cannot complete the chain.
- Notes:   The O(n) scan and email enumeration oracle are VALID concerns for authenticated
           users — documented as ELEK-2026-06-02-002. Prior finding was correct about the
           vulnerability but wrong about the threat actor classification.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer | Complexity | DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-02-001 | SES abuse via anon key in send-lead-confirmation | HIGH | Edge Function | MODERATE | NO (Option A) / YES (Option B) |
| 2 | ELEK-2026-06-02-002 | O(n) user scan + email enumeration in send-citizen-invite | MEDIUM | Edge Function + RPC | MODERATE | YES |
| 3 | ELEK-2026-06-02-003 | DB RPC read_business_card_public returns profile_id | MEDIUM | RPC (CARNAGE) | COMPLEX | YES |
| 4 | ELEK-2026-06-02-004 | lat/lon not URL-encoded in reverse-geocode | LOW | Edge Function | SIMPLE | NO |

---

## Post-Patch Verification Summary

| Finding | Status | Chain Verified |
|---|---|---|
| PUBLIC-001 — profileId in public API response | RESOLVED ✓ | profileId absent from mapVportBusinessCardPublicRow return — grep confirms no matches |
| PUBLIC-002 — caller-supplied profileId to sections | RESOLVED ✓ | getVportBusinessCardSectionsController accepts slug only; profile_id derived internally; not returned |
| PUBLIC-005 — /m/:actorId raw URL redirect | MITIGATED ✓ | VportMenuRedirect resolves slug and navigates to /profile/:slug/menu |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| CARNAGE | (1) Create check_email_registered RPC; (2) Remove profile_id from read_business_card_public RPC; (3) Execute VL-001–005 migration | PENDING |
| DB | Verify GRANT EXECUTE scope on read_business_card_public and get_business_card_sections | PENDING |
| BLACKWIDOW | Runtime adversarial test: anon key rejection on send-lead-confirmation after patch | PENDING |
| VENOM | Verify ALLOWED_ORIGINS env var in production deployment (not set to wildcard) | PENDING |
| THOR | ELEK-2026-06-02-001 (HIGH) is a release blocker | PENDING |

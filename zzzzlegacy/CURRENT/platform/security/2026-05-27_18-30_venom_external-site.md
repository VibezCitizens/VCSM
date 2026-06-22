# VENOM Security Audit — External Site Integration

**Date:** 2026-05-27
**Reviewer:** VENOM
**Module:** external-site
**Trigger:** First VENOM pass — module was NOT_STARTED in governance matrix
**Findings:** 2 HIGH | 5 MEDIUM | 3 LOW

---

## VENOM TARGET

```
Feature / Route:      Edge Function API — External Domain Consumer Integration
Application Scope:    VCSM
Reason for review:    First VENOM pass; NOT_STARTED in governance matrix; HIGH risk designation
Primary trust boundary: External API Consumer → VCSM Supabase data layer
```

---

## SECURITY SURFACE

```
Entry point:          Supabase anon client (direct DB access) + Edge Functions
                      - vport.public_menu_read_model_v
                      - vport.public_actor_seo_v
                      - reviews.public_vport_reviews_v
                      - reviews.public_vport_review_summary_v
                      - reviews.public_vport_review_dimensions_v
                      - supabase/functions/send-lead-confirmation/index.ts
                      - supabase/functions/send-citizen-invite/index.ts
                      - supabase/functions/delete-citizen-account/index.ts
                      - supabase/functions/send-push-notification/index.ts
                      - supabase/functions/reverse-geocode/index.ts
                      - apps/VCSM/src/features/public/vportBusinessCard/
                      - apps/VCSM/src/features/public/vportMenu/

Auth source:          Supabase anon key (for direct DB access paths)
                      Bearer token (for edge function paths — not verified as VPORT-scoped)
Authorization layer:  RLS policies on public VPORT views (ASSUMED, unverified in this pass)
Identity surface:     actorId (primary); profileId (leaked — see VENOM-EXTSITE-004)
Sensitive objects:    VPORT profile data, contact info, reviews, menu, business card payload
```

---

## TRUST BOUNDARY TRACE

```
Client input:         External domain (e.g., tripointlockandkeys.com) or public visitor
Validated at:         Supabase RLS (ASSUMED active on views); input normalization in DAL/model
Identity resolved at: Not resolved for external site consumers — no API key ownership gate exists
Authorization:        No per-VPORT external site authorization gate — any caller can read any active VPORT
Data returned to:     External websites, public visitors, unauthenticated crawlers
```

---

## SECURITY RISK FINDINGS (Summary)

```
Missing authorization:    No VPORT owner consent gate for external site data consumption.
                          No API key mechanism scoping read access to a specific VPORT.
Identity misuse:          profileId (internal UUID) returned in vportBusinessCard model output,
                          propagated to browser state and used as DB key for get_business_card_sections RPC.
Sensitive data exposure:  lat/lng coordinates present in vport.public_menu_read_model_v query but
                          filtered in model — DB-level leakage possible via direct anon client.
                          Raw DB error message (insertError.message) returned to external callers
                          in send-citizen-invite.
Unsafe debug leakage:     Placeholder User-Agent string "contact@yourdomain.com" in reverse-geocode.
                          Violates Nominatim ToS and reveals internal tool identity details.
Policy assumption risks:  RLS on views (public_vport_reviews_v, public_actor_seo_v) verified via
                          DAL/model behavior only — not inspected at policy level.
Dependency boundary risks: send-citizen-invite calls adminClient.auth.admin.listUsers() which fetches
                          ALL platform users to check registration status — unbounded enumeration risk.
CORS wildcard:            All five edge functions use Access-Control-Allow-Origin: "*" with no origin
                          restriction. Combined with anon-key reads and write operations, this exposes
                          VCSM to cross-origin attacks from any domain.
```

---

## VENOM SECURITY FINDING

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-001
- Location: apps/VCSM/supabase/functions/send-lead-confirmation/index.ts : corsHeaders
           apps/VCSM/supabase/functions/send-citizen-invite/index.ts : corsHeaders
           apps/VCSM/supabase/functions/delete-citizen-account/index.ts : corsHeaders
           apps/VCSM/supabase/functions/send-push-notification/index.ts : corsHeaders
           apps/VCSM/supabase/functions/reverse-geocode/index.ts : corsHeaders
- Application Scope: VCSM
- Platform Surface: Edge Function
- Trust Boundary: External API Consumer | Public Visitor
- Boundary Violated: Any origin → VCSM Edge Function (no origin restriction)
- Contract Violated: External API Contract
- Current behavior: Every edge function defines:
    "Access-Control-Allow-Origin": "*"
  This header is returned on ALL responses including preflight OPTIONS, POST, and GET requests.
  No per-origin allowlist exists. No Origin header validation is performed before echoing credentials.
- Risk: Any website on the internet can make credentialed cross-origin requests to these edge
  functions. This enables:
  1. CSRF-style attacks from any origin against the lead submission endpoint
  2. Cross-origin reads of any response body (when credentials are not included — which anon-key
     calls do not require, so * applies)
  3. External sites can proxy VCSM data delivery without any origin registration or VPORT owner consent
  4. Combined with the absent API key ownership gate (VENOM-EXTSITE-002), any domain can silently
     consume any VPORT's data
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions:
  - No account required
  - No API key required
  - Attacker only needs to know the edge function URL (predictable from Supabase project ID)
  - Any web page on any domain can call the function directly
- Blast Radius: External API consumers | Multi-actor (all VPORT owners)
- Identity Leak Type: None (CORS alone does not expose identity — compounded risk with other findings)
- Cache Trust Type: None
- RLS Dependency: NONE (CORS is network layer; RLS does not compensate)
- Why it matters: The wildcard CORS policy means any external site — including sites not authorized
  by VPORT owners — can freely consume VCSM edge functions. This eliminates the access control
  layer that should restrict which domains can call VCSM APIs. For write operations (lead submission),
  it enables cross-site request forgery patterns. For public read operations, it means the platform
  cannot enforce VPORT owner consent for data consumption.
- Recommended mitigation:
  1. Define an allowlist of authorized origins (vibezcitizens.com, *.vibezcitizens.com, and
     registered external site domains)
  2. In each edge function, read the incoming Origin header and compare against the allowlist
  3. For matching origins, echo the exact origin in Access-Control-Allow-Origin instead of "*"
  4. For unmatched origins, respond with 403 before processing any request body
  5. Log rejected origins for anomaly detection
- Rationale: Origin-scoped CORS prevents unauthenticated external domains from making credentialed
  API calls. It does not replace API key ownership gates but closes the cross-origin attack surface.
- Follow-up command: ELEKTRA
- CISSP Domain:
  - Primary: Communication and Network Security
  - Secondary: Security Architecture and Engineering, Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-002
- Location: zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.external-site-integration.md : Section 4 "Option A"
           apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCard.read.dal.js : readVportBusinessCardPublicBySlugDAL
           apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js : readVportPublicDetailsRpcDAL
           apps/VCSM/src/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js : readVportPublicMenuRpcDAL
           apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js : resolveVportSlugDAL
           apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviews.dal.js : readPublicVportReviewsDAL
- Application Scope: VCSM
- Platform Surface: External Website API | Supabase Table/View
- Trust Boundary: External API Consumer
- Boundary Violated: External API Consumer → Any VPORT data without VPORT owner consent or API key
- Contract Violated: Actor Ownership Contract | External API Contract
- Current behavior: The Logan spec (Option A) documents that external sites consume VPORT data by
  creating their own Supabase client pointed at VCSM's project using the publicly shared anon key.
  External sites query any VPORT's public views directly by actorId or slug. No API key ownership
  mechanism exists. No VPORT owner consent table is checked. Any external domain can read any
  active VPORT's full public payload (name, phone, address, hours, reviews, menu) using the anon
  key found in the spec itself. The actual VCSM PWA DALs follow the same pattern — no caller
  validation exists at any layer above RLS.
- Risk: A VPORT owner has no mechanism to prevent their business data from being consumed by a
  competing or hostile external site. An external site operator could:
  1. Consume any VPORT's data without the owner's knowledge
  2. Republish that data on their own domain with no attribution
  3. Scrape all active VPORT profiles via slug enumeration
  4. Build a competitive directory service powered entirely by VCSM data
  No API key issued per VPORT, no consent registry, and no per-origin read authorization exists.
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions:
  - Attacker needs the VCSM Supabase URL (public, in JS bundle)
  - Attacker needs the anon key (public, in JS bundle or obtainable from any VCSM page)
  - Attacker needs a target VPORT slug or actorId (discoverable via sitemap, directory, or traffic app)
  - No authentication, no API key, no owner consent required
- Blast Radius: Multi-actor (all active VPORT owners on the platform)
- Identity Leak Type: Actor correlation | Resource enumeration
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: ASSUMED — The current security posture relies entirely on RLS policies being
  correctly configured on public views. No application-layer ownership gate exists. RLS was not
  inspected at the policy level in this pass.
- Why it matters: VCSM's value proposition includes that VPORT owners control their data and where
  it appears. Without a consent gate and API key ownership mechanism, VCSM cannot fulfill this
  promise. Any external party — including competitors — can freely consume any VPORT's identity,
  pricing, services, reviews, and contact data without the owner's knowledge or permission.
- Recommended mitigation:
  1. Build a VPORT API key management table (e.g., vc.vport_api_keys) with:
     - vport_actor_id (FK to vc.actors)
     - api_key (hashed, unique)
     - allowed_origins (text array — registered domains)
     - is_active (boolean)
     - created_by_user_id
  2. Require external site API calls to include their API key in an Authorization or X-API-Key header
  3. In edge functions, validate the API key, confirm it belongs to the requested VPORT actor, and
     verify the caller's Origin matches the key's allowed_origins
  4. Remove the anon key from any public-facing documentation
  5. For the short term: add a vport.external_site_consents table with a boolean `owner_consented`
     flag that RLS policies check before allowing reads from external-origin sessions
- Rationale: An API key scoped per VPORT and per origin creates a mandatory consent gate. The VPORT
  owner issues the key, registers their external domain, and can revoke it at any time. This enforces
  data sovereignty without blocking the legitimate external site integration pattern.
- Follow-up command: Carnage (schema design) + DB (RLS policy review)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security and Risk Management, Security Architecture and Engineering
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-003
- Location: apps/VCSM/supabase/functions/send-citizen-invite/index.ts : serve() handler line 267
- Application Scope: VCSM
- Platform Surface: Edge Function
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen → Full platform user list (unbounded enumeration)
- Contract Violated: External API Contract
- Current behavior: To check whether an invitee is already registered, the function calls:
    adminClient.auth.admin.listUsers()
  This fetches ALL users on the VCSM platform with no pagination or filter. The result is then
  filtered client-side (within the edge function) for the target email. As the platform grows,
  this call becomes increasingly expensive and returns the full auth user table on every invite
  attempt. The service role key is used, meaning the query bypasses all RLS.
- Risk:
  1. Performance: On a platform with thousands of users, this query fetches the entire auth.users
     table on every invite call — O(n) data transfer for an O(1) check
  2. Data exposure: The full user list (email, auth metadata, created_at, last_sign_in_at) is held
     in edge function memory for every invite operation — a crash dump or error log could expose it
  3. Rate amplification: A single authenticated attacker can trigger unbounded platform-wide user
     data loads by sending repeated invite requests with different target emails
  4. Eventual consistency risk: listUsers() may not reflect recent registrations within the
     same request lifecycle
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Valid VCSM Citizen account required
  - Attacker sends POST to send-citizen-invite with target_email values
  - Each call loads the full user table from Supabase Auth
- Blast Radius: Multi-actor (all platform users' auth metadata loaded per call)
- Identity Leak Type: Actor correlation (email → registration status mapping for any email)
- Cache Trust Type: None
- RLS Dependency: BYPASSED — adminClient with service role key bypasses all RLS; listUsers()
  is an admin-level operation returning full auth.users contents
- Why it matters: The email-existence check should be a targeted single-row lookup, not a
  full-table scan. The current approach exposes platform user data in memory at scale and allows
  authenticated users to perform cheap registration-status probing for arbitrary email addresses,
  enabling user enumeration attacks on the invite surface.
- Recommended mitigation:
  1. Replace listUsers() with a targeted query:
     adminClient.auth.admin.listUsers({ filter: `email eq '${normalizedEmail}'` })
     OR use a SECURITY DEFINER RPC: SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = $1)
  2. Add per-user invite rate limiting (max N invites per hour per caller) enforced at the
     RPC or edge function layer
  3. Return a generic "invite sent" response even when the user already exists (prevent
     email existence probing via timing/response differences)
- Rationale: Targeted lookup eliminates the O(n) data load. Rate limiting prevents invite-as-probe
  attacks. Generic response removes timing oracle.
- Follow-up command: ELEKTRA + DB
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Operations
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-004
- Location: apps/VCSM/src/features/public/vportBusinessCard/model/vportBusinessCard.model.js : mapVportBusinessCardPublicRow (line 69)
           apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js : getVportBusinessCardSectionsController (lines 119–121)
           apps/VCSM/src/features/public/vportBusinessCard/hooks/useVportBusinessCardSections.js : useVportBusinessCardSections
           apps/VCSM/src/features/public/vportBusinessCard/view/VportBusinessCardPublic.view.jsx : line 62
- Application Scope: VCSM
- Platform Surface: External Website API | PWA
- Trust Boundary: Public Visitor | External API Consumer
- Boundary Violated: Internal identity surface (profileId) exposed to public browser state and
  used as DB RPC parameter from the public-facing layer
- Contract Violated: External API Contract | Actor Ownership Contract
- Current behavior: The model mapper returns `profileId: raw.profile_id ?? null` as part of the
  public business card payload. This profileId is:
  1. Stored in the React component's card state (`card?.profileId`)
  2. Passed directly to `useVportBusinessCardSections` as the `profileId` prop
  3. Used as the `p_profile_id` parameter in the `get_business_card_sections` RPC call
  4. Visible in browser DevTools memory and React state inspector
  The platform contract (VCSM CLAUDE.md) explicitly bans profileId from public hook or controller
  surfaces. The vportMenu DAL already has a comment "profile_id intentionally excluded — internal
  UUID, banned from public surfaces (VENOM V-001)" showing this was recognized and fixed there,
  but the fix was not applied to the vportBusinessCard path.
- Risk:
  1. Internal VPORT profileId UUID is exposed in browser memory on any public business card page
  2. Any visitor who opens DevTools on a VCSM business card page can extract the profileId
  3. The profileId can be used to probe other internal systems that accept profile_id as an
     identifier (other RPCs, potential future admin routes, cross-feature correlation)
  4. Violates the explicit platform identity surface contract
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - No account required
  - Visit any public business card page (vibezcitizens.com/vport/{slug}/card)
  - Open DevTools, inspect React state or network responses
  - profileId is visible in the card state object
- Blast Radius: Single actor (per VPORT page visit)
- Identity Leak Type: Internal UUID exposure | Ownership inference
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: NONE (exposure is at the model/UI layer, not DB layer)
- Why it matters: profileId is an internal database UUID that must never appear on public-facing
  surfaces. Its exposure allows attackers to correlate VPORT identities across systems, probe
  internal RPCs, and builds a persistent mapping of internal IDs from public pages. This directly
  violates the platform identity surface contract established in VCSM CLAUDE.md and noted in the
  vportMenu DAL comments.
- Recommended mitigation:
  1. Remove `profileId` from mapVportBusinessCardPublicRow output — do not include profile_id
     in the return object
  2. Redesign get_business_card_sections RPC to accept p_actor_id or p_slug instead of p_profile_id
     (the VPORT owner can resolve the profile internally from the actor)
  3. Update readBusinessCardSectionsDAL, getVportBusinessCardSectionsController, and
     useVportBusinessCardSections to use slug or actorId as the sections key
  4. Confirm the vportMenu path remains clean (it already strips profile_id correctly)
- Rationale: Replacing profileId with slug or actorId as the sections lookup key eliminates the
  internal UUID from the public surface entirely. The RPC can resolve the profile server-side.
- Follow-up command: ELEKTRA + Wolverine
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Software Development Security, Identity and Access Management
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-005
- Location: apps/VCSM/supabase/functions/send-citizen-invite/index.ts : insertError error block (lines 426–432)
- Application Scope: VCSM
- Platform Surface: Edge Function
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Internal DB error message → External API response body
- Contract Violated: External API Contract
- Current behavior: When the vibe_invites insert fails, the function returns:
    json({ ok: false, code: "INVITE_RECORD_FAILED", message: insertError.message }, 500)
  The raw Supabase/PostgreSQL error message (insertError.message) is returned verbatim to the caller.
  PostgreSQL error messages can contain: table names, column names, constraint names, FK references,
  partial data values, and schema paths — all internal platform structure.
- Risk: Any authenticated user who triggers a DB constraint violation (e.g., duplicate invite_code,
  FK violation, RLS error) receives a raw PostgreSQL error message that reveals internal schema
  structure. This is information useful for crafting targeted attacks against the DB layer.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Valid VCSM Citizen account required
  - Must trigger a DB error on the vibe_invites insert path
  - UUID collision on invite_code is highly unlikely but constraint violations are possible
- Blast Radius: Single actor (per failed invite)
- Identity Leak Type: None (schema structure leak, not identity leak)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Raw DB error messages in API responses are a well-known information disclosure
  vector. Even low-probability triggers expose internal schema details that assist attackers in
  understanding the DB structure without direct access.
- Recommended mitigation:
  1. Replace the raw message return with a generic internal error code:
     json({ ok: false, code: "INVITE_RECORD_FAILED" }, 500)
  2. Log the raw error server-side: console.error("[send-citizen-invite] insert failed:", insertError.message)
  3. Apply the same pattern to all other error returns in the function that include
     .message from library or DB errors
- Rationale: Generic error codes give callers enough information to handle failures without
  exposing internal structure. Server-side logging preserves debuggability.
- Follow-up command: ELEKTRA
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations, Asset Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-006
- Location: apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js : resolveVportSlugDAL
           apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviewSummary.dal.js : readPublicVportReviewSummaryDAL
           apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviewDimensions.dal.js : readPublicVportReviewDimensionsDAL
- Application Scope: VCSM
- Platform Surface: External Website API | Supabase Table/View
- Trust Boundary: External API Consumer | Public Visitor
- Boundary Violated: Stale cache → continued data service after VPORT deletion or suspension
- Contract Violated: VPORT Lifecycle Contract | External API Contract
- Current behavior: Three in-memory TTL caches serve public VPORT data:
  - resolveVportSlugDAL: TTL 10 minutes — caches slug → actorId resolution
  - readPublicVportReviewSummaryDAL: TTL 60 seconds — caches review aggregate per actor
  - readPublicVportReviewDimensionsDAL: TTL 60 seconds — caches dimension ratings per actor
  None of these caches listen to VPORT lifecycle events. If a VPORT is deleted, suspended, or
  moderated off-platform, the slug resolution cache continues returning its actorId for up to
  10 minutes. Any downstream read using that actorId will then query views that (presumably) filter
  is_active — but the slug-to-actor binding remains alive in the cache even after the VPORT is gone.
- Risk:
  1. A suspended or deleted VPORT's slug continues resolving to an actorId for up to 10 minutes
  2. External sites consuming this data may serve stale business information after a VPORT is
     pulled for moderation or policy violations
  3. Review summary cache (60s) continues serving aggregate ratings from moderated reviews
  4. No server-side cache invalidation hook exists — caches are pure in-memory TTL with no
     lifecycle event subscription
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - VPORT must be deleted/suspended during the active TTL window
  - External site must query during the stale window
  - Impact is time-bounded (10 min for slug, 60s for reviews)
- Blast Radius: Single actor (deleted/suspended VPORT) | External API consumers of that VPORT
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive | Moderation-sensitive
- RLS Dependency: ASSUMED — assumed that the underlying views filter is_active; slug cache
  bypasses the view entirely by returning a cached actorId that then feeds live queries
- Why it matters: If a VPORT is suspended for a policy violation, its business card and menu may
  remain accessible to external sites for up to 10 minutes. For safety-critical suspensions (fraud,
  impersonation), this window is unacceptable. External sites consuming stale data may display
  inaccurate or prohibited content on their own domains.
- Recommended mitigation:
  1. Add a cache invalidation trigger to the VPORT lifecycle controller:
     Call invalidateVportSlugCache(slug) whenever a VPORT is deactivated, deleted, or suspended
  2. Add a Supabase Realtime subscription (or DB trigger → webhook) that fires invalidation when
     vport.profiles.is_active becomes false
  3. Reduce the slug resolution TTL to 60 seconds (matching review caches)
  4. Document in the external site integration spec that caches may serve stale data for up to
     [TTL] seconds after a lifecycle change
- Rationale: Proactive invalidation on lifecycle state change closes the stale window to near-zero
  for intentional deactivations. TTL reduction bounds accidental staleness.
- Follow-up command: Wolverine + LOGAN
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Security Operations, Asset Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-007
- Location: apps/VCSM/supabase/functions/reverse-geocode/index.ts : serve() handler — IP fallback block (lines 70–84)
- Application Scope: VCSM
- Platform Surface: Edge Function
- Trust Boundary: Public Visitor | External API Consumer
- Boundary Violated: Caller-controlled header value → external third-party API request
- Contract Violated: None (operational risk, not identity boundary)
- Current behavior: The reverse-geocode function reads the IP address from:
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  This value is passed directly to: https://ipapi.co/${ip}/json/
  The x-forwarded-for header is caller-controlled and can contain any value, including:
  - Arbitrary IP addresses (causing a request to ipapi.co for a spoofed IP)
  - Malformed values that may be misinterpreted by ipapi.co
  - IP addresses of internal infrastructure
  Additionally, the User-Agent header sent to Nominatim contains a placeholder:
    "User-Agent": "VCSM/1.0 (contact@yourdomain.com)"
  This is a development placeholder that was never replaced with a real contact address.
  Nominatim's usage policy requires a valid contact email and will block requests from
  violating User-Agents.
- Risk:
  1. SSRF-adjacent: A caller can inject any IP into x-forwarded-for, causing VCSM's edge
     function to make a request to ipapi.co on behalf of that IP — proxy amplification
  2. Nominatim ToS violation: The placeholder User-Agent violates OpenStreetMap's usage policy,
     risking IP-level blocking of VCSM's edge function infrastructure
  3. No authentication is required on this endpoint — any caller can trigger outbound requests
     to both Nominatim and ipapi.co
  4. Rate limiting on Nominatim is per User-Agent/IP; VCSM's edge function IP may be blocked
     platform-wide due to abuse by unauthenticated callers
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - No account required
  - Send GET request with crafted x-forwarded-for header
  - Any public caller can trigger outbound third-party API requests
- Blast Radius: External API consumers | All callers of reverse-geocode function
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The reverse-geocode endpoint is unauthenticated and acts as a proxy for
  two external APIs. Caller-controlled IP injection enables SSRF-adjacent behavior. The
  placeholder User-Agent is a compliance violation that risks infrastructure-level blocking.
- Recommended mitigation:
  1. Validate the x-forwarded-for IP before use: parse it with a proper IP validator, reject
     private/loopback ranges (10.x, 172.16-31.x, 192.168.x, 127.x), reject non-IP strings
  2. Replace "contact@yourdomain.com" with a real VCSM contact email in the User-Agent
  3. Add a rate limit on this endpoint (e.g., 10 requests per IP per minute via Supabase
     function rate-limiting or a simple TTL counter)
  4. Consider requiring a valid Supabase anon token (Bearer header check) to discourage
     unauthenticated abuse
- Rationale: IP validation prevents proxy amplification. Real User-Agent fulfills Nominatim's
  usage policy. Rate limiting prevents abuse of the outbound proxy behavior.
- Follow-up command: ELEKTRA
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Communication and Network Security, Security Operations
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-008
- Location: apps/VCSM/supabase/functions/send-lead-confirmation/index.ts : serve() handler — auth check (lines 334–338)
- Application Scope: VCSM
- Platform Surface: Edge Function
- Trust Boundary: External API Consumer | Public Visitor
- Boundary Violated: Anon key accepted as valid "caller authentication" for email delivery
- Contract Violated: External API Contract
- Current behavior: The send-lead-confirmation function checks for a Bearer token:
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) { return 401 }
  The comment in the code states: "Require a Bearer token (anon key or service key from
  frontend/server callers). This is not user-auth — lead forms are anonymous — but prevents
  uncredentialed requests."
  The check accepts the VCSM anon key as a valid Bearer token. The anon key is:
  - Embedded in every VCSM browser client
  - Visible in the JS bundle of the public-facing VCSM app
  - Documented in the Logan spec as the key for external site access
  This means any party with the public anon key can invoke the lead confirmation email function
  to send emails to arbitrary recipients.
- Risk:
  1. Any party with the VCSM anon key (publicly discoverable) can send arbitrary confirmation
     emails via VCSM's AWS SES infrastructure to any email address
  2. This can be used for spam campaigns, phishing (email appears to come from Vibez Citizens),
     or SES reputation damage
  3. There is no rate limiting on the function — a single caller can trigger unlimited email sends
  4. The vportName and businessName fields are caller-controlled and not tied to any actual VPORT
     record, allowing spoofed provider names in the email body
- Severity: MEDIUM
- Exploitability: HIGH
- Attack Preconditions:
  - Attacker needs the VCSM anon key (publicly discoverable from JS bundle)
  - No VPORT ownership required
  - No per-VPORT authorization
  - Any email address can be targeted
- Blast Radius: External API consumers | Any email recipient (platform reputation)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Accepting the public anon key as authentication for email delivery means the
  email-sending function is effectively unauthenticated. This allows abuse of VCSM's SES
  infrastructure for unsolicited email to arbitrary recipients, risking SES reputation damage,
  spam complaints, and potential AWS SES suspension.
- Recommended mitigation:
  1. Add per-IP / per-target-email rate limiting (e.g., max 3 confirmation emails per email
     address per hour)
  2. Validate vportName against actual VPORT records: require a slug or actorId in the request
     body, look up the actual business name, and use that — do not accept caller-provided name
  3. Add a short-lived HMAC signature requirement: the lead submission RPC returns a signed token
     that the client passes to this function, binding the email send to an actual lead record
  4. Consider moving email delivery into the submit_business_card_lead RPC via pg_net or a
     server-side trigger, eliminating the need for a separate publicly callable email function
- Rationale: Rate limiting bounds abuse. Tying the function to a signed lead token prevents
  detached email sends. VPORT name validation prevents spoofing.
- Follow-up command: ELEKTRA + Carnage
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Software Development Security, Communication and Network Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-009
- Location: apps/VCSM/supabase/functions/send-push-notification/index.ts : serve() handler (full file)
- Application Scope: VCSM
- Platform Surface: Edge Function
- Trust Boundary: External API Consumer | System Service
- Boundary Violated: Documented security requirement exists but is not implemented
- Contract Violated: External API Contract
- Current behavior: The send-push-notification edge function is a stub that returns 501:
    return json({ ok: false, code: "NOT_IMPLEMENTED" }, 501)
  However, the CORS headers are set to Access-Control-Allow-Origin: "*" and the function is
  deployed to the platform. The implementation plan in the comments states:
    "2. Verify caller has service_role or is an internal edge function (no public exposure)"
  The function accepts OPTIONS (preflight) and any POST request, returning 501. No auth check
  exists on the stub. When the function is eventually implemented, the security requirement
  documented in the comment (service_role verification, no public exposure) must be enforced
  before any real push delivery code is added.
- Risk:
  1. The function is publicly reachable with wildcard CORS, violating its own "no public exposure"
     design requirement documented in the code
  2. If the TODO implementation is added without enforcing the service_role check, a public caller
     could send push notifications to any user or actor on the platform
  3. The stub currently leaks that push notifications are planned but not yet implemented —
     a security-relevant implementation detail
- Severity: LOW
- Exploitability: LOW (stub returns 501 — no real impact until implemented)
- Attack Preconditions:
  - Function must be fully implemented before exploitation is possible
  - Risk is preventive: implementation must not proceed without the auth gate
- Blast Radius: Multi-actor (if implemented without auth gate — all notification subscribers)
- Identity Leak Type: None currently
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Documenting the security requirement in a comment is not enforcement. When
  a developer implements this function, they may not notice the auth gate requirement if the
  stub is refactored. The requirement must be enforced in code before any real delivery logic
  is added. This is a preventive finding.
- Recommended mitigation:
  1. Before implementing the function body, add the service_role check as the FIRST gate:
     verify the Authorization header contains a service role key or an internal HMAC signature
  2. Remove the wildcard CORS header — this function should not be callable from external origins
  3. Add a test that verifies public callers receive 401 before the stub is replaced
  4. Consider whether push notification delivery belongs in an edge function at all vs. a
     server-side database trigger → pg_net call, which would never be publicly exposed
- Rationale: Enforcing the auth gate before implementation prevents the security requirement from
  being overlooked during feature development.
- Follow-up command: SPIDER-MAN + ELEKTRA
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Software Development Security, Security Architecture and Engineering
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-EXTSITE-010
- Location: apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js : readVportPublicDetailsRpcDAL
- Application Scope: VCSM
- Platform Surface: External Website API | Supabase Table/View
- Trust Boundary: External API Consumer | Public Visitor
- Boundary Violated: Internal coordinate data (lat/lng) present in DB query result, filtered at model layer only
- Contract Violated: External API Contract
- Current behavior: The DAL explicitly selects lat and lng from vport.public_menu_read_model_v:
    "actor_id,...lat,lng,social_links,hours,booking_url"
  The model (vportPublicDetails.model.js) does NOT return lat or lng in its output object —
  these values are consumed internally to build directions URLs and then discarded. The comment
  in the DAL states "lat/lng/social_links consumed internally by model."
  However:
  1. The raw row including lat/lng is accessible in edge function memory between query and model mapping
  2. If the model is bypassed (direct DAL use, future refactor, or copy-paste error) lat/lng would be returned
  3. When external sites use Option A (direct Supabase client with anon key), they can select lat/lng
     directly from vport.public_menu_read_model_v — the view itself does not filter coordinates
  4. Exact GPS coordinates represent precise physical location of a business
- Risk: External sites using direct Supabase access (Option A per the Logan spec) can retrieve
  exact GPS coordinates of businesses by selecting lat/lng from the view. This was not intended
  as a public field (the model strips it) but the view exposes it at the DB layer for any anon
  client. For businesses operated from a home address, this is a precise physical location leak.
- Severity: LOW
- Exploitability: MEDIUM
- Attack Preconditions:
  - Attacker needs VCSM anon key (publicly accessible)
  - Attacker queries vport.public_menu_read_model_v directly with .select('lat, lng')
  - No authentication required
- Blast Radius: Multi-actor (all VPORTs with coordinates stored in the view)
- Identity Leak Type: Private contact exposure (precise geolocation of business)
- Cache Trust Type: None
- RLS Dependency: ASSUMED — relies on view definition to restrict which columns are visible;
  if the view includes lat/lng columns, any anon SELECT on the view can retrieve them
- Why it matters: Precise GPS coordinates expose the exact physical location of VPORT owners
  who operate from residential addresses. Even when the model correctly strips these fields
  for the VCSM PWA path, external sites using direct anon key access bypass the model layer
  entirely and can retrieve coordinates directly from the view.
- Recommended mitigation:
  1. Remove lat and lng from the vport.public_menu_read_model_v view definition (DB layer fix)
  2. Build directions URL server-side within the view or a separate RPC, returning only
     the pre-built Google Maps URL without exposing raw coordinates
  3. If coordinates must remain in the view, create a separate non-public view that omits them
     and route all external-facing reads through the coordinate-free view
  4. Update the DAL to remove lat/lng from the select list once the view is updated
- Rationale: Removing coordinates from the view closes the bypass path for direct anon client
  access. Building directions URLs server-side eliminates the need to expose coordinates at all.
- Follow-up command: Carnage (view update) + DB (coordinate column audit)
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Communication and Network Security, Software Development Security
```

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VENOM-EXTSITE-001 | CORS wildcard on all 5 edge functions — any origin can call any function | Edge Function | P1 | App | ELEKTRA |
| VENOM-EXTSITE-002 | No API key ownership gate or VPORT owner consent for external site data consumption | RLS + Controller + Edge Function + DB | P1 | DB + App | Carnage + DB |
| VENOM-EXTSITE-003 | adminClient.listUsers() fetches full user table on every invite — unbounded enumeration | Edge Function | P2 | App | ELEKTRA + DB |
| VENOM-EXTSITE-004 | profileId (internal UUID) returned in public business card model and used in browser state | UI + Controller + DAL + DB (RPC) | P2 | App | ELEKTRA + Wolverine |
| VENOM-EXTSITE-005 | Raw DB error message returned to external callers in send-citizen-invite | Edge Function | P2 | App | ELEKTRA |
| VENOM-EXTSITE-006 | Stale TTL cache serves VPORT data up to 10 min after deletion/suspension | Cache + Controller | P2 | App | Wolverine + LOGAN |
| VENOM-EXTSITE-007 | x-forwarded-for injection → SSRF-adjacent + Nominatim placeholder User-Agent | Edge Function | P3 | App | ELEKTRA |
| VENOM-EXTSITE-008 | Anon key accepted as email send auth — allows spam abuse of SES infrastructure | Edge Function | P2 | App | ELEKTRA + Carnage |
| VENOM-EXTSITE-009 | send-push-notification stub has no auth gate — security requirement is comment-only | Edge Function + Test Coverage | P3 | App | SPIDER-MAN + ELEKTRA |
| VENOM-EXTSITE-010 | lat/lng in view — external anon clients can retrieve precise GPS coordinates | RLS + DB (view definition) | P3 | DB | Carnage + DB |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VENOM-EXTSITE-002 — no governance policy for external site VPORT data access |
| Asset Security | 3 | VENOM-EXTSITE-002, VENOM-EXTSITE-004, VENOM-EXTSITE-010 — internal IDs, coordinates, VPORT data minimization |
| Security Architecture and Engineering | 3 | VENOM-EXTSITE-001, VENOM-EXTSITE-002, VENOM-EXTSITE-006 — CORS design, API ownership gate, cache staleness |
| Communication and Network Security | 3 | VENOM-EXTSITE-001, VENOM-EXTSITE-007, VENOM-EXTSITE-008 — CORS wildcard, SSRF-adjacent, SES abuse |
| Identity and Access Management | 3 | VENOM-EXTSITE-002, VENOM-EXTSITE-003, VENOM-EXTSITE-004 — no VPORT owner consent, listUsers enumeration, profileId surface |
| Security Assessment and Testing | 1 | VENOM-EXTSITE-009 — auth gate requirement is comment-only, no test coverage |
| Security Operations | 3 | VENOM-EXTSITE-003, VENOM-EXTSITE-005, VENOM-EXTSITE-008 — error message leak, SES abuse, logging |
| Software Development Security | 5 | VENOM-EXTSITE-004, VENOM-EXTSITE-005, VENOM-EXTSITE-007, VENOM-EXTSITE-008, VENOM-EXTSITE-009 — input validation, error handling, DAL discipline |

### CISSP Uncovered Domains

All 8 CISSP domains were meaningfully covered in this audit. No domain was out of scope or not applicable to the external site integration surface.

---

## AUDIT NOTES

### What was NOT reviewed in this pass

- RLS policy definitions on the underlying views were not inspected at the DB policy layer.
  The audit assumed RLS is active on `vport.public_menu_read_model_v`, `vport.public_actor_seo_v`,
  `reviews.public_vport_reviews_v`, `reviews.public_vport_review_summary_v`, and
  `reviews.public_vport_review_dimensions_v` but did not verify these policies exist and are correct.
  Follow-up command: DB.

- The `read_business_card_public` and `submit_business_card_lead` RPC implementations were not
  inspected — only the DAL callers. Security properties of these SECURITY DEFINER functions are
  assumed from their names and the DAL comments. Follow-up command: DB.

- The `vport.public_actor_seo_v` view definition was not inspected. It is assumed to filter
  is_active and is_deleted based on DAL behavior, but this was not verified. Follow-up command: DB.

### Positive findings (existing security controls observed)

- delete-citizen-account correctly derives user identity from JWT rather than accepting userId from client
- send-citizen-invite correctly verifies actor ownership before allowing VPORT-sourced invites
- vportMenu DAL correctly strips profile_id with an explicit security comment (VENOM V-001)
- vportPublicDetails model correctly strips profile_id, lat, lng from its output
- vportBusinessCard model correctly uses slug/actorId for public routing (except profileId — see VENOM-EXTSITE-004)
- HTML escaping is applied to all user-facing content in email templates
- escapeHtml() is present in both email edge functions
- reviewsDAL uses explicit column lists (no SELECT *)
- lead submission uses SECURITY DEFINER RPC pattern (no direct table write from anon client)

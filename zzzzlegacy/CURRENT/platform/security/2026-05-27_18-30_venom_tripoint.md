# VENOM Security Audit — Tripoint External Site Integration

**Date:** 2026-05-27
**Reviewer:** VENOM
**Module:** tripoint
**Trigger:** First VENOM pass — module was NOT_STARTED in governance matrix
**Findings:** [0 CRITICAL | 7 HIGH | 4 MEDIUM | 3 LOW]

---

## VENOM TARGET

```
Feature / Route / Engine: Tripoint External Site Integration
Application Scope:        VCSM
Reason for review:        First-ever security pass. Module flagged HIGH risk in governance matrix.
                          Integration is RELEASED but has never been audited. External domain
                          (tripointlockandkeys.com) consumes VCSM VPORT data. No prior VENOM run.
Primary trust boundary:   External API Consumer ← VCSM Supabase (public data surface)
```

---

## SOURCE CODE STATUS

**Implementation status: SPECIFICATION-ONLY + PARTIAL WT MONITOR CODE**

No dedicated Edge Function for the external site API was found in:
- `apps/VCSM/supabase/functions/` — 5 functions exist; none serve external VPORT data
- `apps/VCSM/src/` — no tripoint-specific source files
- The spec (`vcsm.vport.external-site-integration.md`) defines Option B (Edge Function API) as the recommended path, but that code has not been built

What was found:
- `apps/WT/mine-transfer/src/features/dashboard/tripoint/` — an internal **dashboard monitor** in the WT transfer workspace. This is a VCSM-side owner view, NOT the external API serving tripointlockandkeys.com.
- `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.tripoint-integration.md` — Logan integration spec (primary source)
- `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.external-site-integration.md` — parent external site architecture spec

**Consequence:** The external site (`tripointlockandkeys.com`) is listed as RELEASED. It must currently be accessing VCSM data via one of two unaudited paths:
1. **Option A** — Direct Supabase anon client embedded in the external site (exposing Supabase URL + anon key in browser JS), OR
2. **Hardcoded data** — The site still uses hardcoded static files and has not yet migrated to VCSM as a data source

Both scenarios carry security risk. Neither has an auditable Edge Function to inspect.

---

## SECURITY SURFACE

```
Entry point:          Unknown — no Edge Function found; presumed Supabase direct client or static data
Auth source:          None for public reads; anon key presumed if Option A is live
Authorization layer:  RLS on vport schema tables (verified for some tables; gaps exist for locksmith tables)
Identity surface:     actorId exposed in spec-defined API URL pattern: /v1/vport/{actorId}/...
Sensitive objects:    vport.profiles, vport.profile_public_details, vport.locksmith_service_details,
                      vport.locksmith_service_areas, public.tripoint_emails, public.tripoint_reviews,
                      public.tripoint_footer_clicks
```

---

## TRUST BOUNDARY TRACE

```
Client input:         HTTP requests from tripointlockandkeys.com visitors (fully untrusted)
Validated at:         Unknown — no Edge Function to validate; Option A has no app-layer validation
Identity resolved at: None for anon reads; actorId is static per VPORT
Authorization enforced at: RLS layer (partial — locksmith-specific tables not verified)
Data returned to:     Public web visitors via external domain — permanently cacheable by browsers and CDNs
```

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-000
- **Location:** Implementation not found — specification only
- **Application Scope:** VCSM
- **Platform Surface:** Unknown (spec-only) — Edge Function API not implemented
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** External API Contract — live integration has no auditable implementation
- **Contract Violated:** External API Contract
- **Current behavior:** The tripoint module is listed as RELEASED in the governance matrix. The Logan spec and module README confirm this. However, no Edge Function serving external VPORT data to tripointlockandkeys.com exists in `apps/VCSM/supabase/functions/`. The WT transfer workspace contains an internal monitor dashboard (owner-side), not the external API. The external site must be either using the Supabase anon client directly (Option A — explicitly rejected by the spec for production) or is still serving hardcoded data.
- **Risk:** Security properties of the live integration cannot be verified without implementation. If Option A is live, the Supabase URL and anon key are exposed in the external site's browser bundle.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:** None — if Option A is live, anon key is public by definition; any browser DevTools inspection reveals it
- **Blast Radius:** External API consumers, all external site visitors, potentially VCSM platform if anon key is misused
- **Identity Leak Type:** Internal UUID exposure (actorId in query params if Option A)
- **Cache Trust Type:** Public-profile-sensitive
- **RLS Dependency:** UNKNOWN (spec-only) — no implementation to inspect
- **Why it matters:** A RELEASED integration with no auditable source code cannot be security-verified. If Option A is in production, every visitor to tripointlockandkeys.com can inspect the browser bundle and extract the VCSM Supabase URL and anon key, enabling unauthorized enumeration of any public VPORT data.
- **Recommended mitigation:** Immediately determine which access method is live: (a) inspect the tripointlockandkeys.com browser bundle for embedded Supabase credentials, (b) check Supabase logs for API calls from the external domain's IP range, (c) build the required Edge Function per Option B before expanding the integration
- **Rationale:** Establishing implementation state is prerequisite to all further security work on this module
- **Follow-up command:** DEADPOOL (root cause investigation of live access method), then Wolverine (to plan Option B build)
- **CISSP Domain:**
  - Primary: Security Assessment and Testing
  - Secondary: Security Architecture and Engineering, Security Operations

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-001
- **Location:** Logan spec: Section 6 (Integration Method — Option A example code), `vcsm.vport.external-site-integration.md`
- **Application Scope:** VCSM
- **Platform Surface:** External Website API
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** External API Contract — Option A exposes Supabase credentials in client-side code
- **Contract Violated:** External API Contract, Actor Ownership Contract
- **Current behavior:** The external site integration spec explicitly documents Option A as using the VCSM Supabase anon key directly in the external site's client-side code. The spec shows `createClient('https://YOUR_VCSM_SUPABASE_URL', 'YOUR_VCSM_ANON_KEY')` embedded in the external site's JS bundle. The spec acknowledges this as a "Con" but presents it as a viable option. The spec-recommended endpoint patterns include actorId as a URL path parameter: `GET /v1/vport/{actorId}/profile` — meaning the internal UUID is part of every public URL.
- **Risk:** If Option A is live: (1) the VCSM Supabase URL and anon key are permanently exposed in the external site's browser bundle, enabling any visitor to make direct queries to VCSM's database; (2) the anon key can be used to enumerate any public VPORT data, not just Tripoint's; (3) actorId (internal UUID) is embedded in queries and therefore recoverable from DevTools
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:** None — browser DevTools or public bundle inspection; no authentication needed
- **Blast Radius:** External API consumers, all public VPORTs on the VCSM platform (anon key is not VPORT-scoped)
- **Identity Leak Type:** Internal UUID exposure (actorId visible in query params)
- **Cache Trust Type:** Public-profile-sensitive
- **RLS Dependency:** ASSUMED — anon key access relies entirely on RLS being correctly configured for all public VPORT tables; any RLS gap becomes publicly exploitable
- **Why it matters:** The anon key is not Tripoint-specific — it provides read access to ALL public VPORT data on the VCSM platform. An attacker who extracts the anon key from the external site can enumerate all VPORTs, all public reviews, all public service data, and any tables where RLS policies have gaps. This is not a Tripoint-only risk — it is a platform-wide exposure surface.
- **Recommended mitigation:** (1) Build Option B Edge Functions immediately; (2) If Option A is currently live, rotate the Supabase anon key after Option B is deployed; (3) The spec's Option A code examples should be marked NEVER-USE-IN-PRODUCTION to prevent future reuse; (4) Do not embed actorId in public Edge Function URLs — use slug-based routing
- **Rationale:** Edge Functions with a fixed VCSM internal service call eliminate browser-side credential exposure. Slug-based URLs eliminate actorId disclosure.
- **Follow-up command:** Wolverine (build Option B Edge Functions), DB (verify anon role table grants)
- **CISSP Domain:**
  - Primary: Communication and Network Security
  - Secondary: Identity and Access Management, Asset Security

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-002
- **Location:** `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts` line 14; all 4 Edge Functions
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** External API Contract — CORS is wildcard across all Edge Functions
- **Contract Violated:** External API Contract
- **Current behavior:** All four existing Edge Functions (`send-lead-confirmation`, `send-push-notification`, `send-citizen-invite`, `delete-citizen-account`) set `"Access-Control-Allow-Origin": "*"`. This wildcard CORS policy allows any origin on the internet to call these functions. The `send-lead-confirmation` function is the one most likely used by tripointlockandkeys.com (it handles lead form submissions). None of the functions validate the `Origin` header against an allowlist of trusted domains (e.g., `vibezcitizens.com`, `tripointlockandkeys.com`).
- **Risk:** Any website on the internet can call VCSM Edge Functions, bypassing the intent of domain-scoped access. For `send-lead-confirmation`: (1) any site can trigger SES emails from VCSM's AWS account, (2) email address harvesting and spam via forged submissions, (3) AWS SES quota exhaustion. For future external VPORT API functions: wildcard CORS means any attacker site can read VCSM VPORT data cross-origin in the browser.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:** None — any browser on any domain can make cross-origin requests; no credentials required for OPTIONS preflight bypass
- **Blast Radius:** All Edge Function consumers, AWS SES quota, VCSM platform email reputation
- **Identity Leak Type:** None (CORS does not directly expose identity, but enables cross-origin data extraction)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — CORS is a network-layer control independent of RLS
- **Why it matters:** Wildcard CORS on `send-lead-confirmation` allows any attacker to send arbitrary lead submissions through VCSM's SES account, exhausting AWS sending quotas, triggering SES blacklisting, and potentially polluting the VCSM email reputation. When the external VPORT API is built (Option B), wildcard CORS will allow competing sites to read VCSM VPORT data cross-origin in browsers.
- **Recommended mitigation:** Replace `"Access-Control-Allow-Origin": "*"` with an origin allowlist: `vibezcitizens.com`, `app.vibezcitizens.com`, `tripointlockandkeys.com`, and any other explicitly approved external domains. Validate the `Origin` request header at function entry and reject non-allowlisted origins with 403. For `send-lead-confirmation`, also enforce a rate limit per IP or email.
- **Rationale:** Origin allowlisting ensures only approved domains can invoke VCSM Edge Functions cross-origin. This does not block server-to-server calls (which do not send Origin), so legitimate server-side integrations are unaffected.
- **Follow-up command:** Wolverine (implement CORS allowlist in all Edge Functions)
- **CISSP Domain:**
  - Primary: Communication and Network Security
  - Secondary: Security Architecture and Engineering, Software Development Security

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-003
- **Location:** Logan spec: Section 6 (Option B URL pattern), `vcsm.vport.external-site-integration.md`; also `apps/WT/mine-transfer/src/features/dashboard/tripoint/dal/tripointMonitor.read.dal.js`
- **Application Scope:** VCSM
- **Platform Surface:** External Website API
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** Public Identity Surface Contract — actorId (internal UUID) appears in public-facing API URLs and direct DB queries
- **Contract Violated:** External API Contract, Actor Ownership Contract
- **Current behavior:** The spec defines the external API URL pattern as `GET /v1/vport/{actorId}/profile` — placing the internal actorId UUID directly in public URL paths. Additionally, the WT monitor DAL (`tripointMonitor.read.dal.js`) queries `tripoint_emails`, `tripoint_reviews`, and `tripoint_footer_clicks` directly with no scoping by actorId, and the `subapps_emails` table is filtered by `source_app = 'TRIPOINT'` (a string constant, not actor-scoped). The external site integration spec also shows direct Supabase queries using `actor_id = 'TRIPOINT_ACTOR_ID'` (Option A code example), confirming the actorId would be a hardcoded constant in the external site's bundle.
- **Risk:** (1) Internal actorId UUID becomes permanently public and searchable once embedded in any external site URL or bundle; (2) actorId is the canonical identity key in VCSM — its exposure enables actor correlation across all platform surfaces; (3) If actorId appears in public URLs, it violates the platform memory rule "No raw IDs in public URLs"
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:** Inspect the external site's network requests or JS bundle; actorId is visible in any query
- **Blast Radius:** Single VPORT (Tripoint's actorId), but enables actor correlation across VCSM platform
- **Identity Leak Type:** Internal UUID exposure, Actor correlation
- **Cache Trust Type:** Public-profile-sensitive
- **RLS Dependency:** NONE — exposure is structural, not RLS-dependent
- **Why it matters:** The "No raw IDs in public URLs" rule exists for precisely this reason — internal UUIDs are permanent and cannot be rotated once public. Once the Tripoint actorId is in the external site's bundle or URL history, it is effectively public forever. Any future VCSM feature that accepts actorId as a lookup parameter could be queried by anyone who has observed the external site.
- **Recommended mitigation:** (1) The external API must use slug-based routing: `GET /v1/vport/{slug}/profile`; (2) Edge Functions should resolve slug → actorId internally using a SECURITY DEFINER lookup and never return actorId in the response payload; (3) Remove actorId from all external-facing URL patterns in the spec; (4) Any spec example code using hardcoded actorId must be updated to use slug
- **Rationale:** Slugs are public by design (they appear in human-readable URLs on VCSM). ActorIds are internal identifiers. The distinction is enforced throughout the platform — the external API must follow the same rule.
- **Follow-up command:** LOGAN (update spec to ban actorId from external API URLs), Wolverine (enforce slug routing in Option B build)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management, Communication and Network Security

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-004
- **Location:** Logan spec: Section 9 (RLS Considerations — `vc.vport_reviews` row), `vcsm.vport.tripoint-integration.md`
- **Application Scope:** VCSM
- **Platform Surface:** External Website API, Supabase Table/View
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** External API Contract — reviews require auth but external site visitors are anonymous
- **Contract Violated:** External API Contract
- **Current behavior:** The Logan spec states: "Read reviews — Yes (auth required) — Edge Function with service role." This means the only way to serve reviews to the external site is via an Edge Function that uses a service role key to bypass RLS. No such Edge Function exists. The spec for the VCSM reviews engine confirms `reviews.upsert_neutral_review` requires `authenticated` session, and `vc.is_actor_owner` ties every review write to `auth.uid()`. The `read_business_card_public` RPC (which joins the `reviews.public_vport_review_summary_v` view) is granted to `anon, authenticated` — this provides a summary (count + average rating) but not individual review text.
- **Risk:** (1) If the external site tries to read individual reviews using anon access, it will receive a permission denied response — reviews will not appear; (2) If a service role key is used in an Edge Function, that key must never be exposed client-side; (3) The spec acknowledges the risk ("service role key (dangerous — never client-side)") but leaves the implementation approach undefined; (4) An unbuilt Edge Function for review reads means review content is either inaccessible or accessed insecurely
- **Severity:** HIGH
- **Exploitability:** MEDIUM — requires building the Edge Function incorrectly to become exploitable
- **Attack Preconditions:** Developer mistake — embedding service role key in client-side code or in the external site's bundle
- **Blast Radius:** All VCSM reviews data if service role key is leaked; single VPORT reviews if Edge Function is correctly scoped
- **Identity Leak Type:** None currently — risk is of future implementation error
- **Cache Trust Type:** Public-profile-sensitive
- **RLS Dependency:** REQUIRED — reviews.reviews table requires auth; service role bypass must be strictly controlled in Edge Function
- **Why it matters:** Reviews are the highest-value business trust signal displayed on external sites. The implementation gap creates pressure to use a service role key without proper controls. If a developer embeds the service role key in an Edge Function that returns full review data without VPORT scoping, all VCSM reviews become readable by any caller.
- **Recommended mitigation:** (1) Build a SECURITY DEFINER RPC `reviews.get_public_vport_reviews(p_slug text)` that returns only approved, non-deleted review text for the specified VPORT (resolved from slug) — grant EXECUTE to anon; (2) This eliminates the need for a service role key in the Edge Function; (3) The RPC must filter: `is_deleted = false`, `active_card = true`, VPORT is active and non-deleted; (4) Never pass a service role key to any Edge Function that can be called by the external site
- **Rationale:** A SECURITY DEFINER RPC with anon EXECUTE grant is the established pattern for providing public read access to auth-protected tables (see `vport.read_business_card_public`). It eliminates the service role key requirement entirely.
- **Follow-up command:** Carnage (design the reviews public RPC), DB (verify current reviews RLS policies)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-005
- **Location:** Logan spec: Section 9 (RLS Considerations — all rows); migration survey (locksmith-specific tables)
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table/View, Edge Function
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** External API Contract — locksmith-specific tables have no confirmed RLS for public read
- **Contract Violated:** External API Contract
- **Current behavior:** The Logan spec defines that `vport.locksmith_service_details` and `vport.locksmith_service_areas` will be consumed by the external site for locksmith-specific data. The DAL for these tables (`locksmithServiceDetails.read.dal.js`, `locksmithServiceAreas.read.dal.js`) queries them using the `vportSchema` Supabase client with `authenticated` session. A survey of all tracked migration files shows: (1) `20260427060000` grants INSERT/UPDATE/DELETE to `authenticated` for both tables; (2) no migration file creates SELECT policies or enables RLS on these tables; (3) the `20260523230000` migration (which updated `actor_can_manage_profile`) references these tables in its AFFECTED TABLES comment, confirming write policies exist — but no tracked SELECT policy migration was found. The public SELECT policy state for these tables is UNVERIFIED.
- **Risk:** (1) If RLS is not enabled or no SELECT policy exists for anon/external callers, the tables may return zero rows (default deny) OR may return all rows if an overly permissive archive policy exists; (2) Locksmith service details include operational pricing fields (`starting_price_cents`, `max_price_cents`), ETA bounds, warranty terms, and business notes — this is business-sensitive data; (3) Locksmith service areas include GPS coordinates (`center_lat`, `center_lng`), radius, emergency coverage flags, and travel fees
- **Severity:** HIGH
- **Exploitability:** MEDIUM — exploitability depends on whether an archive policy grants public SELECT; requires DB inspection to confirm
- **Attack Preconditions:** Direct Supabase REST API call with anon key (if Option A is live); otherwise requires Edge Function to be built incorrectly
- **Blast Radius:** Single VPORT (Tripoint) for locksmith data; potentially all locksmith VPORTs if policies are not scoped
- **Identity Leak Type:** None directly, but GPS coordinates and emergency coverage flags constitute sensitive operational data
- **Cache Trust Type:** Public-profile-sensitive
- **RLS Dependency:** UNVERIFIED — no tracked SELECT policy migration found for these tables; live DB state unknown
- **Why it matters:** Locksmith service area data includes precise GPS coverage zones and emergency response flags. If these tables have no SELECT policy (default deny), the external site cannot display service areas — a functional gap. If an archive policy grants public SELECT without VPORT scoping, all locksmith VPORT operational data on the platform is publicly readable.
- **Recommended mitigation:** (1) Run DB audit to confirm current RLS state for `vport.locksmith_service_details` and `vport.locksmith_service_areas`; (2) Add tracked SELECT policies following the `services_select_viewer` pattern (active profile join, is_active filter); (3) The external API should return only the fields needed by the external site — strip `notes`, internal pricing fields, and operational metadata not intended for public display
- **Rationale:** The viewer SELECT pattern (inline EXISTS subquery to vport.profiles) is the established canonical approach for public-facing VPORT data. Applying it to locksmith tables closes the RLS gap and ensures scoping by active VPORT.
- **Follow-up command:** DB (inspect current RLS state for locksmith tables), Carnage (add tracked SELECT policies)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Asset Security, Security Assessment and Testing

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-006
- **Location:** Logan spec: Section 12 (VPORT Lifecycle); `vcsm.vport.tripoint-integration.md` Section 5 (Target State)
- **Application Scope:** VCSM
- **Platform Surface:** External Website API
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** External API Contract — no revocation or suspension mechanism for external access
- **Contract Violated:** External API Contract, VPORT Lifecycle Contract
- **Current behavior:** The Logan spec does not define any mechanism for: (1) revoking the external site's access to VCSM data; (2) detecting or responding to VPORT suspension or deactivation; (3) propagating VPORT lifecycle changes (deleted, inactive, moderated, suspended) to the external site. The `read_business_card_public` RPC filters `is_active = true AND is_deleted = false AND business_card_published = true`, so the DB layer would return no data for a deactivated VPORT — but the external site has no defined behavior when this happens. With no Edge Function, there is also no defined HTTP error code, fallback content, or notification mechanism.
- **Risk:** (1) If Tripoint's VPORT is deactivated, the external site will silently display stale cached data from the browser or CDN, potentially indefinitely; (2) If the VPORT is suspended for moderation, the external site has no way to know and will continue to display the business as active; (3) There is no mechanism for the VPORT owner to revoke external site access without deleting the VPORT
- **Severity:** MEDIUM
- **Exploitability:** LOW — not an active exploit, but a governance gap with reputational and operational risk
- **Attack Preconditions:** VPORT deactivation or suspension event — legitimate platform lifecycle operation
- **Blast Radius:** External API consumers (tripointlockandkeys.com visitors), VPORT owner
- **Identity Leak Type:** Moderation-state leakage (external site does not reflect moderation state)
- **Cache Trust Type:** Public-profile-sensitive, Moderation-sensitive
- **RLS Dependency:** REQUIRED — DB layer correctly filters deactivated VPORTs; gap is at caching and notification layers
- **Why it matters:** A moderated or suspended VPORT should not continue to display as a fully active business on an external domain. Without a lifecycle propagation mechanism, VCSM loses control over VPORT data once it has been fetched by the external site or cached by a CDN.
- **Recommended mitigation:** (1) Edge Functions should return HTTP 404 or 410 (Gone) when the VPORT is inactive, deleted, or suspended; (2) External site must handle these status codes and display an appropriate "business unavailable" state; (3) Define a cache TTL for external API responses (recommend 5 minutes maximum for business identity data); (4) Consider a webhook or polling mechanism for lifecycle events; (5) Document the suspension/deletion propagation contract in the Logan spec
- **Rationale:** Explicit HTTP status codes for inactive VPORTs allow the external site to implement correct fallback behavior. Short cache TTLs limit the window during which stale data persists after a lifecycle change.
- **Follow-up command:** LOGAN (update spec with lifecycle propagation contract), Wolverine (implement status codes in Edge Functions)
- **CISSP Domain:**
  - Primary: Security and Risk Management
  - Secondary: Security Architecture and Engineering, Security Operations

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-007
- **Location:** `public.tripoint_emails` (spec: Section 4 column definitions); `apps/WT/mine-transfer/src/features/dashboard/tripoint/dal/tripointMonitor.read.dal.js` lines 3-13
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table/View, External Website API
- **Trust Boundary:** External API Consumer, Authenticated VPORT Owner
- **Boundary Violated:** Asset Security — PII fields returned without need-to-know scoping
- **Contract Violated:** External API Contract
- **Current behavior:** The `public.tripoint_emails` table contains: `email`, `ip_address`, `user_agent`, `referred_by`, `consent`, `vibez_user_id` (nullable FK to VCSM user), `welcome_status`, and `notes`. The WT monitor DAL (`readTripointLeads`) selects `email`, `consent`, `source_site`, `referred_by`, `user_agent`, and `created_at` — returning `user_agent` and `referred_by` to the VCSM dashboard. The `ip_address` field is NOT in the DAL column list, but it exists in the table and could be selected by any caller with table access. The spec notes that `public.tripoint_emails` may be kept as-is or migrated to a VCSM Edge Function. The existing RLS (per spec): "Anon insert requires `is_valid_email = true`, `consent = true`, `source_site = 'TRIPOINT'`" — but no restriction on who can SELECT is explicitly tracked in migrations.
- **Risk:** (1) `ip_address` in `public.tripoint_emails` is PII subject to data minimization rules; (2) `vibez_user_id` creates a linkage between an external site lead capture and an internal VCSM user identity — if this field is readable by anon callers, it enables VCSM user enumeration from the external site; (3) The SELECT policy for `public.tripoint_emails` is not tracked in migrations — its current state is UNKNOWN; (4) If any SELECT policy grants anon read, email addresses and user-agent strings of lead capture subscribers would be publicly readable
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM — depends on current SELECT policy state; requires DB inspection to confirm
- **Attack Preconditions:** Supabase anon key (already public if Option A is live) + SELECT grant on table
- **Blast Radius:** 5 email subscriber records (current count), linked VCSM user identities via vibez_user_id
- **Identity Leak Type:** Private contact exposure, Actor correlation (vibez_user_id)
- **Cache Trust Type:** None
- **RLS Dependency:** UNVERIFIED — SELECT policy state for public.tripoint_emails is not in tracked migrations
- **Why it matters:** `vibez_user_id` in a publicly accessible lead table creates a cross-reference between external site visitors and VCSM internal user IDs. If SELECT is granted to anon, any caller with the anon key can enumerate submitted email addresses and their VCSM user correlations.
- **Recommended mitigation:** (1) Run DB audit to confirm SELECT policy state for `public.tripoint_emails`; (2) Ensure SELECT is restricted to `authenticated` with an owner-scoping predicate (VPORT owner or service role only); (3) Consider removing `vibez_user_id` from this table — the linkage belongs in VCSM's CRM, not in a public schema table; (4) Remove `ip_address` or move it to a separate audit table accessible only by service role
- **Rationale:** Lead capture tables contain consent-gated PII. The SELECT policy must match the INSERT policy's intent — leads belong to the business owner, not to public callers.
- **Follow-up command:** DB (inspect SELECT policy on public.tripoint_emails), Carnage (add owner SELECT policy)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management, Security and Risk Management

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-008
- **Location:** `public.tripoint_reviews` (spec: Section 4 column definitions); spec RLS note
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table/View
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** Asset Security — reviewer email and moderation state exposed without filtering
- **Contract Violated:** External API Contract
- **Current behavior:** The spec states: "`public.tripoint_reviews` — Public can read all." This means the table is world-readable with no column filtering. The table contains: `first_name`, `last_name`, `email`, `rating`, `text`, `location`, `source`, `source_url`, `is_approved`, `user_agent`, and `lower_email` (generated column). The `is_approved` field is a boolean moderation flag. The WT monitor DAL (`readTripointReviews`) explicitly excludes `email` from its column list — but a direct REST call with anon key selects all columns by default. The Logan spec notes "Public can insert with `is_approved` defaults false/null" — meaning unapproved review content is also world-readable.
- **Risk:** (1) Reviewer email addresses are in a world-readable table; (2) Unapproved (moderated/pending) reviews are publicly readable — an attacker can read review content that was moderated out; (3) `source_url` may contain the original URL where a review was scraped from, revealing internal data gathering methods; (4) `user_agent` of the reviewer is returned to any public caller — minor PII
- **Severity:** MEDIUM
- **Exploitability:** HIGH — per spec, the table is public-read with no restrictions
- **Attack Preconditions:** None — table is publicly readable per spec RLS definition
- **Blast Radius:** 9 reviews (current count), all reviewer email addresses
- **Identity Leak Type:** Private contact exposure (reviewer email), Moderation-state leakage (is_approved=false rows visible)
- **Cache Trust Type:** None
- **RLS Dependency:** BYPASSED — per spec, SELECT allows all rows to all callers; no is_approved filter
- **Why it matters:** Reviewer email addresses should never be world-readable. Unapproved review content being world-readable bypasses the moderation gate — any visitor can read reviews that the operator chose to hide from the public-facing display.
- **Recommended mitigation:** (1) Add a SELECT policy that filters `is_approved = true` for anon callers; (2) Remove `email` from any SELECT policy that applies to anon or public callers — email is PII; (3) Remove `user_agent`, `source_url`, `lower_email` from public-readable columns; (4) When migrating to `vc.vport_reviews`, the VCSM reviews engine already has correct moderation filtering (`is_deleted = false`, `active_card = true`) — use that pipeline instead
- **Rationale:** The public display of reviews should be identical to what is shown on the external site — only approved content. The email column has no legitimate use case for public consumption.
- **Follow-up command:** DB (update SELECT policy on public.tripoint_reviews), Carnage (migration to vc.vport_reviews pipeline)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security Operations, Software Development Security

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-009
- **Location:** `public.tripoint_footer_clicks` (spec: Section 4 column definitions)
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table/View
- **Trust Boundary:** External API Consumer, Public Visitor
- **Boundary Violated:** Asset Security — GPS coordinates and visitor IP readable by any caller
- **Contract Violated:** None (this table is intentionally site-local, not VCSM-managed)
- **Current behavior:** The spec states: "`public.tripoint_footer_clicks` — Anon + authenticated can insert and select." The table contains: `ip`, `city`, `region`, `country`, `latitude`, `longitude`, `user_agent`, and `referrer`. Both INSERT and SELECT are world-readable. The spec confirms this table stays as-is after the VPORT migration — it is site analytics, not VCSM data.
- **Risk:** (1) `ip` (visitor IP address) is PII; (2) `latitude` + `longitude` (precise geolocation) + `city`/`region`/`country` creates a detailed location profile for every visitor click; (3) Any caller with the Supabase anon key can SELECT all 9 rows and read IP addresses and geolocations of past visitors; (4) The table's INSERT policy allows any caller to insert arbitrary geolocation data — potential for data pollution or spoofed analytics
- **Severity:** MEDIUM
- **Exploitability:** HIGH — per spec, anon SELECT is unrestricted
- **Attack Preconditions:** Supabase anon key (publicly embedded if Option A is live)
- **Blast Radius:** 9 click records (current count), visitor PII
- **Identity Leak Type:** Private contact exposure (IP address, precise geolocation)
- **Cache Trust Type:** None
- **RLS Dependency:** BYPASSED — anon SELECT is unrestricted per spec
- **Why it matters:** Visitor IP addresses and precise geolocation data constitute PII under most privacy frameworks (GDPR, CCPA). Storing them in a world-readable table with no access control violates data minimization principles. If the anon key is extracted from the external site's bundle, all historical click analytics including visitor locations are fully readable.
- **Recommended mitigation:** (1) Restrict SELECT to owner-only (service role or authenticated VPORT owner); (2) Remove `ip` from public-readable columns; (3) Remove precise `latitude`/`longitude` — city-level granularity is sufficient for analytics; (4) Consider moving this table to an audit schema with service-role-only access; (5) This table should not be readable via the anon key under any circumstances
- **Rationale:** Analytics data with IP addresses and geolocation is not display data — it is operational data for the business owner. Restricting SELECT to owner access aligns the access model with the data's purpose.
- **Follow-up command:** DB (update SELECT policy on public.tripoint_footer_clicks)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security and Risk Management, Communication and Network Security

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-010
- **Location:** Logan spec: Sections 7-8 (Phase 2 — Reviews Migration, field mapping)
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function, Supabase Table/View
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** Actor Ownership Contract — anonymous review submission has no actor identity
- **Contract Violated:** Actor Ownership Contract, External API Contract
- **Current behavior:** The spec acknowledges a gap: "VCSM reviews use `reviewer_actor_id` which requires a VCSM account. For anonymous reviews from Tripoint site visitors, an Edge Function would need to handle anonymous submission — either creating a guest actor or storing reviewer name without actor linkage." The spec leaves this unresolved. The current `reviews.upsert_neutral_review` RPC requires `vc.is_actor_owner(p_author_actor_id)` to pass — meaning a VCSM account is mandatory. If an Edge Function is built to accept anonymous review submissions from the external site, it would need to either (a) create a ghost actor or (b) use a service role to bypass ownership verification.
- **Risk:** (1) Any implementation of anonymous review submission is an actor ownership bypass — the canonical review security chain requires session + actor ownership proof; (2) If a service role is used to write anonymous reviews, the ownership chain is broken; (3) If ghost actors are created, an attacker can submit unlimited fabricated reviews for any VPORT by repeatedly calling the Edge Function without rate limiting; (4) The existing 9 Tripoint reviews were submitted under the standalone system — migrating them to `vc.vport_reviews` will create reviews without a valid `reviewer_actor_id`, which may break the VCSM reviews engine invariants
- **Severity:** LOW
- **Exploitability:** LOW — not currently implemented; risk is in future implementation design
- **Attack Preconditions:** Build of the anonymous review submission Edge Function without proper rate limiting and VPORT-scoping
- **Blast Radius:** All VCSM VPORT reviews if ghost actor pattern is implemented without rate limiting
- **Identity Leak Type:** None currently
- **Cache Trust Type:** None
- **RLS Dependency:** REQUIRED — reviews security chain must be preserved; anonymous review submission requires explicit architectural decision
- **Why it matters:** Review authenticity is a core trust signal. Any implementation that allows unauthenticated review submission bypasses the three-layer security chain (`require_authenticated` → `is_actor_owner` → `validate_target_actor_is_active_vport`). A poorly designed anonymous submission path enables fake review flooding.
- **Recommended mitigation:** (1) Do not implement anonymous review submission without explicit architectural review; (2) The recommended approach is to require VCSM account creation for review submission on the external site; (3) If anonymous reviews must be supported, implement: strict rate limiting per IP (1 review per 24h), CAPTCHA, and a separate unverified review queue requiring owner approval before display; (4) The 9 legacy Tripoint reviews should be migrated with `verification_status = 'unverified'` and not attributed to a VCSM actor — add a migration note documenting their legacy origin
- **Rationale:** The VCSM review security model is designed around actor ownership. Bypassing this for convenience on the external site weakens the trust model for all VPORTs, not just Tripoint.
- **Follow-up command:** Wolverine (architectural decision on anonymous review submission), DB (review migration plan for legacy Tripoint reviews)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security and Risk Management

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-011
- **Location:** All Edge Functions; Logan spec: Section 6 (Option B — no rate limiting mentioned)
- **Application Scope:** VCSM
- **Platform Surface:** Edge Function
- **Trust Boundary:** External API Consumer
- **Boundary Violated:** None — gap in spec; not yet implemented
- **Contract Violated:** External API Contract
- **Current behavior:** No rate limiting is defined or implemented for any VCSM Edge Function. The `send-lead-confirmation` function has no per-IP or per-email rate limit. The spec does not mention rate limiting for the external VPORT API (Option B). The Logan spec notes "No rate limiting per external domain" as a weakness of Option A, implying Option B should address this — but no concrete mechanism is specified.
- **Risk:** (1) `send-lead-confirmation` can be called at unlimited rate, exhausting AWS SES quotas and potentially triggering SES blacklisting; (2) The future external VPORT API has no planned rate limiting, enabling aggressive polling that could impact VCSM Supabase read performance; (3) Without rate limiting, the external site cannot be distinguished from an automated scraper
- **Severity:** LOW
- **Exploitability:** MEDIUM — SES quota exhaustion requires sustained attack; VPORT API scraping is trivial
- **Attack Preconditions:** Network access to the Edge Function URL (no auth required for OPTIONS; Bearer token check is weak for send-lead-confirmation as the anon key is public)
- **Blast Radius:** AWS SES account, VCSM Supabase read capacity
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — rate limiting is a network-layer control
- **Why it matters:** Rate limiting is essential for any public-facing API. Without it, the external VPORT API becomes a potential vector for denial-of-service against VCSM's Supabase plan limits.
- **Recommended mitigation:** (1) Implement Supabase Edge Function rate limiting using Deno KV or an upstream API gateway; (2) For `send-lead-confirmation`, add per-email rate limiting (1 confirmation per 15 minutes per email); (3) For the external VPORT API (Option B), implement per-domain rate limiting and consider cache headers (`Cache-Control: public, max-age=300`) to reduce origin hits; (4) Document rate limits in the external API contract
- **Rationale:** Cache headers are the lowest-friction rate limiting mechanism for public read APIs — they push repeat requests to CDN or browser cache rather than hitting the Edge Function every time.
- **Follow-up command:** Wolverine (design rate limiting for Edge Functions)
- **CISSP Domain:**
  - Primary: Communication and Network Security
  - Secondary: Security Operations, Security and Risk Management

---

## VENOM SECURITY FINDING

- **Finding ID:** VENOM-TRIPOINT-012
- **Location:** `apps/WT/mine-transfer/src/features/dashboard/tripoint/` — entire directory
- **Application Scope:** VCSM (WT workspace)
- **Platform Surface:** External Website API (internal monitor, not external)
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** None — WT workspace is internal transfer, but raises a structural concern
- **Contract Violated:** None directly
- **Current behavior:** The WT transfer workspace (`apps/WT/`) contains a Tripoint monitor dashboard (`TripointProduct.view.jsx`, `TripointMonitorDetail.view.jsx`) that reads `public.tripoint_emails`, `public.tripoint_reviews`, `public.tripoint_footer_clicks`, and `metrics.events`. This code exists in `apps/WT/` which is classified as "internal transfer workspace — never deploy." The dashboard reads are authenticated (requires Supabase session). However, the lead detail view renders `lead.email` (email addresses) and `lead.consent` status directly in the UI with no masking. The review detail view renders reviewer `first_name`, `last_name`, `location`, and review `text` without any PII masking.
- **Risk:** (1) If the WT dashboard were accidentally deployed, unmasked PII (email addresses, reviewer names, IP-derived locations) would be visible to any authenticated user, not just the VPORT owner; (2) The WT code has no VPORT owner gate — any authenticated user who can access the dashboard route would see all Tripoint email subscribers; (3) No VPORT ownership check exists in the controller (`loadTripointMonitor`) or DAL — it simply reads all tripoint_ table rows
- **Severity:** LOW
- **Exploitability:** LOW — WT code is not deployed; risk is conditional on accidental deployment
- **Attack Preconditions:** Accidental deployment of WT workspace; authenticated VCSM account
- **Blast Radius:** All Tripoint lead capture subscribers (5 email records), all review authors (9 records)
- **Identity Leak Type:** Private contact exposure (email addresses, reviewer names visible without owner gate)
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — reads rely on current Supabase session; no VPORT ownership verification in controller
- **Why it matters:** When this monitor dashboard is migrated from WT to the VCSM app, the missing VPORT ownership gate must be added before deployment. As-is, the code would allow any authenticated Citizen to view Tripoint's customer email list and review authors.
- **Recommended mitigation:** (1) Before migrating this code from WT to VCSM: add a VPORT ownership check to `loadTripointMonitor` controller — verify the calling actor is the VPORT owner; (2) Mask email addresses in the lead detail view (show first 3 chars + domain: `jon***@gmail.com`); (3) Add `TO authenticated WITH CHECK (actor_can_manage_profile(profile_id))` scoping to any dashboard read queries; (4) Track this as a prerequisite before the WT → VCSM migration
- **Rationale:** Owner-only data must be gated behind owner verification at the controller layer, not just at the authentication layer.
- **Follow-up command:** Wolverine (add ownership gate before WT → VCSM migration), DB (verify public.tripoint_emails SELECT policy)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Asset Security, Software Development Security

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VENOM-TRIPOINT-000 | Implementation not found — live access method unknown | Documentation, Edge Function | P0 | App + Security | DEADPOOL, Wolverine |
| VENOM-TRIPOINT-001 | Supabase anon key + actorId exposed if Option A is live | Edge Function, Router | P0 | App | Wolverine, DB |
| VENOM-TRIPOINT-002 | Wildcard CORS on all Edge Functions | Edge Function | P0 | App | Wolverine |
| VENOM-TRIPOINT-003 | actorId (internal UUID) in public API URLs | Edge Function, Router, Documentation | P0 | App + Security | LOGAN, Wolverine |
| VENOM-TRIPOINT-004 | Review read requires auth — no safe anon path defined | DB, Edge Function | P1 | DB + App | Carnage, DB |
| VENOM-TRIPOINT-005 | Locksmith table RLS SELECT policies unverified | RLS | P1 | DB | DB, Carnage |
| VENOM-TRIPOINT-006 | No VPORT lifecycle propagation to external site | Edge Function, Documentation | P1 | App + Documentation | LOGAN, Wolverine |
| VENOM-TRIPOINT-007 | PII in tripoint_emails world-readable (SELECT policy unknown) | RLS | P1 | DB | DB, Carnage |
| VENOM-TRIPOINT-008 | Unapproved reviews and reviewer emails world-readable | RLS | P1 | DB | DB, Carnage |
| VENOM-TRIPOINT-009 | Visitor IP and GPS in tripoint_footer_clicks world-readable | RLS | P1 | DB | DB |
| VENOM-TRIPOINT-010 | Anonymous review submission bypasses actor ownership chain | Controller, Edge Function, Documentation | P2 | App | Wolverine, DB |
| VENOM-TRIPOINT-011 | No rate limiting on Edge Functions | Edge Function | P2 | App | Wolverine |
| VENOM-TRIPOINT-012 | WT monitor lacks VPORT ownership gate; PII unmasked | Controller, UI | P2 | App | Wolverine |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 3 | TRIPOINT-006, TRIPOINT-007 (secondary), TRIPOINT-010 (secondary), TRIPOINT-011 (secondary) — governance gaps: lifecycle contract, anonymous review policy |
| Asset Security | 5 | TRIPOINT-003, TRIPOINT-007, TRIPOINT-008, TRIPOINT-009, TRIPOINT-012 — PII exposure in three public.tripoint_* tables; actorId in public URLs |
| Security Architecture and Engineering | 5 | TRIPOINT-000, TRIPOINT-001, TRIPOINT-002, TRIPOINT-005, TRIPOINT-006 — no Edge Function built; Option A design flaw; locksmith RLS gap |
| Communication and Network Security | 4 | TRIPOINT-001, TRIPOINT-002, TRIPOINT-003, TRIPOINT-011 — wildcard CORS; anon key exposure; no rate limiting |
| Identity and Access Management | 4 | TRIPOINT-001, TRIPOINT-004, TRIPOINT-010, TRIPOINT-012 — anon key; reviews require auth; anonymous reviews bypass actor ownership; owner gate missing |
| Security Assessment and Testing | 1 | TRIPOINT-000 — no auditable implementation found; no test coverage possible |
| Security Operations | 2 | TRIPOINT-006, TRIPOINT-008 — no lifecycle monitoring; unapproved review content visible |
| Software Development Security | 3 | TRIPOINT-002, TRIPOINT-004, TRIPOINT-010 — wildcard CORS coding pattern; service role misuse risk; anonymous review design |

**Total finding references across domains:** 27 (findings count multiple domains)

**Uncovered CISSP domains:** None — all 8 domains were addressed by findings in this module.

**Domain with most risk concentration:** Asset Security (5 findings) — the tripoint public.* tables contain PII fields with insufficient SELECT policy controls. This is the most immediately actionable risk cluster.

**Highest severity cluster:** TRIPOINT-000 through TRIPOINT-003 form a contiguous HIGH-severity block. All four must be addressed before the external API is expanded or Option A access (if live) is continued.

---

## AUDIT NOTES

1. **Scope boundary:** This audit is VCSM-scoped. The Tripoint external site (`tripointlockandkeys.com`) is outside this workspace and was not inspected. VENOM-TRIPOINT-000 flags that it must be inspected as a next step.

2. **WT workspace finding:** VENOM-TRIPOINT-012 covers `apps/WT/` code. WT is a transfer workspace, not a deployed product. The finding is LOW severity because the code is not in production. It becomes a prerequisite gate for the WT → VCSM migration.

3. **Positive findings:** The `reviews.upsert_neutral_review` three-layer security chain is correctly implemented and verified. The `vport.read_business_card_public` RPC correctly filters `is_active = true AND is_deleted = false`. The `vport.actor_can_manage_profile` legacy branch cleanup (TRIPOINT-000 context) removes a stale ownership risk. These are existing strengths the external API should build upon.

4. **Priority order:** P0 items (TRIPOINT-000, 001, 002, 003) are prerequisite to building Option B. They must be resolved first. P1 items (004-009) are DB-layer fixes that can be done in parallel with Option B development. P2 items (010-012) are architectural decisions and hardening that follow P1.

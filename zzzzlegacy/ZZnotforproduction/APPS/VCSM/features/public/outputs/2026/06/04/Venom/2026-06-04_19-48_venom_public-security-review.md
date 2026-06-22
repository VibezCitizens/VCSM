# VENOM V2 Security Review — public

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Report Time | 19:48 UTC |
| Feature | public |
| App | VCSM |
| VENOM Version | V2 |
| Reviewer | VENOM (automated + source-verified) |
| Output Path | ZZnotforproduction/APPS/VCSM/features/public/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_public-security-review.md |

---

## 2. Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                | Generated At             | Age  | Freshness | Confidence | Status |
|--------------------|--------------------------|------|-----------|------------|--------|
| write-surface-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map            | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map| 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map| 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs

| Input | Value |
|---|---|
| Scanner JSON | /tmp/venom_features/public.json |
| Write Surfaces | 4 |
| RPCs | 3 |
| Edge Functions | 1 |
| Security Paths | 8 |
| Write Execution Paths | 4 |
| RPC Execution Paths | 3 |

---

## 4. Security Surface Inventory

### Write Surfaces (4)

| # | Operation | Function | File | Confidence |
|---|---|---|---|---|
| 1 | RPC | `readBusinessCardSectionsDAL` → `get_business_card_sections` | vportBusinessCard/dal/businessCardSections.read.dal.js | HIGH |
| 2 | Edge Function | `sendLeadConfirmationEmailDAL` → `send-lead-confirmation` | vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js | HIGH |
| 3 | RPC | `readVportBusinessCardPublicBySlugDAL` → `read_business_card_public` | vportBusinessCard/dal/vportBusinessCard.read.dal.js | HIGH |
| 4 | RPC | `createVportBusinessCardLeadDAL` → `submit_business_card_lead` | vportBusinessCard/dal/vportBusinessCardLead.write.dal.js | HIGH |

### RPCs (3)

| # | RPC Name | Caller | File |
|---|---|---|---|
| 1 | `get_business_card_sections` | `readBusinessCardSectionsDAL` | businessCardSections.read.dal.js |
| 2 | `read_business_card_public` | `readVportBusinessCardPublicBySlugDAL` | vportBusinessCard.read.dal.js |
| 3 | `submit_business_card_lead` | `createVportBusinessCardLeadDAL` | vportBusinessCardLead.write.dal.js |

### Edge Functions (1)

| # | Function Name | Caller | File |
|---|---|---|---|
| 1 | `send-lead-confirmation` | `sendLeadConfirmationEmailDAL` | sendLeadConfirmationEmail.edge.dal.js |

### Scanner Note

All 8 security paths have route confidence LOW — the scanner detected write surfaces and RPCs without resolving them to a confirmed route execution path. This is expected for a public/unauthenticated feature: all surfaces are intentionally accessible without session context. Source inspection confirms the execution paths are: URL slug → Hook → Controller → DAL → RPC/EdgeFn.

**Additional source-discovered surfaces (not in scanner data, found via direct DAL enumeration):**

| Surface | DAL | RPC / Query |
|---|---|---|
| `resolveMenuSlugDAL` | vportMenu/dal/resolveMenuSlug.dal.js | `vport.public_menu_read_model_v` SELECT |
| `resolveVportSlugDAL` | vportMenu/dal/resolveVportSlug.dal.js | `vport.public_actor_seo_v` SELECT |
| `readVportPublicDetailsRpcDAL` | vportMenu/dal/readVportPublicDetails.rpc.dal.js | `vport.public_menu_read_model_v` + `vport.public_actor_seo_v` SELECT |
| `readVportPublicMenuRpcDAL` | vportMenu/dal/readVportPublicMenu.rpc.dal.js | `vport.public_menu_read_model_v` SELECT |
| `readPublicVportReviewsDAL` | vportMenu/dal/readPublicVportReviews.dal.js | `reviews.public_vport_reviews_v` SELECT |
| `readPublicVportReviewSummaryDAL` | vportMenu/dal/readPublicVportReviewSummary.dal.js | `reviews.public_vport_review_summary_v` SELECT |
| `readPublicVportReviewDimensionsDAL` | vportMenu/dal/readPublicVportReviewDimensions.dal.js | `reviews.public_vport_review_dimensions_v` SELECT |

All vportMenu surfaces use read-only queries against public view objects (views named `public_*`). No mutations found in vportMenu.

---

## 5. Scanner Signals

| Signal | Assessment |
|---|---|
| Route execution path confidence: LOW across all 8 paths | Expected — public feature is anonymous. Scanner cannot resolve anon route ownership. |
| All write surface confidence: HIGH | Confirmed via AST extraction. |
| Edge function invoker confirmed | `send-lead-confirmation` invoked directly from DAL via `supabase.functions.invoke`. |
| RPC `submit_business_card_lead` is a write operation | Confirmed — anonymous lead submission. SECURITY DEFINER enforcement must be on DB side. |

---

## 6. Behavior Contract Status

BEHAVIOR.md Status: **PLACEHOLDER — NO SECURITY RULES DEFINED**

The file at `ZZnotforproduction/APPS/VCSM/features/public/BEHAVIOR.md` contains only:

```
Status: PLACEHOLDER
Feature: public
Notes:
- Behavior contract pending source review.
```

There are **zero §5 Security Rules** and **zero §9 Must Never Happen invariants** in the contract.

This is a HIGH-severity governance gap. The public feature handles:
- Anonymous lead ingestion (PII: name, phone, email, message)
- Unauthenticated public profile data reads
- Email delivery to submitter-supplied addresses
- Notification dispatch to VPORT owner actors

None of these behaviors have written behavioral contracts or enforcement references.

Cross-check result: N/A (no contract rules to verify). See VEN-PUBLIC-006 below.

---

## 7. Trust Boundary Findings

---

### VEN-PUBLIC-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-PUBLIC-001
- Location: apps/VCSM/supabase/functions/send-lead-confirmation/index.ts:356-358
- Application Scope: VCSM
- Platform Surface: Edge Function (Supabase / AWS SES)
- Trust Boundary: Any HTTP client that knows the Supabase anon key (which is a public constant embedded in every frontend build)
- Boundary Violated: Email dispatch should require verified submission context — a public bearer check that accepts any "Bearer <anything>" is effectively no check at all when the key is publicly known
- Contract Violated: Trust Boundary integrity — bearer presence check without token validation
- Current behavior: The edge function requires only that the Authorization header starts with "Bearer ". The Supabase anon key is the expected token. Since the anon key is embedded in every VCSM frontend bundle (VITE_SUPABASE_ANON_KEY), any attacker who reads the JS source can craft unlimited direct POST requests to send-lead-confirmation with arbitrary target email addresses, names, and provider names — bypassing the lead form entirely.
- Risk: Bulk email spam / SES abuse. An attacker can send unlimited confirmation emails to arbitrary victims claiming any provider name, driving SES cost and causing reputational harm. No rate limiting or token validation exists in the function or the DAL layer.
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions: Attacker reads VITE_SUPABASE_ANON_KEY from the browser bundle (freely available in any VCSM page source), crafts direct POST to the edge function endpoint, supplies arbitrary email + providerName.
- Blast Radius: SES reputation damage, AWS SES cost amplification, victim inbox spam with VCSM branding, potential domain blacklisting.
- Identity Leak Type: None (attacker doesn't learn PII — they supply it)
- Cache Trust Type: None
- RLS Dependency: NONE (edge function does not query Supabase at all — it calls AWS SES directly)
- Why it matters: Unlimited email dispatch capability abusable by any reader of the public JS bundle. AWS SES sending reputation is a single shared resource for the entire platform. One abuse incident can blacklist vibezcitizens.com from major email providers.
- Recommended mitigation: Add server-side rate limiting keyed on recipient email + source IP inside the edge function (e.g., in-memory Map with sliding window, or a Supabase table for distributed rate limiting). Additionally validate that the bearer token is exactly the known anon key or a service role key — rejecting clearly invalid tokens. Consider moving email dispatch to a Supabase trigger/queue that runs after successful DB write of the lead row, removing the client-invokable surface entirely.
- Rationale: The current design gives every anonymous browser user (and every script that reads the public JS) direct access to an email-sending API with no rate or identity controls.
- Follow-up command: ELEKTRA
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Communications and Network Security, Software Development Security
```

---

### VEN-PUBLIC-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-PUBLIC-002
- Location: apps/VCSM/src/features/public/vportBusinessCard/hooks/useVportBusinessCardLeadForm.js:60-63
- Application Scope: VCSM
- Platform Surface: PWA (client-side browser)
- Trust Boundary: Anonymous public user — no session required
- Boundary Violated: User-agent string collected without disclosure; passed to the DB via p_user_agent
- Contract Violated: Data minimization / privacy by design — the public lead form copy says "No signup required" but silently collects navigator.userAgent
- Current behavior: The lead form hook reads navigator.userAgent unconditionally and passes it to submitVportBusinessCardLeadController → createVportBusinessCardLeadDAL → submit_business_card_lead RPC as p_user_agent. There is no disclosure to the submitter that their browser fingerprint is being stored.
- Risk: Undisclosed collection of browser fingerprint data from anonymous users. This creates legal exposure under GDPR, CCPA, and similar privacy regulations requiring informed consent for device fingerprint collection.
- Severity: MEDIUM
- Exploitability: LOW (attacker cannot exploit this — it is a compliance/privacy issue)
- Attack Preconditions: Any anonymous user submitting a lead form is affected without awareness.
- Blast Radius: Platform-wide legal exposure for undisclosed device fingerprint collection.
- Identity Leak Type: Browser fingerprint (user-agent string stored in DB against submitted PII)
- Cache Trust Type: None
- RLS Dependency: NONE (collection happens client-side before DB write)
- Why it matters: The lead form copy explicitly states "No signup required" positioning it as low-friction and privacy-respecting. Silently storing navigator.userAgent contradicts this positioning and may violate privacy regulations.
- Recommended mitigation: Either (a) disclose user-agent collection in the form UI, or (b) remove p_user_agent from the client-side DAL call and collect it server-side only (edge function or RPC can read it from request headers without client-side transmission). Option (b) is preferable as it removes client control of the value.
- Rationale: Server-side collection via request headers is more reliable and removes client-spoofability. Disclosure or removal resolves the compliance gap.
- Follow-up command: ELEKTRA
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

### VEN-PUBLIC-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-PUBLIC-003
- Location: apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js:38
- Application Scope: VCSM
- Platform Surface: PWA (notification dispatch — internal)
- Trust Boundary: VPORT owner notification
- Boundary Violated: Raw actorId exposed in a navigation link path constructed in the public feature controller
- Contract Violated: VCSM identity contract — raw UUIDs must never appear in public-facing URLs; "No raw IDs in public URLs" memory rule
- Current behavior: After a successful lead submission, fireLeadOwnerNotification constructs `linkPath: /actor/${recipientActorId}/dashboard/leads`. recipientActorId is the owner's actorId UUID returned by the submit_business_card_lead RPC. This link path is stored in the notifications system and will appear in the owner's notification feed (not in the public URL bar), but it does use a raw UUID as a path segment.
- Risk: The /actor/:actorId/dashboard route exposes the raw actor UUID in the browser URL bar when the VPORT owner navigates to their leads dashboard via the notification. Per VCSM memory rule "No raw IDs in public URLs", raw UUIDs must always use human-readable slugs. While this is an authenticated owner route (not public), the notification linkPath constructor lives in the public feature controller and establishes the pattern of using raw actorIds in navigation.
- Severity: MEDIUM
- Exploitability: LOW (path only visible to the authenticated owner navigating their own dashboard)
- Attack Preconditions: Owner receives notification and clicks through — their own actorId appears in the URL bar.
- Blast Radius: Owner actorId UUID exposed in browser URL/history, violates VCSM URL hygiene contract.
- Identity Leak Type: Actor UUID exposed in internal notification navigation path
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Violates the platform's URL hygiene contract. Owner dashboards accessed via notification links should use slug-based paths (/p/:slug/dashboard/leads or similar) rather than raw UUID paths.
- Recommended mitigation: Resolve the VPORT owner's slug from the lead submission result (the RPC should return actor_slug alongside actor_id) and construct the linkPath using the slug: `/p/${ownerSlug}/dashboard/leads`. If the slug is not returned by the RPC, fetch it or use a slug-based leads route.
- Rationale: Consistent with the VCSM memory rule prohibiting raw UUIDs in all URL surfaces, including notification deep-links.
- Follow-up command: SPIDER-MAN
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security and Risk Management
```

---

### VEN-PUBLIC-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-PUBLIC-004
- Location: apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js:19
- Application Scope: VCSM
- Platform Surface: Supabase Table/View (vport.public_menu_read_model_v)
- Trust Boundary: Anonymous public read — no session required
- Boundary Violated: Coordinates (lat, lng) fetched from DB and used internally — the DAL comment says they are "consumed internally" but the model's buildDirectionsUrl function constructs and returns a Google Maps URL containing the raw coordinates: `https://www.google.com/maps?q=${lat},${lng}`
- Contract Violated: Data minimization — precise GPS coordinates are fetched and embedded in an outbound URL that is returned in the public details payload as `directionsUrl`
- Current behavior: readVportPublicDetailsRpcDAL selects lat and lng from public_menu_read_model_v. In mapVportPublicDetailsRpcResult, buildDirectionsUrl() uses these to build `https://www.google.com/maps?q=${lat},${lng}`. This precise lat/lng URL is returned as `details.directionsUrl` and is accessible to any anonymous caller of useVportPublicDetails. The model comment "profile_id, lat, lng are not returned" is misleading — lat/lng are embedded in the returned directionsUrl string.
- Risk: Precise GPS coordinates of a business are exposed to any anonymous viewer via the directionsUrl field. This may not be intended — many businesses set lat/lng for internal navigation logic but prefer to show a city-level address on public pages rather than their exact coordinates.
- Severity: MEDIUM
- Exploitability: MEDIUM (any anonymous viewer can read directionsUrl from the rendered page state)
- Attack Preconditions: Anonymous access to any vport public menu page. directionsUrl is exposed through useVportPublicDetails → hook → view component.
- Blast Radius: Precise business coordinates accessible to all anonymous viewers of the public menu.
- Identity Leak Type: Geolocation (precise coordinates embedded in public-facing URL)
- Cache Trust Type: None (not cached — returned with every public details load)
- RLS Dependency: ASSUMED (view enforces public visibility, but view definition not verified here)
- Why it matters: Businesses may set lat/lng for display map purposes without intending to expose their exact GPS position to the public. The model comment is misleading, creating a false sense of security that coordinates are withheld.
- Recommended mitigation: Either (a) do not select lat/lng in the DAL (remove from SELECT list) and use only the address/location_text fields for buildDirectionsUrl, or (b) document explicitly that lat/lng are returned in directionsUrl and confirm this is intended business behavior. If lat/lng are needed for the directions URL, the comment at model line 207 must be corrected to reflect that they are embedded in the returned directionsUrl.
- Rationale: The current code has a misleading comment claiming coordinates are not returned when they are embedded in an outbound URL that is part of the public payload. This creates a maintenance hazard — future engineers will trust the comment rather than the behavior.
- Follow-up command: DB
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security and Risk Management
```

---

### VEN-PUBLIC-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-PUBLIC-005
- Location: apps/VCSM/src/features/public/vportMenu/model/vportPublicReviews.model.js:40-41
           apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviews.dal.js:16
- Application Scope: VCSM
- Platform Surface: Supabase Table/View (reviews.public_vport_reviews_v)
- Trust Boundary: Anonymous public read — no session required
- Boundary Violated: Internal actorIds (authorActorId, targetActorId) are selected from the reviews view and returned in the normalized model output, making them accessible to any anonymous page viewer.
- Contract Violated: VCSM identity contract — actorId is a canonical internal identity field that should not be exposed on unauthenticated public surfaces.
- Current behavior: readPublicVportReviewsDAL selects `author_actor_id` and `target_actor_id` from reviews.public_vport_reviews_v. normalizePublicReviewCard() maps these directly to `authorActorId` and `targetActorId` in the returned review card model. These fields are present in every review object returned through useVportPublicReviews → VportPublicReviewsPanel → VportPublicReviewCard. While VportPublicReviewCard does not render these values in the DOM, they are present in the React state tree and readable from React DevTools or any JS that accesses the hook's return value.
- Risk: Internal actor UUIDs of all reviewers and VPORT owners are exposed in the client-side JS state on all public review pages. This enables actor enumeration by anyone viewing a public review page.
- Severity: MEDIUM
- Exploitability: MEDIUM (requires React DevTools or runtime JS access — not directly in the DOM, but trivially accessible in dev builds and by any browser extension)
- Attack Preconditions: Anonymous access to any public reviews page + browser DevTools or React DevTools extension.
- Blast Radius: Actor UUID enumeration for all reviewers of any public VPORT.
- Identity Leak Type: Actor UUID enumeration via client-side state
- Cache Trust Type: None
- RLS Dependency: ASSUMED (view enforces public visibility only for approved reviews)
- Why it matters: Actor UUIDs are internal identity keys used across the platform. Exposing them on public unauthenticated surfaces enables correlation attacks and actor enumeration. Public review surfaces should expose only display-name snapshots and opaque review IDs, not internal actor UUIDs.
- Recommended mitigation: Remove `author_actor_id` and `target_actor_id` from the SELECT list in readPublicVportReviewsDAL. Remove `authorActorId` and `targetActorId` from normalizePublicReviewCard(). The review card only needs: reviewId, overallRating, body, authorDisplayName, authorUsername (snapshot), authorAvatarUrl (snapshot), verificationStatus, reviewActivityAt. If actor identity is needed for future linking, use the snapshot username field, not the raw UUID.
- Rationale: Minimal data exposure is the right default for public anonymous surfaces. Actor UUIDs have no display value in the review card — their presence is a data over-fetch.
- Follow-up command: ELEKTRA
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Access Control
```

---

### VEN-PUBLIC-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-PUBLIC-006
- Location: ZZnotforproduction/APPS/VCSM/features/public/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Governance / Documentation
- Trust Boundary: N/A — governance finding
- Boundary Violated: Feature has no written security contract despite handling anonymous PII ingestion (name, phone, email, user-agent), email dispatch, and notification dispatch
- Contract Violated: VCSM behavior contract standard — all features must have §5 Security Rules and §9 Must Never Happen sections
- Current behavior: BEHAVIOR.md is a PLACEHOLDER with zero security rules. The feature processes: (1) anonymous PII submissions via lead forms, (2) outbound email to submitter-supplied addresses, (3) notification dispatch to VPORT owner actors, (4) public profile data reads including contact info. None of these behaviors have enforced behavioral invariants documented.
- Risk: Without a behavior contract, security rules cannot be regression-tested and future engineers have no authoritative reference for what MUST and MUST NOT happen in this feature.
- Severity: HIGH
- Exploitability: N/A — governance gap, not a runtime exploit
- Attack Preconditions: N/A
- Blast Radius: Feature-wide — all security decisions in the public feature are undocumented
- Identity Leak Type: None (documentation gap)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The public feature is the highest-traffic anonymous surface in VCSM. It handles PII, email dispatch, and notification dispatch without any written behavioral invariants. This is the foundation on which SPIDER-MAN tests and ELEKTRA patches must build — without it, regression coverage is blind.
- Recommended mitigation: Write BEHAVIOR.md §5 and §9 as a prerequisite to THOR eligibility. Minimum required invariants: (1) slug is always resolved server-side, never accepted from the caller; (2) profile_id is never returned to the public caller; (3) lead submission requires name + message + at least one contact method; (4) email dispatch is fire-and-forget and must never block lead submission; (5) notification linkPath must use slug-based URLs, not raw actorIds.
- Rationale: Behavior contracts are required by the VCSM governance standard. This feature is already identified as having no contract in the BLACKWIDOW sprint findings history.
- Follow-up command: SPIDER-MAN
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

| Surface | File | Auth Check | Ownership Check | Input Validation | Status |
|---|---|---|---|---|---|
| `submit_business_card_lead` RPC | vportBusinessCardLead.write.dal.js | SECURITY DEFINER (DB) | N/A (anonymous) | Controller validates name+message+contact | VERIFIED_SAFE |
| `read_business_card_public` RPC | vportBusinessCard.read.dal.js | Anon | N/A (public read) | slug trimmed/lowercased | VERIFIED_SAFE |
| `get_business_card_sections` RPC | businessCardSections.read.dal.js | Anon | profile_id derived server-side from slug (controller line 122-125) | profileId guard at DAL line 4 | VERIFIED_SAFE |
| `send-lead-confirmation` Edge Function | sendLeadConfirmationEmail.edge.dal.js | Bearer presence only (VEN-PUBLIC-001) | N/A | email normalized, HTML escaped, URL validated | FINDING: VEN-PUBLIC-001 |
| `vport.public_menu_read_model_v` SELECT | readVportPublicDetails.rpc.dal.js | Anon | N/A (public view) | actorId guard | lat/lng embedded in output — VEN-PUBLIC-004 |
| `vport.public_menu_read_model_v` SELECT | readVportPublicMenu.rpc.dal.js | Anon | N/A (public view) | actorId guard | VERIFIED_SAFE |
| `vport.public_menu_read_model_v` SELECT | resolveMenuSlug.dal.js | Anon | N/A (public view) | slug trimmed/lowercased | VERIFIED_SAFE |
| `vport.public_actor_seo_v` SELECT | resolveVportSlug.dal.js | Anon | N/A (public view) | slug trimmed/lowercased | VERIFIED_SAFE |
| `reviews.public_vport_reviews_v` SELECT | readPublicVportReviews.dal.js | Anon | N/A (public view) | targetActorId guard | author_actor_id exposed — VEN-PUBLIC-005 |
| `reviews.public_vport_review_summary_v` SELECT | readPublicVportReviewSummary.dal.js | Anon | N/A | targetActorId guard | VERIFIED_SAFE |
| `reviews.public_vport_review_dimensions_v` SELECT | readPublicVportReviewDimensions.dal.js | Anon | N/A | targetActorId guard | VERIFIED_SAFE |

### Key Verified-Safe Patterns

1. **profile_id server-side resolution** (VEN-PUBLIC-002 comment in controller line 122): `getVportBusinessCardSectionsController` correctly resolves profileId server-side from the slug via RPC — the public caller never supplies a profileId directly. VERIFIED at controller:122-125.

2. **slug normalization**: All slug inputs are trimmed and lowercased at both the hook layer (useVportBusinessCardExperience, useResolveMenuSlug, useResolveVportSlug) and the controller/DAL layer. Double normalization is defensive and correct.

3. **profile_id excluded from mapVportPublicDetailsRpcResult output**: model:207 comment + confirmed absence from the return block at model:191-209.

4. **HTML escaping in email template**: escapeHtml() applied to displayName and provider before embedding in HTML email body (index.ts:46-53).

5. **URL validation in model**: toSafeUrl() validates all URL fields against http/https protocol before inclusion in public payload.

---

## 9. Confidence Summary

| Finding | Evidence | Confidence |
|---|---|---|
| VEN-PUBLIC-001 | Read index.ts:356-358; no rate limit found in function body; anon key in supabaseClient.js confirmed public | HIGH |
| VEN-PUBLIC-002 | Read useVportBusinessCardLeadForm.js:60-63; no disclosure found in view or form component | HIGH |
| VEN-PUBLIC-003 | Read controller.js:38; linkPath uses raw actorId UUID; VCSM memory rule confirmed | HIGH |
| VEN-PUBLIC-004 | Read readVportPublicDetails.rpc.dal.js:19 (select includes lat,lng) + model:88-91 (buildDirectionsUrl embeds them in returned URL) | HIGH |
| VEN-PUBLIC-005 | Read readPublicVportReviews.dal.js:16 (selects author_actor_id, target_actor_id) + vportPublicReviews.model.js:40-41 (returned in model) | HIGH |
| VEN-PUBLIC-006 | Read BEHAVIOR.md: confirmed PLACEHOLDER status with zero security rules | HIGH |

---

## 10. THOR Impact

| Assessment | Detail |
|---|---|
| THOR Release Blocker | YES — VEN-PUBLIC-001 (HIGH) and VEN-PUBLIC-006 (HIGH) |
| VEN-PUBLIC-001 | HIGH: Email abuse via unauthenticated SES surface. THOR blocker. |
| VEN-PUBLIC-002 | MEDIUM: Undisclosed user-agent collection. THOR conditional (disclosure or removal required). |
| VEN-PUBLIC-003 | MEDIUM: Raw actorId in notification linkPath. THOR conditional. |
| VEN-PUBLIC-004 | MEDIUM: Precise GPS coordinates in public directionsUrl. THOR conditional. |
| VEN-PUBLIC-005 | MEDIUM: Actor UUID enumeration via public review state. THOR conditional. |
| VEN-PUBLIC-006 | HIGH: Missing behavior contract. THOR blocker (blocks regression test coverage). |

THOR eligibility: **BLOCKED** until VEN-PUBLIC-001 and VEN-PUBLIC-006 are resolved.

---

## 11. Required Follow-Up Commands

| Command | Scope | Reason |
|---|---|---|
| ELEKTRA | VEN-PUBLIC-001 | Trace SES abuse vector; propose rate limiting implementation in edge function |
| ELEKTRA | VEN-PUBLIC-002 | Review user-agent handling; propose server-side collection alternative |
| ELEKTRA | VEN-PUBLIC-005 | Propose minimal SELECT list for public reviews DAL |
| SPIDER-MAN | VEN-PUBLIC-003 | Add regression test: notification linkPath must not contain raw UUIDs |
| SPIDER-MAN | VEN-PUBLIC-006 | Requires BEHAVIOR.md §5 and §9 to be written first; then test coverage for all invariants |
| DB | VEN-PUBLIC-004 | Confirm whether lat/lng in public_menu_read_model_v is intentionally public; advise on view column exposure |

---

## 12. Mitigation Plan

| Finding ID | Severity | Owner Layer | Action | Effort |
|---|---|---|---|---|
| VEN-PUBLIC-001 | HIGH | Edge Function | Add in-function rate limiting (recipient email + IP sliding window) and/or move email dispatch to DB-triggered queue | HIGH |
| VEN-PUBLIC-006 | HIGH | Documentation | Write BEHAVIOR.md §5 Security Rules + §9 Must Never Happen | MEDIUM |
| VEN-PUBLIC-002 | MEDIUM | Hook + DAL | Move user-agent collection to server side (edge function reads from request headers); remove from client DAL call | LOW |
| VEN-PUBLIC-003 | MEDIUM | Controller | Resolve VPORT owner slug from RPC result; use slug-based linkPath in notification dispatch | LOW |
| VEN-PUBLIC-004 | MEDIUM | DAL + Model | Remove lat/lng from SELECT list in readVportPublicDetails.rpc.dal.js; fix misleading comment in model:207 | LOW |
| VEN-PUBLIC-005 | MEDIUM | DAL + Model | Remove author_actor_id and target_actor_id from reviews SELECT and normalizePublicReviewCard model | LOW |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings |
|---|---|
| Access Control | VEN-PUBLIC-001 (bearer-only edge function), VEN-PUBLIC-005 (actor UUID exposure) |
| Communications and Network Security | VEN-PUBLIC-001 (SES abuse via public endpoint) |
| Software Development Security | VEN-PUBLIC-001, VEN-PUBLIC-002, VEN-PUBLIC-003, VEN-PUBLIC-004, VEN-PUBLIC-005 |
| Security and Risk Management | VEN-PUBLIC-002 (privacy/compliance), VEN-PUBLIC-003 (URL hygiene), VEN-PUBLIC-004 (geolocation), VEN-PUBLIC-006 (governance gap) |
| Identity and Access Management | VEN-PUBLIC-003 (raw UUID in linkPath), VEN-PUBLIC-005 (actor enumeration) |

---

_VENOM V2 — public feature — 2026-06-04 — 6 findings (0 CRITICAL, 2 HIGH, 4 MEDIUM, 0 LOW)_

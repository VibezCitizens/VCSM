---
# public — SECURITY.md
# Last Updated: 2026-06-02
# Ticket: TICKET-PUBLIC-VENOM-001-PATCH
# Status: CURRENT SOURCE OF TRUTH

Security posture for the public feature. First full scoped VENOM pass completed 2026-06-02
(TICKET-PUBLIC-VENOM-001). P1 patches applied 2026-06-02 (TICKET-PUBLIC-VENOM-001-PATCH).

---

## Command Coverage

| Command | Status | Last Run |
|---|---|---|
| VENOM | COMPLETE — first full scoped pass (19 findings) | 2026-06-02 |
| ELEKTRA | COMPLETE — edge functions + RPC + post-patch verification (4 findings, 2 FP rejected) | 2026-06-02 |
| BLACKWIDOW | NOT RUN | NEVER |
| SENTRY | NOT RUN | NEVER |
| THOR | BLOCKED — ELEK-2026-06-02-001 (HIGH) is release blocker | NEVER |

---

## Security Posture Summary

**Overall:** ACTIVE — VENOM + ELEKTRA complete; P1 patches applied; HIGH open finding remains
**Highest Open Severity:** HIGH (ELEK-2026-06-02-001 — SES anon key abuse)
**THOR Blocker State:** BLOCKED — ELEK-2026-06-02-001 (SES abuse) + PUBLIC-003 (VL-001–005 migration pending)
**ELEK-027-001 (wildcard CORS):** RESOLVED per source inspection — all 5 edge functions have proper CORS
**Structural Finding:** Both features/public/vportMenu/ and features/public/vportBusinessCard/ are unauthenticated high-traffic surfaces. ELEK and BLACKWIDOW have not run.

---

## Write Surface Risk Assessment

| Surface | Write Type | Ownership Gate | Risk |
|---|---|---|---|
| public/vportBusinessCard/controller/ | PROFILE_MUTATION | NONE | HIGH |
| public/vportMenu/controller/ | MENU_WRITE | NONE | HIGH |

Auth gate status: NO — public surface. Zero-auth write paths confirmed by metadata (GAP-008).

---

## Findings

### OPEN

**ELEK-2026-06-02-001 | HIGH | OPEN — ELEKTRA 2026-06-02**
Unauthenticated SES email abuse via send-lead-confirmation. Anon key (publicly distributed in app bundle) is sufficient to trigger SES delivery to any email address. Bearer token check (line 357) only validates format, not identity. No rate limiting. Provider name caller-controlled. No binding of toEmail to an authenticated session.
Evidence: `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts:354-421`
Next action: Add userClient.auth.getUser() verification, OR move email delivery to a PostgreSQL trigger.

**ELEK-2026-06-02-002 | MEDIUM | OPEN — ELEKTRA 2026-06-02**
send-citizen-invite O(n) full user table scan + email enumeration oracle. adminClient.auth.admin.listUsers() fetches ALL users (line 269) then filters client-side. Response code USER_ALREADY_REGISTERED leaks registration status. invite_code returned in response body enables caller to bypass email delivery.
Evidence: `apps/VCSM/supabase/functions/send-citizen-invite/index.ts:269-280, 492`
Next action: Replace listUsers() with check_email_registered(p_email) SECURITY DEFINER RPC. Remove enumeration response code.

**ELEK-2026-06-02-003 | MEDIUM | OPEN — ELEKTRA 2026-06-02**
DB-level vport.read_business_card_public RPC still returns profile_id despite app-layer patch (PUBLIC-001/002). Non-browser callers with anon key can obtain profile_id and call get_business_card_sections(p_profile_id) directly. App-layer patch is correct but DB-layer is the root exposure.
Evidence: `apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCard.read.dal.js:7`
Next action: CARNAGE — remove profile_id from RPC output column list.

**ELEK-2026-05-27-001 | HIGH | RESOLVED (source inspection 2026-06-02)**
Wildcard CORS on all 5 edge functions. Source inspection confirms all 5 functions have proper CORS validation — no wildcard Access-Control-Allow-Origin in current source. Prior finding reflected a historical state. Functions were patched on current branch. Deployment config audit recommended: verify ALLOWED_ORIGINS env var is not set to wildcard in production.
Evidence: `apps/VCSM/supabase/functions/send-lead-confirmation/index.ts:18-35` (getAllowedOrigins function)

**ELEK-2026-05-28-007 | HIGH | RESOLVED (source inspection 2026-06-02)**
deleteVportActorMenuCategoryController confirmed to have assertActorOwnsVportActorController present in source on branch vport-booking-feed-security-updates. Controller files listed as modified on current branch — gate was applied. DB-level RLS verification still required (see PUBLIC-007 below).
Evidence: `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js`

**ELEK-2026-05-28-008 | HIGH | RESOLVED (source inspection 2026-06-02)**
deleteVportActorMenuItemController confirmed to have assertActorOwnsVportActorController present in source on branch vport-booking-feed-security-updates. Controller files listed as modified on current branch — gate was applied. DB-level RLS verification still required (see PUBLIC-007 below).
Evidence: `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItem.controller.js`

**ELEK-2026-05-27-004 | MEDIUM | OPEN**
send-lead-confirmation accepts publicly-known anon key as sufficient auth to trigger SES email delivery. Any caller with the public anon key can send confirmation emails to arbitrary addresses via VCSM's SES infrastructure.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_20-00_elektra_external-site.md`

**ELEK-2026-05-27-LOW | LOW | OPEN**
send-push-notification stub publicly reachable with wildcard CORS and no auth gate. Security requirement exists only as a code comment, not enforced.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_20-00_elektra_external-site.md`

**VL-001 through VL-005 | MIXED | OPEN — migration PENDING**
vport.business_card_leads INSERT policies are permissive (should be false/blocking). Full-row UPDATE grant instead of column-scoped. Legacy RPC Overload 1 (submit_business_card_lead) has GRANT EXECUTE TO PUBLIC, no availability guard, and actor_id = NULL hardcoded. Missing source column CHECK constraint. Migration plan authored but NOT YET EXECUTED.
Evidence: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-24_carnage_vport-business-card-leads-security-hardening.md`

**VENOM-CONTENT-005 | MEDIUM | OPEN (DB-blocked)**
is_indexable filter inconsistency between DAL and public RLS policies. Public content may appear in DAL results that the DB RLS would otherwise exclude. Awaiting DB-level resolution.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_thor_content-pages-delete-lifecycle-security-gate.md`

**VENOM-DELETE-004 | MEDIUM | OPEN**
Cache invalidation dead code — never called on delete. Stale public content served for up to 10 minutes after deletion.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_thor_content-pages-delete-lifecycle-security-gate.md`

**F-12 | MEDIUM | OPEN**
joinInvite RESOURCE_COLS returns profile_id in public/semi-public read path. Join token distributed via QR/SMS — effectively semi-public endpoint exposes internal profile_id identifier.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_00-00_venom_vcsm-full-deep-scan.md`

**VF-001 | HIGH | OPEN**
Raw UUID actorId in public URL /profile/:actorId — internal identifier exposed in public-facing URL in profiles feature. Violates no-raw-IDs-in-public-URLs rule.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-22_venom_profiles-trust-boundaries.md`

**VBR-02 | MEDIUM | OPEN**
vport_id (internal UUID) returned in public barber VPORT profile response. Identity surface rule violation.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_barber-vport.md`

**VBR-03 | MEDIUM | OPEN**
Public calendar reads (vport.availability_rules + vport.bookings) not gated behind auth for confirmation step. RLS not confirmed for public future-slot-only reads.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_barber-vport.md`

**BOOKINGS {public} RLS GOVERNANCE | MEDIUM | OPEN (deferred)**
Four UPDATE policies and one SELECT policy on vport.bookings use {public} role instead of {authenticated}. Bypasses PostgREST role-based enforcement. SECURITY DEFINER guards prevent immediate exploit but pattern is non-compliant.
Evidence: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-27_carnage_ticket-0005-bookings-select-rls-verification.md`

**VL-07 | MEDIUM | OPEN**
vport_id and is_deleted returned in public locksmith profile response. Identity surface rule violation.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_locksmith-vport.md`

**AUTH-002 | HIGH | OPEN**
ActorModel leaks profileId on public output. Model output reaches hook state and potentially component renders in violation of identity contract. profileId must never appear on public surfaces.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-11_venom_auth-login-trust-boundaries.md`

---

### OPEN — FROM VENOM PASS 2026-06-02 (TICKET-PUBLIC-VENOM-001)

**PUBLIC-003 | HIGH | OPEN — CARNAGE REQUIRED**
VL-001–005: submit_business_card_lead RPC has GRANT EXECUTE TO PUBLIC. Any unauthenticated caller can submit leads. INSERT policies permissive. Legacy overload 1 hardcodes actor_id = NULL. Full-row UPDATE grant. Missing source CHECK constraint. Migration plan authored 2026-05-24, NOT EXECUTED.
Evidence: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-24_carnage_vport-business-card-leads-security-hardening.md`
Next action: CARNAGE execute migration plan.

**PUBLIC-005 | HIGH | OPEN — PARTIALLY MITIGATED**
/m/:actorId legacy route exposed raw actorId in public URL. MITIGATED: VportMenuRedirect.jsx now resolves actorId → slug and navigates to /profile/:slug/menu (TICKET-PUBLIC-VENOM-001-PATCH). The route /m/:actorId still exists for backward compat (existing QR codes) but the visible URL after redirect is now slug-based. The /actor/:actorId/menu fallback still exposes raw actorId — a separate ticket is needed to fully retire this legacy route.
Evidence: `apps/VCSM/src/app/routes/public/vportMenu.routes.jsx`

**ELEK-2026-06-02-004 | LOW | OPEN — ELEKTRA 2026-06-02**
reverse-geocode lat/lon query parameters not URL-encoded before Nominatim URL construction. Parameter injection possible (e.g., lat=1.0&format=xml overrides format param). Impact limited to Nominatim API behavior — cannot redirect to internal resources. search parameter IS correctly encoded (encodeURIComponent applied).
Evidence: `apps/VCSM/supabase/functions/reverse-geocode/index.ts:110-116`
Next action: Apply encodeURIComponent(lat) and encodeURIComponent(lon). Add numeric range validation.

**PUBLIC-006 | MEDIUM | OPEN**
readVportPublicMenuRpcDAL returns menu_category_id and menu_item_id (internal UUIDs) to anonymous visitors. ID enumeration enables targeted attacks if DB RLS is insufficient.
Evidence: `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js`

**PUBLIC-007 | MEDIUM | OPEN — DB VERIFICATION REQUIRED**
deleteVportActorMenuCategoryDAL and deleteVportActorMenuItemDAL perform DELETE by id only with no actor filter. If DB RLS on vport.menu_categories and vport.menu_items lacks actor ownership enforcement, direct Supabase API calls bypass the controller gate. CARNAGE must verify DELETE policies on both tables.
Evidence: `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js`

**PUBLIC-008 | MEDIUM | OPEN — ELEKTRA REQUIRED**
send-lead-confirmation edge function accepts anon key as sufficient auth. Any caller can trigger SES delivery to arbitrary email addresses.
Evidence: `apps/VCSM/src/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js`

**PUBLIC-009 | MEDIUM | OPEN**
No rate limiting on submitVportBusinessCardLeadController. Unlimited lead spam possible.
Evidence: `apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js`

**PUBLIC-010 | MEDIUM | OPEN**
readVportPublicDetailsRpcDAL SELECT includes lat and lng (precise geolocation). Owner consent disclosure for coordinate exposure not confirmed in UI.
Evidence: `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js`

**PUBLIC-011 | MEDIUM | OPEN**
submitVportBusinessCardLeadController accepts caller-supplied vportName, providerProfileUrl, source from the caller. source stored in DB without allowlist validation. Caller can inject arbitrary values influencing confirmation email content.
Evidence: `apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js`

---

### RESOLVED — FROM VENOM PASS + PATCH 2026-06-02

**PUBLIC-001 | HIGH | RESOLVED (TICKET-PUBLIC-VENOM-001-PATCH 2026-06-02)**
mapVportBusinessCardPublicRow returned profileId: raw.profile_id ?? null to all public /card/:slug visitors. profileId is an internal UUID banned from public surfaces per VCSM identity contract.
Fix: profileId field removed from mapVportBusinessCardPublicRow return object.
Evidence: `apps/VCSM/src/features/public/vportBusinessCard/model/vportBusinessCard.model.js`

**PUBLIC-002 | HIGH | RESOLVED (TICKET-PUBLIC-VENOM-001-PATCH 2026-06-02)**
getVportBusinessCardSectionsController({ profileId }) accepted caller-supplied profileId on a PUBLIC_ZERO_AUTH surface and passed it directly to readBusinessCardSectionsDAL(profileId). Any visitor with a known profileId (extractable from PUBLIC-001) could enumerate business card sections for any VPORT.
Fix: Controller signature changed to { slug }. profileId now resolved server-side internally from slug via readVportBusinessCardPublicBySlugDAL. profileId is never accepted from or returned to the caller. Hook and view updated to pass slug.
Evidence: `apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js`

### RESOLVED

**ELEK-2026-05-27-002 | HIGH | RESOLVED (patched 2026-05-28)**
actor_id and profile_id exposed in both public content page DAL SELECT strings. Internal UUIDs returned to unauthenticated visitors on every public content page request. Fixed: fromPublicRow() applied to strip internal identifiers from public SELECT output.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_20-00_elektra_content-pages.md`

**V-AVAIL-01 | CRITICAL | RESOLVED (per THOR booking postfix release gate)**
Availability write path had no ownership gate. Any authenticated Citizen could overwrite any VPORT's availability_rules by supplying a known resourceId (enumerable from public VPORT profiles). Ownership gate added.
Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_thor_booking-availability-write-release-gate.md`

---

## Structural Audit Deficit

WARNING: No VENOM, ELEKTRA, or BLACKWIDOW audit has been run directly on either features/public/vportMenu/ or features/public/vportBusinessCard/. Both are unauthenticated high-traffic surfaces currently RELEASED with zero security audit coverage. All findings above are sourced from adjacent audits — the actual public feature surface has not been traced.

Canonical gap records:
- `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/TABS/modules/public-vport-menu/audit-status.md`
- `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/TABS/modules/public-vport-business-card/audit-status.md`

Recommended: Run VENOM + ELEKTRA scoped to features/public/ before any next release gate.

---

## History Index

| Date | Ticket | Security Event |
|---|---|---|
| 2026-05-10 | — | VENOM full deep scan — F-12, VBR-02, VBR-03, VL-07, AUTH-002 raised |
| 2026-05-14 | THOR gate | V-AVAIL-01 RESOLVED — availability write gate added |
| 2026-05-24 | CARNAGE | VL-001 through VL-005 — business_card_leads migration plan authored; not yet executed |
| 2026-05-27 | ELEKTRA | ELEK-2026-05-27-001/-004/-LOW — edge function CORS/auth findings raised |
| 2026-05-28 | ELEKTRA | ELEK-2026-05-27-002 RESOLVED — fromPublicRow() applied to content pages DAL |
| 2026-05-28 | ELEKTRA | ELEK-2026-05-28-007/-008 — menu delete ownership gate findings raised |
| 2026-06-02 | TICKET-DOCS-CLEANUP-001 | SECURITY.md seeded from adjacent audit evidence — full scoped audit PENDING |
---

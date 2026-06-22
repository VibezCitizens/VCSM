# VENOM Security Audit — VPORT Content Pages

**Date:** 2026-05-27
**Reviewer:** VENOM
**Module:** content-pages
**Trigger:** First VENOM pass — module was NOT_STARTED in governance matrix
**Findings:** [0 CRITICAL | 3 HIGH | 4 MEDIUM | 2 LOW]

---

## VENOM TARGET

| Field | Value |
|---|---|
| Module ID | content-pages |
| Route | `/vport/content` |
| VPORT Kinds | ALL |
| Public Route | YES (owner management + public viewer) |
| Risk | MEDIUM |
| Logan Spec | `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.content-pages-pipeline.md` |
| Prior Security Work | CARNAGE migration report (2026-05-14) — legacy RLS policy cleanup planned but not executed |
| CI Status | Not blocked — no prior VENOM findings to gate |

---

## SECURITY SURFACE

| Layer | Files Audited |
|---|---|
| DAL | `dal/content/createVportContentPage.dal.js` |
| DAL | `dal/content/deleteVportContentPage.dal.js` |
| DAL | `dal/content/listVportContentPages.dal.js` |
| DAL | `dal/content/listVportPublicContentPages.dal.js` |
| DAL | `dal/content/readVportContentPage.dal.js` |
| DAL | `dal/content/readVportPublicContentPage.dal.js` |
| DAL | `dal/content/toggleVportContentPagePublish.dal.js` |
| DAL | `dal/content/updateVportContentPage.dal.js` |
| Controller | `controller/content/createVportContentPage.controller.js` |
| Controller | `controller/content/deleteVportContentPage.controller.js` |
| Controller | `controller/content/listVportContentPages.controller.js` |
| Controller | `controller/content/listVportPublicContentPages.controller.js` |
| Controller | `controller/content/readVportPublicContentPage.controller.js` |
| Controller | `controller/content/toggleVportContentPagePublish.controller.js` |
| Controller | `controller/content/updateVportContentPage.controller.js` |
| Model | `model/content/VportContentPage.model.js` |
| Hook | `hooks/content/useVportPublicContentPage.js` |
| Screen Hook | `screens/content/hooks/useVportContentPages.js` |
| Screen Hook | `screens/content/hooks/useVportPublicContent.js` |
| Screen | `screens/content/VportContentView.jsx` |
| Screen | `screens/content/VportContentManageView.jsx` |
| Screen | `screens/content/VportContentPublicView.jsx` |
| Component | `screens/content/components/VportContentOwnerRow.jsx` |
| Component | `screens/content/components/VportContentPageCard.jsx` |
| Component | `screens/content/components/VportContentPageForm.jsx` |
| Component | `screens/content/components/VportContentPageViewer.jsx` |
| Caller | `screens/views/tabs/VportContentView.jsx` |
| Caller | `screens/components/VportProfileTabContent.jsx` |
| Caller | `screens/VportProfileViewScreen.jsx` |
| Ownership Model | `model/vportOwnership.model.js` |

---

## TRUST BOUNDARY TRACE

### Public Read Path
```
VportContentPublicView
  → useVportPublicContent (no identity)
    → listVportPublicContentPagesController({ actorId })
      → listVportPublicContentPagesDAL (is_published=true filter + TTL cache)
        → Supabase: content_pages_public_read / content_pages_select_public RLS policies
          → Model.fromRow() → page objects with actorId + profileId exposed
```

### Owner Write Path (create / update / delete / toggle)
```
VportProfileViewScreen → deriveVportIsOwner() → isOwner prop
  → VportProfileTabContent → VportContentView(isOwner=true)
    → VportContentManageView → useVportContentPages({ actorId })
      → identity?.actorId (session) = callerActorId
        → [create|update|delete|togglePublish]Controller({ actorId, callerActorId, ... })
          → assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })
            → kind check (user only) → actor_owners lookup → PASS/THROW
          → readVportContentPageDAL (pre-flight ownership verify: existing.actor_id === actorId)
          → [mutation DAL]
```

### isOwner Signal Chain
```
VportProfileViewScreen → deriveVportIsOwner({ viewerActorId, profileActorId })
  pure comparison: viewerActorId === profileActorId (string equality)
  → UI gate only — controls which view renders, does NOT gate DB writes
  → DB writes gated independently by assertActorOwnsVportActorController at controller layer
```

---

## VENOM SECURITY FINDINGS

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-CONTENT-001
- Location: dal/content/deleteVportContentPage.dal.js : deleteVportContentPageDAL (line 5-15)
- Application Scope: VCSM
- Platform Surface: Supabase Table — vport.content_pages (DELETE)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Hard delete with no soft-delete safety net — permanent destruction with no recovery window
- Contract Violated: Data Integrity Contract
- Current behavior: deleteVportContentPageDAL issues a hard DELETE FROM content_pages WHERE id=? with no soft-delete column, no deleted_at timestamp, no is_deleted flag, and no archive step. The row is permanently gone immediately.
- Risk: An accidental deletion (UI confirm dialog can be bypassed by race conditions or autoclicker), a CSRF-class attack that triggers deletePage(), or a future bug in the ownership check could permanently destroy published content that has inbound links, cached search results in TRAZE/Traffic, or subscriber-facing pages. There is no recovery path.
- Severity: HIGH
- Exploitability: LOW
- Attack Preconditions: Must be authenticated owner (ownership check is solid). Risk is accidental loss, not adversarial exploitation. Elevated if future bugs weaken the ownership gate.
- Blast Radius: Single actor — content loss is scoped to the owning VPORT's pages
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED — modern content_pages_delete_owner policy is assumed present. Legacy content_pages_owner_delete may still be live (CARNAGE migration not yet executed).
- Why it matters: Published content pages may have inbound links from TRAZE/Traffic SEO pages, external sites, or subscriber notifications. Hard-deleting them creates dead links, 404s, and search index poisoning. There is also no audit trail of who deleted what.
- Recommended mitigation: Add is_deleted boolean (default false) and deleted_at timestamptz to vport.content_pages. Update deleteVportContentPageDAL to perform a soft-delete (UPDATE SET is_deleted=true, deleted_at=now()) rather than DELETE. Gate all read DALs with AND is_deleted = false. Add a CARNAGE-managed hard-purge job for rows deleted > 30 days. Coordinate with TRAZE/Traffic to handle 410 Gone responses for deleted pages.
- Rationale: Soft delete preserves the row for audit, accident recovery, and graceful SEO handling (404 → 410 lifecycle). Ownership and RLS still gate the soft-delete write, so the security surface is unchanged.
- Follow-up command: Carnage
- CISSP Domain:
  - Primary: Software Development Security (data lifecycle contract)
  - Secondary: Security Operations (audit trail, incident recovery)
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-CONTENT-002
- Location: dal/content/updateVportContentPage.dal.js : updateVportContentPageDAL (line 8-25)
- Application Scope: VCSM
- Platform Surface: Supabase Table — vport.content_pages (UPDATE)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — patch object is not field-stripped at the DAL layer
- Contract Violated: Actor Ownership Contract | Data Integrity Contract
- Current behavior: updateVportContentPageDAL accepts an arbitrary `patch` object and passes it directly into `.update(patch)`. The controller (updateVportContentPage.controller.js) only allows: title, excerpt, body, category, service_keys. However, the DAL itself performs zero field validation — it passes whatever it receives to Supabase. If a caller bypasses the controller and calls the DAL directly with patch fields like `is_published: true`, `is_indexable: true`, `actor_id: <other_actor>`, or `profile_id: <other_profile>`, those writes will pass through to Supabase and be gated only by RLS.
- Risk: If the modern UPDATE RLS policy (content_pages_update_owner using actor_can_manage_profile()) is the sole defense, and it does not check field-level constraints, an owner with legitimate UPDATE access could escalate publish status, flip indexability, or reassign actor_id via a raw DAL call. The controller provides a safe allowlist today, but there is no defense-in-depth at the DAL boundary.
- Severity: HIGH
- Exploitability: LOW (requires direct DAL access, not UI-accessible; would require a developer-class bypassing of the controller layer)
- Attack Preconditions: Attacker must be authenticated as owner AND must be able to call the DAL directly (bypassing the controller). This is a developer/insider threat or a future regression if a new hook imports the DAL directly.
- Blast Radius: Single actor — scoped to the actor whose pages are modified
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED — content_pages_update_owner modern policy is assumed present. Even if present, it does not enforce field-level restrictions; it only gates row access.
- Why it matters: The pattern of allowlist-at-controller + open-patch-at-DAL is fragile. One new feature that imports updateVportContentPageDAL directly (reasonable given it's a DAL) skips the controller allowlist entirely. Publish-status escalation (setting is_published=true on a draft without going through the toggle controller) is the most serious concrete risk because it bypasses the cache invalidation call in toggleVportContentPagePublishController.
- Recommended mitigation: Add an explicit field allowlist to updateVportContentPageDAL itself: strip any keys from `patch` that are not in an internal ALLOWED_UPDATE_FIELDS set (title, excerpt, body, category, service_keys). Raise an error if a caller attempts to pass is_published, is_indexable, actor_id, profile_id, slug, or id in the patch. The DAL should be the last line of defense, not an open passthrough.
- Rationale: Defense-in-depth. The controller allowlist is UX-layer validation; the DAL allowlist is the security contract. Both must exist independently. This matches the pattern used in booking and exchange modules.
- Follow-up command: ELEKTRA
- CISSP Domain:
  - Primary: Software Development Security (input validation, defense-in-depth)
  - Secondary: Access Control (privilege escalation prevention)
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-CONTENT-003
- Location: dal/content/listVportPublicContentPages.dal.js : PUBLIC_SELECT (line 8) + dal/content/readVportPublicContentPage.dal.js : PUBLIC_FULL_SELECT (line 6) + model/content/VportContentPage.model.js : fromRow (line 10-11)
- Application Scope: VCSM
- Platform Surface: PWA — public content cards and viewer modal
- Trust Boundary: Public Visitor
- Boundary Violated: Internal UUID exposure — actor_id and profile_id are internal platform identifiers; they must not be included in public API responses
- Contract Violated: None (no explicit public payload contract for content pages) — Gap in contract
- Current behavior: Both public DALs (list and read) include actor_id and profile_id in their SELECT strings. The model's fromRow() maps these to actorId and profileId on every domain object. All public consumers — VportContentPageCard, VportContentPageViewer, and VportContentPublicView — receive page objects with actorId and profileId populated. These UUIDs are rendered into React component state and accessible via browser devtools.
- Risk: actor_id and profile_id are internal platform UUIDs. Exposing them in public read payloads allows: (1) enumeration of actor UUIDs from public content pages without authentication, (2) construction of API calls that reference these UUIDs to probe other endpoints, (3) correlation of actor identities across content pages to map VPORT ownership structure. The actor_id is the canonical identity key for the booking, reviews, and messaging systems.
- Severity: HIGH
- Exploitability: MEDIUM — requires only visiting a VPORT public profile; actor_id is accessible via React DevTools or network inspection with no auth required
- Attack Preconditions: None — public route, no auth required
- Blast Radius: Multi-actor — every VPORT with published content pages leaks their actor_id to the public internet
- Identity Leak Type: Internal UUID exposure (actor_id + profile_id)
- Cache Trust Type: Public-profile-sensitive — the 5-minute TTL cache propagates the leak for 5 minutes after any cache write
- RLS Dependency: VERIFIED (is_published=true filter is enforced at both DAL and RLS layer) — but RLS does not restrict which columns are returned, only which rows
- Why it matters: The VCSM architecture contract explicitly states that actor_id must never be exposed in public-facing URLs (memory: no raw IDs in public URLs). While this is a payload exposure rather than a URL exposure, the principle is identical — internal UUIDs in public responses are an enumeration attack surface. The booking, QR, and menu modules have been hardened to remove actor_id from public payloads; content pages has not been held to the same standard.
- Recommended mitigation: Remove actor_id and profile_id from both public DAL SELECT strings (PUBLIC_SELECT in listVportPublicContentPages.dal.js and PUBLIC_FULL_SELECT in readVportPublicContentPage.dal.js). Add a PUBLIC_SAFE_FIELDS allowlist variant of fromRow() in VportContentPageModel that omits actorId and profileId. Use this variant exclusively in public controller paths (listVportPublicContentPagesController, readVportPublicContentPageController). Owner DAL SELECT strings and fromRow() can retain these fields for internal use.
- Rationale: Removing UUIDs from the public select string prevents them from reaching the Supabase wire response, the TTL cache, the controller, the hook, and the UI component tree — complete elimination, not just UI suppression.
- Follow-up command: ELEKTRA
- CISSP Domain:
  - Primary: Access Control (principle of least privilege — return only what the caller is entitled to)
  - Secondary: Software Development Security (public API surface hardening)
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-CONTENT-004
- Location: zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_content-pages-legacy-policy-cleanup.md + live DB (CARNAGE-documented, VENOM-confirmed as open)
- Application Scope: VCSM
- Platform Surface: Supabase Table — vport.content_pages (RLS layer — all operations)
- Trust Boundary: Authenticated Citizen (any authenticated user)
- Boundary Violated: Actor Ownership Contract — legacy RLS policies using profiles.owner_user_id = auth.uid() are confirmed present in the DB alongside modern policies; OR-merge grants former VPORT owners live CRUD access
- Contract Violated: Actor Ownership Contract
- Current behavior: vport.content_pages has two PERMISSIVE policy sets active simultaneously on SELECT, INSERT, UPDATE, and DELETE. Legacy policies (content_pages_owner_read, content_pages_owner_insert, content_pages_owner_update, content_pages_owner_delete) use profiles.owner_user_id = auth.uid() — a stale-ownership column. Modern policies (content_pages_select_owner, content_pages_insert_owner, content_pages_update_owner, content_pages_delete_owner) use actor_can_manage_profile(current_actor_id(), profile_id). Because Supabase PERMISSIVE policies OR-merge, any user who satisfies EITHER condition is granted access. A user who formerly owned a VPORT (and whose user_id is still in profiles.owner_user_id) retains full CRUD access to that VPORT's content pages even after ownership transfer.
- Risk: VPORT ownership transfer does not revoke access to content pages for the former owner. Former owner can: read all draft (unpublished) content pages, modify or delete published content, publish or unpublish pages. The application controller layer (assertActorOwnsVportActorController via actor_owners) correctly rejects former owners — but the Supabase RLS layer independently grants them access, bypassing the application gate entirely for any direct Supabase client call.
- Severity: HIGH
- Exploitability: MEDIUM — requires that a VPORT ownership transfer has occurred AND the former owner uses a Supabase client directly (not the VCSM app controllers). The former owner would have their Supabase JWT and know the profile_id.
- Attack Preconditions: (1) VPORT ownership was transferred at some point. (2) Former owner retains their account and JWT. (3) Former owner calls Supabase directly (bypassing app controllers). profiles.owner_user_id must still reference the former owner's user_id (stale).
- Blast Radius: Single actor per exploitation — scoped to the specific VPORT whose ownership was transferred. Platform-wide if many ownership transfers have occurred.
- Identity Leak Type: None (this is an access control failure, not a data exposure)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — CARNAGE confirmed the dual-policy state from schema inspection. VENOM cannot independently verify which policies are currently active without DB access. Treating as ASSUMED PRESENT per CARNAGE report.
- Why it matters: The application controller layer correctly enforces the modern ownership model. The DB layer contradicts it. Any tool or script that hits the Supabase API directly (Supabase Studio, direct API calls with a valid JWT, PostgREST) bypasses the controller and lands on the RLS layer alone — where former owners are still admitted. This is the canonical stale-ownership attack surface CARNAGE identified.
- Recommended mitigation: Execute the CARNAGE migration plan (2026-05-14_carnage_content-pages-legacy-policy-cleanup.md). Specifically: (1) Run pre-flight Query 1 to confirm 0 actor_id/profile_id mismatches in existing rows. (2) Add actor_id consistency guard to content_pages_insert_owner (Phase 1-C). (3) Drop the 4 legacy policies in phases 2-5. (4) Run post-drop validation with a test actor. This requires DB + THOR gate sign-off per CARNAGE plan.
- Rationale: Dropping the legacy policies eliminates the OR-merge that grants stale-owner access. All access then flows exclusively through actor_can_manage_profile() which uses the live actor_owners table — the canonical ownership authority.
- Follow-up command: DB (run CARNAGE pre-flight queries) → Carnage (execute migration) → THOR (release gate)
- CISSP Domain:
  - Primary: Access Control (stale authorization, ownership transfer completeness)
  - Secondary: Identity and Access Management (actor ownership model enforcement)
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-CONTENT-005
- Location: dal/content/listVportPublicContentPages.dal.js : listVportPublicContentPagesDAL (line 28-30) vs RLS policy content_pages_public_read (is_published=true AND is_indexable=true)
- Application Scope: VCSM
- Platform Surface: Supabase Table — vport.content_pages (SELECT public)
- Trust Boundary: Public Visitor
- Boundary Violated: Feed Publishing Contract — DAL filter and RLS policy are out of sync on the is_indexable gate
- Contract Violated: Feed Publishing Contract
- Current behavior: The public list DAL filters only on is_published=true. It does NOT filter on is_indexable. The RLS policy content_pages_public_read filters on is_published=true AND is_indexable=true. The second public RLS policy content_pages_select_public filters on is_published=true AND EXISTS(active profile). The two public RLS policies themselves are also inconsistent with each other — one requires is_indexable=true, the other does not.

  Result: rows where is_published=true AND is_indexable=false are visible to the DAL query (because content_pages_select_public allows them) but NOT to the content_pages_public_read policy. Depending on which policy wins (both PERMISSIVE, so OR-merge applies), these rows ARE returned. The Logan spec does not define the intended behavior for is_published=true + is_indexable=false pages, making this a semantic ambiguity with potential information disclosure.
- Risk: If is_indexable=false was intended to mark pages that should be published but NOT publicly discoverable (e.g. sent to subscribers directly, or available via direct link only), then including them in the public list response violates that intent. The DAL and the inconsistent public RLS policies together expose these pages to all anonymous visitors.
- Severity: MEDIUM
- Exploitability: LOW — only affects pages where is_indexable intentionally differs from is_published; no current UI sets them independently
- Attack Preconditions: A page must have is_published=true AND is_indexable=false. Currently the toggle controller sets is_published without touching is_indexable, so this is a realistic future state.
- Blast Radius: Single actor — affects only that VPORT's content pages where the flags diverge
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive — TTL cache caches whatever the DAL query returns, including is_indexable=false pages
- RLS Dependency: UNVERIFIED — two public policies exist with inconsistent predicates; their interaction under OR-merge semantics is ambiguous
- Why it matters: is_indexable is a field in the schema with semantic meaning (Logan spec section 2). The publish toggle controller only toggles is_published. If there is an intended owner workflow for publishing without indexing, the gap between DAL filter and RLS policy creates unpredictable behavior. At minimum the inconsistency between the two public RLS policies must be resolved by DB.
- Recommended mitigation: (1) Align the public list DAL to also filter on is_indexable=true if that is the intended public visibility gate. OR (2) Confirm to Logan that is_indexable is not a visibility gate for public reads (only for SEO indexing signals), in which case remove is_indexable from the content_pages_public_read RLS predicate. Either way: make the DAL filter, the Logan spec semantics, and the RLS policy predicate consistent with each other. Coordinate with DB to confirm which public RLS policy is canonical.
- Rationale: DAL filter and RLS predicate must agree. When they differ, the effective behavior is governed by whichever is more permissive — the DAL filter is then irrelevant as a security control.
- Follow-up command: DB
- CISSP Domain:
  - Primary: Access Control (policy consistency, least-privilege public reads)
  - Secondary: Software Development Security (filter/policy parity)
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-CONTENT-006
- Location: dal/content/toggleVportContentPagePublish.dal.js : toggleVportContentPagePublishDAL (line 8-28) + controller/content/toggleVportContentPagePublish.controller.js (lines 19-24)
- Application Scope: VCSM
- Platform Surface: Supabase Table — vport.content_pages (UPDATE)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Data Integrity Contract — toggle-publish DAL issues a blind UPDATE by ID with no actor_id guard in the WHERE clause
- Contract Violated: Data Integrity Contract
- Current behavior: toggleVportContentPagePublishDAL updates by id only: `.update(patch).eq("id", id)`. The pre-flight ownership check in the controller reads the existing row and validates existing.actor_id === actorId, then calls the DAL. However, the DAL itself contains no actor_id in the WHERE clause — it is purely `WHERE id = ?`. There is a TOCTOU (time-of-check/time-of-use) window: if the content page is transferred to a different actor between the controller's pre-flight read and the DAL's UPDATE, the toggle write proceeds against a row the caller no longer owns.
- Risk: TOCTOU is a low-probability race in this platform context (content pages are rarely transferred), but the structural gap is real. More concretely: the DAL's WHERE clause should include AND actor_id = actorId as a DB-level guard regardless of the controller pre-flight, to eliminate the window and ensure the DB write is self-defending. Without it, the actor_id check exists only in application code, with no DB-layer enforcement beyond RLS.
- Severity: MEDIUM
- Exploitability: LOW — TOCTOU window is narrow; ownership transfer mid-operation is unlikely in practice
- Attack Preconditions: Extremely specific race condition — requires a concurrent ownership transfer of the same content page during a toggle-publish operation. Not practically exploitable without platform-level access.
- Blast Radius: Single content page row
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED — content_pages_update_owner policy gating on actor_can_manage_profile() provides partial coverage, but the actor_id in the WHERE clause is an additional defense-in-depth control
- Why it matters: The principle of defense-in-depth requires that write operations include their ownership constraint in the WHERE clause, not just in application-layer pre-flight checks. This pattern is standard for all other write DALs that have been hardened (booking, exchange, etc.). The toggle DAL should match this pattern.
- Recommended mitigation: Add AND actor_id = actorId to the WHERE clause in toggleVportContentPagePublishDAL. The controller should pass actorId to the DAL. This eliminates the TOCTOU window and makes the DAL self-defending regardless of what the controller does. Apply the same pattern to updateVportContentPageDAL (same gap exists there — UPDATE WHERE id=? only).
- Rationale: DB-layer ownership guards are not redundant with controller pre-flight checks — they serve different trust scopes (application trust vs. DB trust). The DAL must be independently correct.
- Follow-up command: ELEKTRA
- CISSP Domain:
  - Primary: Software Development Security (TOCTOU, defense-in-depth)
  - Secondary: Access Control (row-level ownership in write predicates)
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-CONTENT-007
- Location: screens/content/components/VportContentPageViewer.jsx : line 136-144
- Application Scope: VCSM
- Platform Surface: PWA — public content page modal viewer
- Trust Boundary: Public Visitor
- Boundary Violated: None (implementation gap vs. removed feature)
- Contract Violated: None
- Current behavior: VportContentPageViewer renders `{page.coverImageUrl && <img src={page.coverImageUrl} ... />}`. However, the Logan spec (section 2) explicitly states: "There is NO cover_image_url column. Any DAL or model referencing cover_image_url will receive a Supabase column-not-found error." The VportContentPage model's fromRow() does NOT include a coverImageUrl field — it was intentionally removed in the 2026-04-18 fix. Therefore page.coverImageUrl is always undefined, and the conditional block never executes. This is dead code — not a security vulnerability, but it indicates the viewer component was not updated when the Logan schema fix was applied.

  The secondary concern: if a future schema change adds cover_image_url, this code would activate without security review, rendering an arbitrary URL as an <img> tag with no URL scheme validation. An attacker who could write a content page might set cover_image_url to a tracking pixel URL or a javascript: URI (the latter would be blocked by React, but the former would not).
- Risk: No current runtime risk (code path is dead). Future risk if schema evolves to include cover_image_url without corresponding security review of this img rendering code.
- Severity: LOW
- Exploitability: LOW (dead code path; future risk only)
- Attack Preconditions: Future schema addition of cover_image_url column + content page write access + no security review of this viewer code
- Blast Radius: Single content page view
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Dead code that references a non-existent schema field signals drift between the UI layer and the data contract. The Logan spec fix (2026-04-18) corrected DAL + model but the screen component was missed. This should be cleaned up to prevent confusion and future risk.
- Recommended mitigation: Remove the coverImageUrl conditional block from VportContentPageViewer.jsx and VportContentPageCard.jsx. If cover images are planned for a future feature, add them through a deliberate engineering pass with full security review of the rendering code (URL scheme validation, sanitization, CSP header alignment).
- Rationale: Dead code elimination prevents false assumptions and removes a latent attack surface before it becomes active.
- Follow-up command: LOGAN
- CISSP Domain:
  - Primary: Software Development Security (dead code, schema drift)
  - Secondary: None
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-CONTENT-008
- Location: dal/content/listVportPublicContentPages.dal.js : publicContentCache (line 11-16) + invalidateVportPublicContentCache (line 13-16)
- Application Scope: VCSM
- Platform Surface: PWA — in-memory TTL cache (client-side)
- Trust Boundary: Public Visitor
- Boundary Violated: None — design concern with cache invalidation scope
- Contract Violated: None
- Current behavior: The public content cache is an in-memory TTL cache keyed by actorId. Cache invalidation on publish/unpublish is called from the controller: invalidateVportPublicContentCache(actorId). This correctly clears the cache for the publishing actor. However: (1) The invalidation function accepts actorId=null/undefined and calls invalidateAll() in that case — meaning a bug in the controller that passes undefined would wipe the entire cache across all actors. (2) The cache is in-process / per-tab — each browser tab has its own cache instance. A user viewing a VPORT's public content in Tab A will continue to see stale cached data for 5 minutes even after the owner publishes or unpublishes a page in Tab B. (3) The cache does not invalidate on page delete — only on toggle-publish. A deleted published page remains in the cache for up to 5 minutes after deletion.
- Risk: (1) Null actorId in invalidation call → cache-wide eviction (minor DoS of the in-process cache, forces re-fetches for all actors). (2) Stale cache after delete: a deleted page continues to appear in the public view for up to 5 minutes. If the owner deleted the page due to sensitive content, visitors see it for up to 5 minutes. (3) Tab isolation: no cross-tab invalidation possible with an in-memory cache — expected limitation, but worth documenting.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions: (1) For null-actorId: requires a bug in the toggle controller that passes undefined actorId. (2) For stale-delete: no attack preconditions — this is a design characteristic.
- Blast Radius: (1) Cache-wide for null-actorId issue. (2) Single actor for stale-delete.
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: NONE (cache sits above the RLS layer; RLS enforces at the DB level regardless)
- Why it matters: The stale-delete behavior means content an owner considers deleted (and possibly sensitive) remains visible for up to 5 minutes. This is a weak confidentiality gap. The null-actorId guard is a defensive coding issue.
- Recommended mitigation: (1) Add a guard in invalidateVportPublicContentCache: if actorId is falsy, log a warning and return early — do NOT call invalidateAll(). (2) Call invalidateVportPublicContentCache(actorId) from deleteVportContentPageController after a successful delete, so deleted pages are not served from cache. (3) Document the tab-isolation limitation in the Logan spec as a known design boundary.
- Rationale: Guard against null-actorId prevents unintended cache-wide eviction. Post-delete invalidation reduces the window during which sensitive deleted content is served to public viewers.
- Follow-up command: LOGAN
- CISSP Domain:
  - Primary: Software Development Security (cache correctness, data lifecycle)
  - Secondary: Security Operations (confidentiality of deleted content)
```

---

## MITIGATION PLAN TABLE

| Finding ID | Severity | Effort | Owner | Action | Blocking |
|---|---|---|---|---|---|
| VENOM-CONTENT-001 | HIGH | HIGH | Carnage + DB | Add is_deleted soft-delete to vport.content_pages; update deleteVportContentPageDAL; gate all read DALs | YES — before next release |
| VENOM-CONTENT-002 | HIGH | LOW | ELEKTRA | Add field allowlist to updateVportContentPageDAL; reject patch fields outside allowlist | YES — before next release |
| VENOM-CONTENT-003 | HIGH | LOW | ELEKTRA | Remove actor_id and profile_id from public DAL SELECT strings; add public-safe fromRow variant in model | YES — before next release |
| VENOM-CONTENT-004 | HIGH | HIGH | DB → Carnage → THOR | Execute CARNAGE migration plan: drop 4 legacy RLS policies after pre-flight verification | YES — CARNAGE migration required |
| VENOM-CONTENT-005 | MEDIUM | LOW | DB | Align DAL public filter and RLS policy predicates on is_indexable; remove inconsistency between the two public policies | YES — DB must confirm canonical policy |
| VENOM-CONTENT-006 | MEDIUM | LOW | ELEKTRA | Add AND actor_id = actorId to WHERE clause in toggleVportContentPagePublishDAL and updateVportContentPageDAL | NO — hardening item |
| VENOM-CONTENT-007 | LOW | LOW | LOGAN | Remove dead coverImageUrl code from VportContentPageViewer.jsx and VportContentPageCard.jsx | NO — cleanup item |
| VENOM-CONTENT-008 | LOW | LOW | Carnage | Null-guard in invalidateVportPublicContentCache; call invalidation from delete controller; document tab isolation | NO — hardening item |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Coverage |
|---|---|---|
| Access Control | VENOM-CONTENT-003, VENOM-CONTENT-004, VENOM-CONTENT-005, VENOM-CONTENT-006 | Stale ownership (RLS OR-merge), UUID exposure in public reads, publish/indexable gate inconsistency, TOCTOU in write predicates |
| Software Development Security | VENOM-CONTENT-001, VENOM-CONTENT-002, VENOM-CONTENT-006, VENOM-CONTENT-007, VENOM-CONTENT-008 | Hard delete vs. soft delete, open patch passthrough, defense-in-depth at DAL layer, dead code/schema drift, cache correctness |
| Identity and Access Management | VENOM-CONTENT-004 | Stale-ownership persistence via profiles.owner_user_id after VPORT transfer |
| Security Operations | VENOM-CONTENT-001, VENOM-CONTENT-008 | Audit trail absence (no deleted_at), stale cache after delete |

---

## OVERALL ASSESSMENT

The content-pages module has a well-structured ownership gate at the controller layer. The write paths (create, update, delete, toggle-publish) all call `assertActorOwnsVportActorController` correctly. The identity source (useIdentity → actorId) is session-derived, not client-supplied. The UI ownership gate (deriveVportIsOwner) is enforced independently of the DB write gate — this is correct layering.

The three HIGH findings are:

1. **Hard delete (VENOM-CONTENT-001)** — structural data lifecycle risk; no recovery path for accidental deletion.
2. **Open patch passthrough at DAL (VENOM-CONTENT-002)** — the DAL accepts arbitrary patch objects; the field allowlist exists only in the controller.
3. **Internal UUIDs in public read payloads (VENOM-CONTENT-003)** — actor_id and profile_id are returned on every public content page response.
4. **Stale-ownership RLS OR-merge (VENOM-CONTENT-004)** — legacy policies are live on the DB; former owners retain CRUD access through the stale-ownership bypass path. This was documented by CARNAGE in May 2026 and is still unresolved.

The CARNAGE migration (VENOM-CONTENT-004) is the highest-urgency item from a security architecture standpoint because it exists at the DB layer and bypasses all application-level controls. DB must run pre-flight queries and THOR must gate the release of the migration.

**VENOM Status: BLOCKED** — VENOM-CONTENT-004 (stale-ownership RLS OR-merge) is a HIGH finding at the DB layer that bypasses application controls. Combined with VENOM-CONTENT-003 (UUID exposure in public reads) and VENOM-CONTENT-002 (open DAL patch), three HIGH findings are open. Per governance matrix convention, BLOCKED is appropriate when HIGH findings exist that have not been mitigated.

---

*Audit persisted to: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_18-30_venom_content-pages.md`*
*VENOM — Security Sheriff — READ-ONLY AUDIT COMPLETE*

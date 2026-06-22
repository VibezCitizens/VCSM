---
# ELEKTRA Security Report

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** VENOM cross-reference — VENOM-CONTENT-002, VENOM-CONTENT-003, VENOM-CONTENT-006 assigned to ELEKTRA
**Findings Summary:** 2 HIGH | 1 MEDIUM | 0 LOW | 0 INFO
**False Positives Rejected:** 0
**Suggested Patches:** 3

**Patch Status (2026-05-28):**
- ELEK-2026-05-27-001 — PATCHED (branch: vport-booking-feed-security-updates)
- ELEK-2026-05-27-002 — PATCHED (branch: vport-booking-feed-security-updates)
- ELEK-2026-05-27-003 — PATCHED (branch: vport-booking-feed-security-updates)

---

## Executive Summary

ELEKTRA traced three VENOM-flagged source→sink chains in the content pages DAL, model, and controller layer. Two HIGH findings are confirmed with code evidence: the update DAL accepts an arbitrary patch object with no field allowlist at the DB layer, enabling privilege escalation by any caller that bypasses the controller; and both public read DALs include `actor_id` and `profile_id` in their SELECT strings, exposing internal UUIDs on every unauthenticated read. One MEDIUM is confirmed: the toggle-publish DAL's WHERE clause contains only `id = ?` with no `actor_id` binding, leaving a TOCTOU window that the controller's pre-flight check cannot close at the DB layer. All three patches are implementation-ready.

---

## High Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-001
- Title:              Open patch passthrough at updateVportContentPageDAL — no field allowlist at DAL layer
- Category:           Privilege Escalation
- Severity:           HIGH
- Status:             PATCHED — 2026-05-28 (branch: vport-booking-feed-security-updates)
- Patch Files:
    apps/VCSM/src/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal.js
    apps/VCSM/src/features/profiles/kinds/vport/controller/content/updateVportContentPage.controller.js
- Patch Summary:
    DAL: Added ALLOWED_UPDATE_FIELDS = {title, excerpt, body, category, service_keys}.
    Patch is stripped via Object.fromEntries/filter before .update(). Any forbidden key raises
    an error. actorId param added; .eq("actor_id", actorId) added to WHERE clause.
    0-row result throws ownership error at DAL layer. Controller passes actorId to DAL.
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal.js : lines 8–23
- Source:             `patch` parameter accepted from controller caller — arbitrary object, no validation
- Sink:               `.update(patch)` at line 16 — passed directly to Supabase vportSchema.from("content_pages")
- Trust Boundary:     Controller layer (updateVportContentPageController builds a safe patch — lines 31–54 of controller file)
- Impact:             Any caller that imports and calls updateVportContentPageDAL directly — bypassing the controller — can pass patch fields including `is_published: true`, `is_indexable: true`, `actor_id: <other>`, `profile_id: <other>`, or `slug: <new>`. These writes reach Supabase and are gated only by RLS. Publish-status escalation via DAL bypass skips the cache invalidation call in the toggle controller, causing stale published state in the TTL cache.
- Evidence:
    // updateVportContentPage.dal.js lines 8–23
    export async function updateVportContentPageDAL({ id, patch } = {}) {
      if (!id) throw new Error("updateVportContentPageDAL: id is required");
      if (!patch || typeof patch !== "object") {
        throw new Error("updateVportContentPageDAL: patch is required");
      }
      const { data, error } = await vportSchema
        .from("content_pages")
        .update(patch)           // ← patch passed directly, no field stripping
        .eq("id", id)
        .select(CONTENT_SELECT)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    // Controller (safe) builds patch from explicit fields only:
    // title, excerpt, body, category, service_keys — but DAL does not enforce this
- Reproduction Steps:
    1. Import updateVportContentPageDAL directly (bypass controller)
    2. Call with patch = { is_published: true, actor_id: "<target_actor>", slug: "new-slug" }
    3. Observe: Supabase UPDATE proceeds; is_published changes without cache invalidation; actor_id reassigned if RLS allows; slug mutated despite immutability contract
    (Do not test on production — use a local Supabase dev instance)
- Existing Defense:     Controller allowlist (title, excerpt, body, category, service_keys only) — present and correct
- Why Defense Is Insufficient: The controller is one call path. Any other caller (test, script, future hook) that imports the DAL directly bypasses the allowlist entirely. Defense-in-depth requires the DAL to independently enforce the field contract.
- Recommended Fix:    Add an explicit ALLOWED_UPDATE_FIELDS set inside updateVportContentPageDAL. Strip any keys from patch that are not in the set before calling .update(). Raise an error if the stripped patch is empty or if a forbidden field was present.
- Suggested Patch:
    // updateVportContentPage.dal.js — add before the function body

    const ALLOWED_UPDATE_FIELDS = new Set([
      "title",
      "excerpt",
      "body",
      "category",
      "service_keys",
    ]);

    export async function updateVportContentPageDAL({ id, patch } = {}) {
      if (!id) throw new Error("updateVportContentPageDAL: id is required");
      if (!patch || typeof patch !== "object") {
        throw new Error("updateVportContentPageDAL: patch is required");
      }

      const safePatch = Object.fromEntries(
        Object.entries(patch).filter(([k]) => ALLOWED_UPDATE_FIELDS.has(k))
      );

      if (!Object.keys(safePatch).length) {
        throw new Error("updateVportContentPageDAL: no valid fields in patch");
      }

      const { data, error } = await vportSchema
        .from("content_pages")
        .update(safePatch)
        .eq("id", id)
        .select(CONTENT_SELECT)
        .maybeSingle();

      if (error) throw error;
      return data;
    }

    NOTE: Also add .eq("actor_id", actorId) to the WHERE clause — see ELEK-2026-05-27-003 for the TOCTOU fix which covers both DALs.
- Follow-up Command:  BLACKWIDOW (runtime validation of privilege escalation path)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-002
- Title:              actor_id and profile_id exposed in both public content page DAL SELECT strings
- Category:           IDOR/BOLA
- Severity:           HIGH
- Status:             PATCHED — 2026-05-28 (branch: vport-booking-feed-security-updates)
- Patch Files:
    apps/VCSM/src/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal.js
    apps/VCSM/src/features/profiles/kinds/vport/dal/content/readVportPublicContentPage.dal.js
    apps/VCSM/src/features/profiles/kinds/vport/model/content/VportContentPage.model.js
    apps/VCSM/src/features/profiles/kinds/vport/controller/content/listVportPublicContentPages.controller.js
    apps/VCSM/src/features/profiles/kinds/vport/controller/content/readVportPublicContentPage.controller.js
- Patch Summary:
    DAL: Removed actor_id and profile_id from PUBLIC_SELECT and PUBLIC_FULL_SELECT in both
    public DALs. These fields are no longer fetched from DB on public reads.
    Model: Added fromPublicRow() and fromPublicRows() to VportContentPageModel — these methods
    omit actorId and profileId entirely. fromRow()/fromRows() unchanged for owner paths.
    Controllers: listVportPublicContentPagesController now calls fromPublicRows();
    readVportPublicContentPageController now calls fromPublicRow(). Internal UUIDs no
    longer reachable via DevTools, network inspection, or React component tree on public paths.
    Grep verified: no component reads actorId or profileId from a content page object.
- Scope:              VCSM
- Location:
    apps/VCSM/src/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal.js : line 8 (PUBLIC_SELECT)
    apps/VCSM/src/features/profiles/kinds/vport/dal/content/readVportPublicContentPage.dal.js : line 7 (PUBLIC_FULL_SELECT)
    apps/VCSM/src/features/profiles/kinds/vport/model/content/VportContentPage.model.js : lines 11–12 (fromRow)
- Source:             Public HTTP request — no authentication required; any visitor can trigger these DALs
- Sink:               VportContentPageModel.fromRow() maps actor_id and profile_id into the returned object; object enters React state and is accessible via DevTools or network inspection
- Trust Boundary:     Public read path — listVportPublicContentPagesController / readVportPublicContentPageController
- Impact:             Every public content page request returns the internal actor_id and profile_id UUIDs to unauthenticated visitors. These UUIDs can be extracted from React DevTools or network responses to: (1) enumerate actor UUIDs without auth, (2) probe other VCSM endpoints that accept actor_id or profile_id as parameters, (3) build a persistent mapping of internal IDs from public pages. The 5-minute TTL cache in listVportPublicContentPagesDAL propagates this leak for 5 minutes per cache write.
- Evidence:
    // listVportPublicContentPages.dal.js line 8
    const PUBLIC_SELECT =
      "id,actor_id,profile_id,title,slug,excerpt,category,service_keys,published_at,created_at";
    //      ^^^^^^^^  ^^^^^^^^^^  ← internal UUIDs included in public SELECT

    // readVportPublicContentPage.dal.js line 7
    const PUBLIC_FULL_SELECT =
      "id,actor_id,profile_id,title,slug,excerpt,body,category,service_keys,published_at,created_at";
    //      ^^^^^^^^  ^^^^^^^^^^  ← same exposure on full-page reads

    // VportContentPage.model.js lines 11–12
    actorId: row.actor_id ?? null,
    profileId: row.profile_id ?? null,
    // ← both fields mapped and returned on every public object
- Reproduction Steps:
    1. Open any VPORT public profile with published content pages (no auth required)
    2. Open browser DevTools → Network tab → find the content_pages Supabase request
    3. Inspect response body: actor_id and profile_id are present on every row
    4. OR open React DevTools → Components → find VportContentPageCard or VportContentPublicView
    5. Inspect props/state: actorId and profileId are populated in the component
    (Do not test on production data)
- Existing Defense:     is_published=true filter in both DALs (correct — limits row access). No defense on column exposure.
- Why Defense Is Insufficient: RLS controls which rows are returned, not which columns. Removing these fields from the SELECT string is the only way to prevent them from reaching the wire response, the TTL cache, the controller, and the UI.
- Recommended Fix:    (1) Remove actor_id and profile_id from PUBLIC_SELECT and PUBLIC_FULL_SELECT. (2) Add a fromPublicRow() static method to VportContentPageModel that omits actorId and profileId. (3) Update both public controller paths to call fromPublicRow() instead of fromRow(). Owner DAL SELECT strings and fromRow() retain these fields for internal use.
- Suggested Patch:
    // 1. listVportPublicContentPages.dal.js — remove actor_id, profile_id
    const PUBLIC_SELECT =
      "id,title,slug,excerpt,category,service_keys,published_at,created_at";

    // 2. readVportPublicContentPage.dal.js — remove actor_id, profile_id
    const PUBLIC_FULL_SELECT =
      "id,title,slug,excerpt,body,category,service_keys,published_at,created_at";

    // 3. VportContentPage.model.js — add fromPublicRow alongside existing fromRow
    export const VportContentPageModel = {
      fromRow(row) {
        if (!row) return null;
        return {
          id: row.id ?? null,
          actorId: row.actor_id ?? null,      // owner path only
          profileId: row.profile_id ?? null,  // owner path only
          title: str(row.title),
          slug: str(row.slug),
          excerpt: row.excerpt ?? null,
          body: row.body ?? null,
          category: row.category ?? null,
          serviceKeys: Array.isArray(row.service_keys) ? row.service_keys : [],
          isPublished: row.is_published ?? false,
          isIndexable: row.is_indexable ?? false,
          publishedAt: row.published_at ?? null,
          createdAt: row.created_at ?? null,
          updatedAt: row.updated_at ?? null,
        };
      },

      fromPublicRow(row) {
        if (!row) return null;
        return {
          id: row.id ?? null,
          // actorId and profileId intentionally excluded — internal UUIDs banned from public surfaces
          title: str(row.title),
          slug: str(row.slug),
          excerpt: row.excerpt ?? null,
          body: row.body ?? null,
          category: row.category ?? null,
          serviceKeys: Array.isArray(row.service_keys) ? row.service_keys : [],
          publishedAt: row.published_at ?? null,
          createdAt: row.created_at ?? null,
        };
      },

      fromRows(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map((r) => VportContentPageModel.fromRow(r)).filter(Boolean);
      },

      fromPublicRows(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map((r) => VportContentPageModel.fromPublicRow(r)).filter(Boolean);
      },
    };

    // 4. listVportPublicContentPagesController — use fromPublicRows()
    // 5. readVportPublicContentPageController — use fromPublicRow()

    NOTE: Requires DB-change: No. SELECT string change is app-layer only.
    NOTE: Ensure no public component reads actorId or profileId from page objects — grep for these fields in VportContentPageCard, VportContentPageViewer, VportContentPublicView.
- Follow-up Command:  BLACKWIDOW (verify UUID no longer reaches browser state)
```

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-003
- Title:              toggleVportContentPagePublishDAL and updateVportContentPageDAL WHERE clauses lack actor_id binding — TOCTOU gap
- Category:           Privilege Escalation
- Severity:           MEDIUM
- Status:             PATCHED — 2026-05-28 (branch: vport-booking-feed-security-updates)
- Patch Files:
    apps/VCSM/src/features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal.js
    apps/VCSM/src/features/profiles/kinds/vport/controller/content/toggleVportContentPagePublish.controller.js
    (updateVportContentPage.dal.js already patched as part of ELEK-001)
- Patch Summary:
    toggleVportContentPagePublishDAL: actorId param added; .eq("actor_id", actorId) added to
    WHERE clause; 0-row result throws ownership error at DAL layer. TOCTOU window eliminated —
    the UPDATE is now self-defending at DB layer regardless of application-layer pre-flight.
    Controller: removed two-round-trip pre-flight read (readVportContentPageDAL + actor_id check)
    — ownership is now enforced atomically in the DAL WHERE clause. Removed unused
    readVportContentPageDAL import. Controller passes actorId to DAL.
- Scope:              VCSM
- Location:
    apps/VCSM/src/features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal.js : lines 19–24
    apps/VCSM/src/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal.js : lines 14–18
- Source:             `id` parameter (row identifier) passed without accompanying actor_id constraint
- Sink:               Supabase UPDATE WHERE id = ? — no actor_id in predicate; ownership enforced only in application pre-flight (controller layer)
- Trust Boundary:     Controller pre-flight: reads existing row, validates existing.actor_id === actorId, then calls DAL — two separate DB round-trips
- Impact:             TOCTOU window between the controller's read-then-check and the DAL's UPDATE. If the content page's actor_id changes between the controller's preflight read and the DAL write (e.g., VPORT ownership transfer), the UPDATE proceeds against a row the caller no longer owns. Additionally: any caller importing the DAL directly (bypassing the controller entirely) can update any content page by id with no ownership binding at the DB layer — relying solely on RLS.
- Evidence:
    // toggleVportContentPagePublish.dal.js lines 19–24
    const { data, error } = await vportSchema
      .from("content_pages")
      .update(patch)
      .eq("id", id)       // ← WHERE id = ? only; no actor_id constraint
      .select(PUBLISH_SELECT)
      .maybeSingle();

    // updateVportContentPage.dal.js lines 14–18
    const { data, error } = await vportSchema
      .from("content_pages")
      .update(patch)
      .eq("id", id)       // ← same gap
      .select(CONTENT_SELECT)
      .maybeSingle();

    // Controller pre-flight (toggleVportContentPagePublish.controller.js lines 19–21):
    const existing = await readVportContentPageDAL({ id });
    if (!existing) throw new Error("Content page not found.");
    if (existing.actor_id !== actorId) throw new Error("Not allowed to modify this content page.");
    // ← Then immediately calls DAL — TOCTOU window between these two operations
- Reproduction Steps:
    1. In a test environment: authenticate as owner A, start toggle-publish flow
    2. Between the controller's readVportContentPageDAL call and toggleVportContentPagePublishDAL call, trigger an ownership transfer of the content page to actor B
    3. Observe: the toggle DAL's UPDATE proceeds against the row now owned by actor B
    (Requires two concurrent operations; not exploitable in normal usage)
- Existing Defense:     Controller pre-flight ownership check (existing.actor_id === actorId). assertActorOwnsVportActorController called before pre-flight.
- Why Defense Is Insufficient: The controller pre-flight check and the DAL write are not atomic. Defense-in-depth requires the WHERE clause to include the actor constraint so the UPDATE is self-defending at the DB layer regardless of application-layer behavior.
- Recommended Fix:    Pass actorId to both toggleVportContentPagePublishDAL and updateVportContentPageDAL. Add `.eq("actor_id", actorId)` to the WHERE clause in both DALs. If the row's actor_id does not match, the UPDATE affects 0 rows — detect this by checking data === null after maybeSingle() and throwing an ownership error.
- Suggested Patch:
    // toggleVportContentPagePublish.dal.js
    export async function toggleVportContentPagePublishDAL({ id, actorId, isPublished } = {}) {
      if (!id) throw new Error("toggleVportContentPagePublishDAL: id is required");
      if (!actorId) throw new Error("toggleVportContentPagePublishDAL: actorId is required");
      if (typeof isPublished !== "boolean") {
        throw new Error("toggleVportContentPagePublishDAL: isPublished must be a boolean");
      }

      const patch = {
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
      };

      const { data, error } = await vportSchema
        .from("content_pages")
        .update(patch)
        .eq("id", id)
        .eq("actor_id", actorId)   // ← ownership constraint at DB layer
        .select(PUBLISH_SELECT)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("toggleVportContentPagePublishDAL: content page not found or not owned by actor");
      return data;
    }

    // Controller must pass actorId:
    const updated = await toggleVportContentPagePublishDAL({ id, actorId, isPublished });

    // updateVportContentPage.dal.js — same change
    export async function updateVportContentPageDAL({ id, actorId, patch } = {}) {
      if (!id) throw new Error("updateVportContentPageDAL: id is required");
      if (!actorId) throw new Error("updateVportContentPageDAL: actorId is required");
      // ... (field allowlist from ELEK-2026-05-27-001 applied first)
      const { data, error } = await vportSchema
        .from("content_pages")
        .update(safePatch)
        .eq("id", id)
        .eq("actor_id", actorId)   // ← ownership constraint
        .select(CONTENT_SELECT)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("updateVportContentPageDAL: content page not found or not owned by actor");
      return data;
    }

    NOTE: Requires DB change: No — this is an app-layer WHERE clause addition only.
    NOTE: Controller must pass actorId when calling both DALs. The actorId is already available in both controllers.
- Follow-up Command:  SPIDER-MAN (test coverage for ownership binding in write predicates)
```

---

## False Positives Rejected

None. All three VENOM cross-referenced findings were confirmed with direct code evidence.

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change | Status |
|---|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-001 | Open patch passthrough at updateVportContentPageDAL | HIGH | DAL | SIMPLE — one file, add ALLOWED_UPDATE_FIELDS set and strip loop | NO | PATCHED 2026-05-28 |
| 2 | ELEK-2026-05-27-002 | actor_id/profile_id in public DAL SELECT strings | HIGH | DAL + Model | MODERATE — two DAL files + model (add fromPublicRow) + two controller callers | NO | PATCHED 2026-05-28 |
| 3 | ELEK-2026-05-27-003 | TOCTOU — WHERE clause lacks actor_id binding | MEDIUM | DAL | MODERATE — two DAL files + two controller callers pass actorId | NO | PATCHED 2026-05-28 |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime validation: confirm UUID not reachable in browser state after ELEK-002 patch; confirm privilege escalation path is closed after ELEK-001 patch | PENDING |
| SPIDER-MAN | Test coverage: ownership binding in write predicates (ELEK-003); public fromPublicRow path returns no UUIDs (ELEK-002) | PENDING |
| DB | VENOM-CONTENT-004 (stale RLS OR-merge) and VENOM-CONTENT-005 (is_indexable policy inconsistency) — these are DB-layer fixes outside ELEKTRA scope | PENDING |
| Carnage | VENOM-CONTENT-001 (hard delete → soft delete) — DB schema change required | PENDING |
| Thor | Release gate: ELEK-001 and ELEK-002 are HIGH — both must be patched before next content pages release | PENDING |

---

## THOR Release Gate Status

| Finding | Severity | THOR Gate | Condition | Status |
|---|---|---|---|---|
| ELEK-2026-05-27-001 | HIGH | BLOCKED → CLEARED | Patched 2026-05-28 — ALLOWED_UPDATE_FIELDS + actorId WHERE binding at DAL. THOR reviewed 2026-05-28 — CAUTION gate issued. Patch accepted. | CLEARED — CAUTION |
| ELEK-2026-05-27-002 | HIGH | BLOCKED → CLEARED | Patched 2026-05-28 — actor_id/profile_id removed from public SELECT + fromPublicRow(). THOR reviewed 2026-05-28 — CAUTION gate issued. Patch accepted. | CLEARED — CAUTION |
| ELEK-2026-05-27-003 | MEDIUM | CAUTION → CLEARED | Patched 2026-05-28 — actorId WHERE binding in toggle + update DALs. THOR reviewed 2026-05-28 — CAUTION gate issued. Patch accepted. | CLEARED — CAUTION |

**THOR gate result (2026-05-28):** FINAL DECISION: CAUTION — release may proceed. All three ELEKTRA findings are PATCHED and accepted by THOR. Module remains in CAUTION governance status pending BW-CONTENT-004 (CARNAGE legacy RLS migration) + BLACKWIDOW re-tests. THOR report: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_thor_content-pages-delete-lifecycle-security-gate.md`

---

*Audit persisted to: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_20-00_elektra_content-pages.md`*
*ELEKTRA — Precision Security Scanner — READ-ONLY AUDIT COMPLETE*

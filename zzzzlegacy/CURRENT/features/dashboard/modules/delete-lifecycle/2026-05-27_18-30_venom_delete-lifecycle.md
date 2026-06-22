# VENOM Security Audit — VPORT Delete Lifecycle

**Date:** 2026-05-27
**Reviewer:** VENOM
**Module:** delete-lifecycle
**Trigger:** First VENOM pass — module was NOT_STARTED in governance matrix
**Findings:** [0 CRITICAL | 3 HIGH | 4 MEDIUM | 3 LOW]

---

## VENOM TARGET

| Field | Value |
|---|---|
| Module ID | `delete-lifecycle` |
| Route | N/A (system flow — initiated from settings) |
| VPORT Kinds | ALL |
| Public Route | NO (owner-only; cascading effects are system-wide) |
| Risk Rating | HIGH — cascading data deletion, high blast radius, hard deletes on VPORT data |
| Logan Spec | `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.delete-lifecycle.md` |

---

## SECURITY SURFACE

| Surface | File | Role |
|---|---|---|
| UI Modal (hard delete) | `apps/VCSM/src/features/settings/vports/ui/VportsHardDeleteModal.jsx` | Confirmation gate |
| UI Modal (soft delete / restore) | `apps/VCSM/src/features/settings/account/ui/components/AccountTabSubComponents.jsx` | Soft delete / restore modals |
| VPORTs Tab View | `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx` | Deactivated VPORTs section |
| Account Tab View | `apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx` | VPORT danger zone |
| VPORTs Hook | `apps/VCSM/src/features/settings/vports/hooks/useVportsController.js` | VPORTs tab controller |
| Account Hook | `apps/VCSM/src/features/settings/account/hooks/useAccountController.js` | Account settings controller |
| Account Controller | `apps/VCSM/src/features/settings/account/controller/account.controller.js` | Thin controller — delegates to DAL |
| Account Write DAL | `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` | RPC callers + deprecated direct UPDATE |
| VPORT Core DAL | `apps/VCSM/src/features/vport/dal/vport.core.dal.js` | Duplicate soft/hard/restore wrappers |
| Edge Function | `apps/VCSM/supabase/functions/delete-citizen-account/index.ts` | Citizen account full deletion |
| Public Slug DAL (cache) | `apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js` | 10-min TTL slug cache |
| SEO View DAL (cache) | `apps/VCSM/src/features/profiles/dal/readActorSeoData.dal.js` | 10-min TTL SEO data cache |
| Public SEO View | `vport.public_actor_seo_v` (view — definition not tracked in migrations) | Slug resolution for public menus |
| TRAZE Directory View | `vport.public_traze_profiles_v` | Guards `is_deleted = false` in WHERE clause |
| Hard Delete RPC | `vport.hard_delete_vport(uuid)` (SECURITY DEFINER — not in tracked migrations) | 11-phase deletion chain |
| Soft Delete RPC | `vport.soft_delete_vport(uuid)` (SECURITY DEFINER — not in tracked migrations) | Sets `is_deleted = true` |
| Restore RPC | `vport.restore_vport(uuid)` (SECURITY DEFINER — not in tracked migrations) | Clears deletion flags |
| Delete Policy | Migration `20260527100000_harden_bookings_and_profiles_delete_policies.sql` | `profiles_delete_owner` RLS |

---

## TRUST BOUNDARY TRACE

```
User (browser) → VportsTab / AccountTab (UI)
  → onClick: setHardDeleteTarget / setSoftTarget
    [UI BOUNDARY: modal confirmation with name-match text gate]
  → handleHardDeleteConfirm / handleSoftConfirm
  → useVportsController.hardDeleteVport / useAccountController.hardDeleteVport
    [APP BOUNDARY: authenticated session required — Supabase anon client]
  → ctrlHardDeleteVport / ctrlSoftDeleteVport (account.controller.js)
    [CONTROLLER: thin delegation — NO secondary ownership check]
  → dalHardDeleteVport / dalDeleteMyVport (account.write.dal.js)
    → vportSchema.rpc('hard_delete_vport', { p_vport_id }) / ('soft_delete_vport', ...)
      [DB BOUNDARY: Supabase SECURITY DEFINER RPC]
      → Step 1: auth.uid() → AUTH_REQUIRED if null
      → Step 2: UPDATE vport.profiles WHERE owner_user_id = auth.uid()
        ← OWNERSHIP CHECK IS ENFORCED HERE, AT DB LAYER
      → 11-phase cascade deletion chain
      → vc.actors SET is_void = true
      → DELETE vport.profiles

Citizen Account Delete:
User → AccountTab → deleteAccount → ctrlDeleteAccount → dalDeleteCitizenAccountFull
  → supabase.functions.invoke('delete-citizen-account')
    [EDGE FUNCTION BOUNDARY: JWT verified, caller-scoped RPC]
    → userClient.rpc('soft_delete_citizen_account') [marks data]
    → adminClient.auth.admin.deleteUser(user.id)   [auth row deleted]
```

**Trust boundary summary:** The ownership check for VPORT deletion is enforced exclusively at the RPC layer via `WHERE owner_user_id = auth.uid()`. The controller and hook layers perform no secondary ownership assertion. The UI confirmation gate (name-match text input) is UI-only and bypassable. This architecture is correct for the DB-secured pattern **only** if the RPC grants are correctly restricted and the RPC is not accessible via direct table INSERT/UPDATE.

---

## VENOM SECURITY FINDINGS

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-001
- Location: apps/VCSM/src/features/settings/account/dal/account.write.dal.js : dalDeleteOwnedVportById
- Application Scope: VCSM
- Platform Surface: PWA — DAL layer (exported, live in module bundle)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: VPORT Lifecycle Contract — bypasses two-step delete enforcement
- Contract Violated: VPORT Lifecycle Contract
- Current behavior: `dalDeleteOwnedVportById({ vportId, userId })` issues a direct
  `UPDATE vport.profiles SET is_deleted = true WHERE id = vportId AND owner_user_id = userId`.
  This function is marked deprecated in comments but remains exported in the live module,
  is imported by the dev diagnostics group (settingsAccountFeature.group.js), and is
  verified present by the `hasDalDeleteOwnedVportById` surface contract test. It bypasses
  the `soft_delete_vport` RPC entirely — sets `is_deleted = true` without setting `deleted_at`,
  `deleted_by_actor_id`, or `is_active = false`. It also does NOT void the actor chain.
  Critically, since it bypasses the RPC, it also bypasses the SECURITY DEFINER context
  that enforces the two-step precondition for hard delete.
- Risk: Any caller that imports this DAL function (including a compromised or malicious
  dev diagnostic bundle executing in a production session) can soft-delete a VPORT they
  own without triggering the full lifecycle pipeline. The resulting state — `is_deleted = true`
  but `is_active` potentially still `true`, `deleted_at = NULL` — is inconsistent with
  the canonical delete model. This could cause the vport to remain in some public reads
  (RLS on `is_active = true AND is_deleted = false` covers both, but partial state
  inconsistency is a latent bug). Furthermore, leaving the function exported in the
  production bundle is unnecessary attack surface.
- Severity: HIGH
- Exploitability: LOW (requires authenticated session + ownership of the VPORT; direct
  import path — not an API endpoint; limited to own VPORTs via `owner_user_id = userId`)
- Attack Preconditions: Attacker must be authenticated and own the VPORT. Requires code
  execution in the client bundle (e.g., via dev tools console if source maps exposed,
  or a supply-chain compromise of the dev diagnostics module).
- Blast Radius: Single actor — affects only the calling user's own VPORTs
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED — the direct UPDATE relies on RLS enforcing `owner_user_id` match,
  but there is no secondary RPC ownership gate
- Why it matters: Leaves a deprecated code path that bypasses the canonical lifecycle pipeline
  in the live production bundle. The inconsistent state (is_deleted=true, deleted_at=NULL)
  breaks any query or admin tool that relies on `deleted_at IS NOT NULL` to identify
  soft-deleted VPORTs. Also presents unnecessary attack surface in the deployed bundle.
- Recommended mitigation: Remove the `export` keyword from `dalDeleteOwnedVportById`.
  Keep the function body as a dead-code stub with a deprecation comment for reference,
  OR delete the function entirely. Update the diagnostics group to remove its import and
  the `hasDalDeleteOwnedVportById` surface contract check. The function has no callers
  in non-diagnostic production code (confirmed by grep). The diagnostics group's
  `source_contract` test (`hasOwnedVportSoftDelete`) would continue to pass via the
  remaining DAL functions.
- Rationale: Unexported functions cannot be called from external module consumers.
  Removing the export eliminates the code path from the live attack surface without
  requiring a DB migration. The diagnostic test that checks for its presence should
  be removed — it is testing for the presence of deprecated code.
- Follow-up command: SPIDER-MAN (add regression test that asserts `dalDeleteOwnedVportById`
  is NOT exported from account.write.dal.js)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Access Control
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-002
- Location: apps/VCSM/supabase/migrations/ (ALL) : hard_delete_vport RPC
- Application Scope: VCSM
- Platform Surface: Supabase RPC (SECURITY DEFINER)
- Trust Boundary: System Service (Database)
- Boundary Violated: Infrastructure Integrity Contract — RPC definition is not tracked
  in the migrations directory
- Contract Violated: None (operational / governance gap)
- Current behavior: Both `vport.soft_delete_vport(uuid)`, `vport.restore_vport(uuid)`,
  and `vport.hard_delete_vport(uuid)` are described in the Logan spec (with their full SQL
  bodies including 11-phase deletion chain) and referenced by all DAL callers, but their
  `CREATE FUNCTION` migrations (`20260420010000_vport_soft_delete_rpc.sql` and
  `20260420020000_vport_hard_delete_rpc.sql`) do NOT exist in the tracked migrations
  directory (`apps/VCSM/supabase/migrations/`). These functions only exist in the live DB.
  The GRANT statements specified in the Logan spec (REVOKE FROM PUBLIC, GRANT TO authenticated)
  are also unverified because no migration capturing them was found.
- Risk: If the DB is reset, recreated, or migrated from scratch (disaster recovery, staging
  environment, new developer setup), the entire hard delete pipeline silently disappears.
  All three DAL callers (`dalDeleteMyVport`, `dalRestoreVport`, `dalHardDeleteVport`) would
  receive `function vport.soft_delete_vport does not exist` errors — but no compile-time
  or CI gate would catch this before a production incident. Additionally, if the GRANT
  statements were never applied (unverified), `anon` role could potentially execute these
  SECURITY DEFINER RPCs — though `auth.uid() IS NOT NULL` would block unauthenticated calls
  from succeeding.
- Severity: HIGH
- Exploitability: LOW (this is an operational/DR risk, not a direct exploitation path in
  normal operation)
- Attack Preconditions: DB reset, fresh staging deployment, or disaster recovery scenario.
- Blast Radius: Feed-wide — all VPORT delete operations become silently broken in any
  environment that does not have the live DB state
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — the GRANT/REVOKE statements that restrict `anon` from
  executing these SECURITY DEFINER functions cannot be confirmed from tracked migrations
- Why it matters: SECURITY DEFINER functions with ownership checks embedded in them are only
  safe if the grant configuration (REVOKE FROM PUBLIC, GRANT TO authenticated) is also
  applied. If `anon` can call `hard_delete_vport`, an unauthenticated caller still fails
  because `auth.uid()` returns NULL and throws `AUTH_REQUIRED` — but this relies on the
  RPC's internal guard rather than the grant layer. The missing migration is also a DR hazard:
  no migration file means no repeatable DB rebuild and no CI verification of the deletion chain.
- Recommended mitigation: Create a tracked migration file
  `20260420010000_vport_soft_delete_rpc.sql` and `20260420020000_vport_hard_delete_rpc.sql`
  capturing the complete `CREATE OR REPLACE FUNCTION` bodies as documented in the Logan spec,
  plus the REVOKE/GRANT statements. Mark them as idempotent (`CREATE OR REPLACE`). Run
  `supabase db pull` or introspect the live function bodies via
  `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname IN ('soft_delete_vport','restore_vport','hard_delete_vport')`
  to capture the live definition before writing the migration.
- Rationale: Tracked migrations are the only mechanism that guarantees reproducible DB state
  across environments and provides audit trail for security-sensitive SECURITY DEFINER functions.
- Follow-up command: Carnage (migration creation), DB (introspect live function bodies)
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-003
- Location: zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.delete-lifecycle.md : Section 9 — Failure Risks
- Application Scope: VCSM
- Platform Surface: Supabase RPC — hard_delete_vport 11-phase chain
- Trust Boundary: System Service (Database)
- Boundary Violated: VPORT Lifecycle Contract — incomplete cascade leaves orphaned data
- Contract Violated: VPORT Lifecycle Contract
- Current behavior: The Logan spec explicitly acknowledges (Section 9, Risk 4) that
  `vport.resources`, `vport.portfolio_items`, `vport.availability_exceptions`, and
  `vport.availability_rules` are NOT covered by the 11-phase deletion chain. The spec states:
  "If these tables contain rows for the deleted vport, they will persist as orphaned rows
  until a follow-up migration handles them." The hard delete RPC has 11 phases covering
  fuel prices, bookings, content pages, menu items, services, rates, reviews, station data,
  actor directory, actor_owners, and the actor/profile rows — but these four tables are
  explicitly omitted. Additionally: `notification.push_subscriptions` has an `actor_id` column
  (UUID, not FK-constrained to `vc.actors`) which means push subscription rows for the deleted
  VPORT actor will persist after the actor is voided and the profile is deleted. The
  `notification.push_subscriptions` table's `actor_id` column has no FK constraint and no
  DELETE cascade, and it is not in the 11-phase chain.
- Risk: After a VPORT hard delete:
  - `vport.resources` rows remain. These are the bookable resources (staff, rooms, equipment).
    Orphaned resource rows with `profile_id` pointing to a deleted profile break booking
    integrity — any incoming write that references these resource IDs would fail at the FK
    join but might succeed if the resource check is bypassed. More critically, `vport.resources`
    rows can still be returned in unfiltered queries and could confuse admin tooling.
  - `vport.portfolio_items`, `vport.availability_exceptions`, `vport.availability_rules`
    accumulate as orphaned privacy-relevant data (service images, pricing calendars, blackout
    dates) that remain readable by admin tooling and queryable in breach scenarios.
  - `notification.push_subscriptions` rows with the deleted VPORT `actor_id` persist.
    Push delivery systems targeting by `actor_id` could attempt to deliver notifications to
    an endpoint owned by the deleted actor's user_id — a potential ghost notification vector.
- Severity: HIGH
- Exploitability: LOW (not directly exploitable by external actors; risk is orphaned PII
  and data integrity failure under admin access or breach)
- Attack Preconditions: VPORT must be hard-deleted. Orphan exploitation requires either
  direct DB access (breach) or a bug in a query that reads these tables without checking
  actor void status.
- Blast Radius: Multi-actor — orphaned booking resources could affect customers who had
  future bookings against those resources (though Phase 2 deletes `vport.bookings`, the
  resource definitions themselves remain)
- Identity Leak Type: None (data is server-side only, not exposed through public APIs
  due to RLS and the actor void status)
- Cache Trust Type: None
- RLS Dependency: ASSUMED — RLS on these tables is assumed to prevent public reads, but
  orphan rows remain in the DB and are readable under service_role or admin context
- Why it matters: The four omitted tables and the push subscriptions table represent
  privacy-relevant operational data that should be purged when a VPORT is hard-deleted.
  GDPR/privacy compliance requires that hard deletion removes all recoverable personal data.
  Resource rows in particular create booking system confusion — a resource still exists
  in DB but its profile no longer does. Admin tooling and future queries may encounter
  confusing state.
- Recommended mitigation: Add Phase 0 (or extend Phase 2) of the hard delete chain to
  cover: `DELETE FROM vport.resources WHERE profile_id = p_vport_id` (before bookings,
  since bookings FK to resources), `DELETE FROM vport.portfolio_items WHERE profile_id
  = p_vport_id`, `DELETE FROM vport.availability_exceptions WHERE profile_id = p_vport_id`,
  `DELETE FROM vport.availability_rules WHERE profile_id = p_vport_id`. For push
  subscriptions: `DELETE FROM notification.push_subscriptions WHERE actor_id = v_actor_id`.
  Verify FK ordering with DB introspection first (Carnage sprint). The Logan spec already
  flags this as a known gap — it just needs a migration.
- Rationale: Hard delete should be total — no orphaned rows referencing the deleted profile
  should remain. The 11-phase chain is already the right pattern; it just needs to be
  extended with the missing tables.
- Follow-up command: Carnage (migration to extend deletion chain), DB (verify FK ordering
  for resources before bookings)
- CISSP Domain:
  - Primary: Information Security Governance and Risk Management
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-004
- Location: apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js : resolveVportSlugDAL
            apps/VCSM/src/features/profiles/dal/readActorSeoData.dal.js : readActorSeoViewDAL
- Application Scope: VCSM
- Platform Surface: PWA — Public-facing DAL (slug resolution cache)
- Trust Boundary: Public (unauthenticated)
- Boundary Violated: VPORT Lifecycle Contract — stale slug resolution after soft delete
- Contract Violated: VPORT Lifecycle Contract
- Current behavior: `resolveVportSlugDAL(slug)` uses a TTL cache of 10 minutes
  (`createTTLCache(10 * 60 * 1000)`). After a VPORT is soft-deleted, the
  `vport.public_actor_seo_v` view may or may not filter soft-deleted VPORTs
  (its definition is NOT in tracked migrations and cannot be verified from source).
  `invalidateVportSlugCache(slug)` and `invalidateActorSeoViewCache(actorId)` are
  exported from their respective DAL files but are NEVER CALLED anywhere in the
  codebase (confirmed by grep — zero callers outside the definition file itself).
  This means: for up to 10 minutes after a VPORT soft-delete or hard-delete, any
  cached slug-to-actorId mapping remains valid in memory and would resolve the
  deleted VPORT's slug to its former actorId. Similarly, `readActorSeoViewDAL`
  has a 10-minute TTL with no invalidation on delete.
- Risk: A soft-deleted VPORT's public menu/business-card URL (e.g., `/m/slug` or
  `/menu/slug`) remains resolvable for up to 10 minutes after deletion. Any visitor
  who already cached the slug in their browser session would continue to see the menu
  or business card until the TTL expires. More critically, if `vport.public_actor_seo_v`
  does not filter `is_deleted = false` (unverified — no tracked migration), slug resolution
  could succeed indefinitely regardless of the cache.
- Severity: MEDIUM
- Exploitability: LOW (passive — requires the attacker to already have the slug URL and
  visit within the 10-minute window; not a persistent exposure)
- Attack Preconditions: Attacker has slug URL. VPORT has been soft-deleted. Up to 10
  minutes window.
- Blast Radius: Single actor — affects only the deleted VPORT's public pages
- Identity Leak Type: None (no PII exposed through the menu/slug — public data only)
- Cache Trust Type: Moderation-sensitive — a business owner deletes their VPORT and
  expects it to disappear immediately from public view
- RLS Dependency: UNVERIFIED — whether `vport.public_actor_seo_v` filters `is_deleted`
  cannot be confirmed from tracked migrations
- Why it matters: The cache invalidation infrastructure exists (functions are exported)
  but is dead code — never called. The soft delete → immediate public invisibility
  guarantee (documented in Logan spec Section 5: "The existing RLS policy immediately
  hides the vport from all public reads") only holds for authenticated reads via RLS.
  Public-route DALs that use a view with a TTL cache bypass this guarantee for up to
  10 minutes.
- Recommended mitigation: (1) In the delete controller (`ctrlSoftDeleteVport`,
  `ctrlHardDeleteVport`), after the RPC call succeeds, call
  `invalidateVportSlugCache(slug)` and `invalidateActorSeoViewCache(actorId)` with the
  deleted VPORT's slug/actorId. The slug and actorId are available from the VPORT object
  passed to the controller. (2) Verify (via DB introspection) that
  `vport.public_actor_seo_v` includes `WHERE is_deleted = false` — this is a DB-level
  safety net. (3) Consider reducing the TTL to 1-2 minutes for slug resolution, or
  moving to a per-request validation path for security-sensitive deletion scenarios.
- Rationale: Calling the existing invalidation functions on delete is a zero-cost fix.
  The functions already exist — they just need to be wired into the delete path.
- Follow-up command: LOGAN (update spec to document cache invalidation requirement on delete),
  DB (verify public_actor_seo_v view definition)
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Information Security Governance and Risk Management
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-005
- Location: apps/VCSM/src/features/settings/account/controller/account.controller.js : ctrlHardDeleteVport
            apps/VCSM/src/features/settings/vports/hooks/useVportsController.js : hardDeleteVport
- Application Scope: VCSM
- Platform Surface: PWA — Controller / Hook layer
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Controller Ownership Contract — no actorId-level ownership assertion at controller layer
- Contract Violated: Actor Ownership Contract
- Current behavior: `ctrlHardDeleteVport({ vportId })` and `ctrlSoftDeleteVport({ vportId })`
  are thin pass-throughs that call the DAL with no pre-flight ownership check:
  ```
  export async function ctrlHardDeleteVport({ vportId }) {
    await dalHardDeleteVport(vportId)
  }
  ```
  Ownership is enforced solely at the DB RPC layer (`WHERE owner_user_id = auth.uid()`).
  There is no call to `assertActorOwnsVportActorController` (the canonical ownership gate
  used across booking, exchange, and other sensitive operations). The hook layer
  (`useVportsController.hardDeleteVport`) also has no ownership pre-check — it validates
  only that `targetVportId` is truthy.

  By contrast, other sensitive VPORT operations (booking management, exchange rate publishing,
  team management) use `assertActorOwnsVportActor` at the controller layer as a defense-in-depth
  gate before reaching the DAL.
- Risk: The DB RPC correctly enforces ownership — `WHERE owner_user_id = auth.uid()` — so this
  is not an exploitable bypass in normal operation. However, the lack of controller-layer
  ownership assertion means: (a) If a future developer replaces the RPC call with a direct
  table operation (e.g., to work around a migration), they lose the only ownership gate. (b)
  Any logging, audit trail, or rate-limiting logic added to the controller layer in the future
  would operate without ownership context. (c) The pattern is inconsistent with the platform's
  defense-in-depth ownership contract — the most destructive operation in the platform has
  weaker controller-layer defense than less destructive operations.
- Severity: MEDIUM
- Exploitability: LOW (DB-layer ownership gate is present and correct; this is a defense-in-depth
  gap, not an active bypass)
- Attack Preconditions: Future code change that replaces the RPC with a direct table operation,
  or a supply-chain event that modifies controller logic.
- Blast Radius: Single actor — affects only the calling user's VPORT
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED — ownership enforcement currently depends entirely on the RPC's
  `WHERE owner_user_id = auth.uid()` clause. If the RPC is bypassed, there is no fallback.
- Why it matters: Platform convention (and the booking engine contract) is to assert ownership
  at the controller layer before reaching the DAL. This prevents accidental bypasses during
  future refactors. The most destructive operation in the system should have the strongest,
  most explicit defense-in-depth posture.
- Recommended mitigation: Add an ownership assertion at the controller layer in
  `account.controller.js`:
  ```
  export async function ctrlHardDeleteVport({ vportId }) {
    const actorId = await dalReadVportActorIdByVportId(vportId)
    await assertActorOwnsVportActorController(callerActorId, actorId)
    await dalHardDeleteVport(vportId)
  }
  ```
  The `callerActorId` should be passed from the hook layer (available via `identity.actorId`).
  This creates a defense-in-depth check that mirrors the DB-layer enforcement.
- Rationale: Defense-in-depth. The DB gate is correct, but controller-layer ownership
  assertions are platform convention for a reason — they make ownership violations visible
  before the DB layer and prevent regression during future refactors.
- Follow-up command: Wolverine (implementation), SPIDER-MAN (regression test)
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-006
- Location: apps/VCSM/src/features/settings/account/ui/components/AccountTabSubComponents.jsx : AccountTab.view.jsx
            apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx : handleHardConfirm
- Application Scope: VCSM
- Platform Surface: PWA — UI (Account Tab Danger Zone)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: None — this is a UI hardening gap, not a boundary violation
- Contract Violated: None
- Current behavior: The `AccountTab.view.jsx` (citizen mode) renders a danger zone that shows
  ALL of the authenticated user's VPORTs (including soft-deleted ones via the full items list).
  The `VportDangerRow` component renders soft-delete vs hard-delete buttons based on
  `vport.is_deleted`. However, the `hardTarget` state in `AccountTab.view.jsx` tracks only
  one vport at a time via `setHardTarget(vport)`. There is no `confirmText` gate in the
  `HardDeleteModal` rendered in AccountTab — the `HardDeleteModal` component in
  `AccountTabSubComponents.jsx` has its own internal `confirmText` state (line 72-73: name
  match), but there is no explicit `autoFocus` on the input, and the `onConfirm` callback
  does not validate the name match server-side or in the controller — it relies entirely on
  the `canConfirm` boolean from the local component state.

  More critically: the `handleHardConfirm` in `AccountTab.view.jsx` calls
  `hardDeleteVport(hardTarget.id)` with no additional guard:
  ```
  async function handleHardConfirm() {
    await hardDeleteVport(hardTarget.id)
    // navigation happens inside hardDeleteVport on success
  }
  ```
  The `hardTarget.id` is a direct VPORT `id` (UUID from the database row), not an actorId.
  There is no server-side confirmation that the `confirmText === target.name` — this check
  is purely client-side.
- Risk: A client-side script (XSS, browser extension, or console injection) could bypass the
  confirmation text gate and call `hardDeleteVport(vportId)` directly against any VPORT the
  user owns. The DB-layer ownership check (`WHERE owner_user_id = auth.uid()`) prevents
  cross-user deletion, but within the same user's VPORTs there is no server-side confirmation
  token or secondary challenge.
- Severity: MEDIUM
- Exploitability: LOW (requires XSS or console access; the UI name-match gate is UI-only
  but the DB ownership gate prevents cross-user attacks)
- Attack Preconditions: Attacker has XSS or console access in the victim's browser session.
  Victim must own the target VPORT.
- Blast Radius: Single actor — only the victim's own VPORTs can be targeted
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED — the DB ownership gate is the only server-side protection;
  UI confirmation is the only soft safety measure
- Why it matters: Hard deletes are irreversible. The confirmation gate is purely client-side.
  While the DB ownership check prevents cross-user attacks, self-sabotage via XSS or console
  is a realistic scenario for a platform that accepts user-generated content.
- Recommended mitigation: Consider adding a server-side confirmation token or rate-limited
  challenge for hard delete. At minimum, log hard delete attempts (actorId, vportId, timestamp)
  to an audit table before executing the RPC — this provides a forensic trail even if the
  operation succeeds. An audit log table (`vport.delete_audit_log`) with `confirmed_at`,
  `vport_id`, `actor_id`, `user_id` would allow admin recovery investigation. Note: this
  is a hardening recommendation, not a blocking security issue.
- Rationale: Irreversible operations benefit from server-side audit trails independent of
  client-side confirmation UI. If a user's session is compromised, an audit log is the only
  way to reconstruct what happened.
- Follow-up command: Carnage (audit log migration), LOGAN (document audit trail requirement)
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Security Operations
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-007
- Location: apps/VCSM/supabase/functions/delete-citizen-account/index.ts : CORS headers
- Application Scope: VCSM
- Platform Surface: Edge Function
- Trust Boundary: Authenticated Citizen (via JWT)
- Boundary Violated: None — this is an infrastructure hardening gap
- Contract Violated: None
- Current behavior: The Edge Function sets:
  ```
  "Access-Control-Allow-Origin": "*",
  ```
  for all responses. This allows any origin (including `evil.example.com`) to make
  preflight OPTIONS requests and read the response payload. The function is a POST-only
  endpoint that verifies the JWT before executing — so the `*` CORS header does not
  enable cross-site data access for the actual destructive operation (the browser's same-origin
  policy enforces that the JWT is not forwarded from third-party scripts unless the site is
  also compromised). However, the wildcard origin means any website can perform a CORS
  preflight and learn that the endpoint exists and accepts POST + Authorization headers.
- Risk: The wildcard CORS header on a destructive Edge Function is a hardening gap. While
  JWT verification blocks unauthorized execution, the wildcard origin:
  (a) Allows any site to learn the endpoint's existence and accepted headers.
  (b) Would allow cross-origin script access to the response body if a victim is social-
      engineered into visiting a malicious site while authenticated (CSRF is mitigated by
      the JWT requirement, but the CORS header defeats the browser's last-resort same-origin
      defense for non-cookie auth schemes if the attacker can inject the Authorization header).
  (c) Is inconsistent with the principle of least privilege for a function that deletes accounts.
- Severity: LOW
- Exploitability: LOW (JWT verification is present; CSRF requires attacker to also obtain
  the victim's JWT — not trivial)
- Attack Preconditions: Attacker must obtain victim's JWT and make a cross-origin request
  to the endpoint. Realistic only under XSS or token theft scenarios.
- Blast Radius: Single actor — deletes only the JWT owner's account
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (Edge Function handles its own auth)
- Why it matters: Defense-in-depth. Restricting CORS to the app's known origin
  (`https://app.vibezcitizens.com` or equivalent) reduces exposure surface for the most
  destructive endpoint in the platform.
- Recommended mitigation: Replace `"Access-Control-Allow-Origin": "*"` with the specific
  application origin from an environment variable:
  ```
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "https://app.vibezcitizens.com"
  ```
  Add the `APP_ORIGIN` secret to the Edge Function's Supabase secrets config.
- Rationale: Restricting CORS to a known origin is standard hardening for destructive
  endpoints. The JWT check is the primary protection; CORS restriction is a secondary layer.
- Follow-up command: LOGAN (document CORS policy for Edge Functions)
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Communications and Network Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-008
- Location: apps/VCSM/src/features/vport/dal/vport.core.dal.js : softDeleteVport, hardDeleteVport, restoreVport
            apps/VCSM/src/features/settings/account/dal/account.write.dal.js : dalDeleteMyVport, dalHardDeleteVport, dalRestoreVport
- Application Scope: VCSM
- Platform Surface: PWA — DAL layer
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: None — this is a code duplication / maintenance risk
- Contract Violated: None
- Current behavior: The soft delete, hard delete, and restore RPC wrappers are duplicated
  across two DAL files:
  - `account.write.dal.js`: `dalDeleteMyVport`, `dalRestoreVport`, `dalHardDeleteVport`
  - `vport.core.dal.js`: `softDeleteVport`, `restoreVport`, `hardDeleteVport`
  Both sets of functions call identical RPCs (`vport.soft_delete_vport`, `vport.hard_delete_vport`,
  `vport.restore_vport`). The error handling logic differs slightly between the two DALs
  (account.write.dal.js throws `new Error(msg)` after string matching; vport.core.dal.js
  uses a `raise()` helper). The Logan spec (Section 7) documents both files as authoritative.
  The `account.controller.js` imports from `account.write.dal.js` only. The `vport.core.dal.js`
  functions are exported on the default object but their callers are not visible in the
  settings flow.
- Risk: Duplicate delete RPC wrappers create a maintenance hazard. If the RPC signature changes,
  or if a security patch is applied to one DAL (e.g., adding rate limiting, audit logging, or
  a pre-flight check), the other DAL may not receive the same patch. A future developer may
  call `vport.core.dal.softDeleteVport()` in a new feature, bypassing any security hardening
  added to the account DAL path. This is a latent consistency risk for a security-sensitive
  operation.
- Severity: LOW
- Exploitability: LOW (no active attack vector; the risk is future regression during maintenance)
- Attack Preconditions: Future developer adds security hardening to one DAL path but not the other.
- Blast Radius: Single actor — affects only the calling user's VPORT
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED (both paths rely on RPC ownership enforcement)
- Why it matters: Two code paths to the same destructive DB operation increase the chance
  of divergence. When security patches, rate limits, or audit logging are added to the delete
  path, both files must be updated — and this is easy to miss.
- Recommended mitigation: Consolidate delete RPC wrappers into a single authoritative DAL file.
  The Logan spec designates `vport.core.dal.js` as the "core vport DAL" and `account.write.dal.js`
  as the "account settings DAL." Recommendation: keep the three delete functions only in
  `vport.core.dal.js` and have `account.write.dal.js` import and re-export them as thin
  wrappers (or import directly from core). Update the Logan spec to reflect the single source.
- Rationale: Single source of truth for security-sensitive operations prevents patch divergence.
- Follow-up command: LOGAN (update spec to designate canonical DAL location), Wolverine (refactor sprint)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-009
- Location: apps/VCSM/src/features/settings/account/dal/account.write.dal.js : dalSoftDeleteCitizenAccount
            apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx : (Citizen mode danger zone)
- Application Scope: VCSM
- Platform Surface: PWA — Citizen account delete flow
- Trust Boundary: Authenticated Citizen
- Boundary Violated: None — confirmed safe; note documented for completeness
- Contract Violated: None
- Current behavior: `dalSoftDeleteCitizenAccount` calls `supabase.rpc('soft_delete_citizen_account')`.
  This is called in `settingsAccountFeature.group.js` (diagnostic) only — it is NOT called from
  `useAccountController.deleteAccount()`. The actual citizen account deletion goes through
  `dalDeleteCitizenAccountFull()` → Edge Function → `soft_delete_citizen_account` RPC internally.
  The Edge Function correctly:
  (1) Verifies the Bearer JWT via `userClient.auth.getUser()`
  (2) Calls `soft_delete_citizen_account` RPC via user-scoped client (auth.uid() enforced)
  (3) Deletes the auth user via admin client only after app data deletion succeeds
  (4) Logs auth deletion failures to `platform.failed_account_deletions` for admin recovery
  The citizen delete flow is correctly isolated — no `userId` is accepted from the client body;
  identity is derived from the JWT exclusively.
- Risk: NONE. The Edge Function is correctly secured. Noted for audit completeness.
- Severity: LOW (informational)
- Exploitability: NONE
- Attack Preconditions: N/A
- Blast Radius: Single actor
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: VERIFIED (Edge Function uses user-scoped client; RPC enforces auth.uid())
- Why it matters: Positive finding — the Edge Function correctly anchors identity to the JWT
  and does not accept caller-supplied user IDs. Service role key never leaves the function.
  The `failed_account_deletions` fallback table is a good operational safety net.
- Recommended mitigation: Only hardening gap is the wildcard CORS header (see VENOM-DELETE-007).
- Rationale: Documented as a verified-safe finding so VENOM coverage is complete for the
  citizen delete flow.
- Follow-up command: None (verified safe)
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Security Operations
```

---

```
VENOM SECURITY FINDING
- Finding ID: VENOM-DELETE-010
- Location: zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.delete-lifecycle.md : Section 6 / Section 9
- Application Scope: VCSM
- Platform Surface: Supabase DB — vc.actors (voiding behavior)
- Trust Boundary: System Service (Database)
- Boundary Violated: None — documented behavioral gap for awareness
- Contract Violated: None
- Current behavior: The hard delete RPC sets `vc.actors.is_void = true` on the VPORT's actor row
  rather than deleting it. The Logan spec explains this correctly (Section 6 / "Why the actor is
  voided"): `vc.post_comments.actor_id` and `vc.messages.sender_actor_id` are RESTRICT FKs to
  `vc.actors`, so hard-deleting the actor row would cascade-nuke social content or block on FK.
  Voiding preserves social content integrity.
  The risk: a voided actor with `is_void = true` that still has an active `vc.actor_follows`,
  `vc.reactions`, or other social graph rows creates a confusing state. Any UI that iterates
  followers of a voided actor or reactions on posts by a voided actor must handle `is_void = true`
  as a tombstone. The Logan spec notes "Any UI that renders actor-based content should check
  `is_void = true` and render a placeholder." There is NO ENFORCEMENT of this at the query layer —
  it is a convention requirement documented in prose.
  Additionally: `vc.actor_follows` rows where `following_actor_id = v_actor_id` (i.e., other users
  who followed the deleted VPORT) are NOT cleaned up in the 11-phase chain. They persist as
  orphaned follow-graph entries — the follower count of the voided actor remains non-zero in the DB
  even though the actor is void.
- Risk: Orphaned actor follows pointing to a voided VPORT actor could:
  - Inflate follower counts on display (if any UI reads follow counts without filtering `is_void`)
  - Allow queries like "actors I follow" to return the voided actor if not filtered
  - Create privacy concern: the follow relationship reveals that a user followed a specific VPORT
    (even after it's deleted) — this data persists indefinitely
- Severity: LOW
- Exploitability: LOW (requires direct DB access or a query that fails to filter `is_void`;
  not directly exploitable from the public API)
- Attack Preconditions: Query that reads actor_follows without filtering is_void on the target.
- Blast Radius: Multi-actor — affects all followers of the deleted VPORT
- Identity Leak Type: Social graph — follow relationship persists after VPORT deletion
- Cache Trust Type: None
- RLS Dependency: ASSUMED (RLS on actor_follows assumed to restrict reads; follow counts may
  be computed from unfiltered aggregates)
- Why it matters: GDPR right-to-erasure requires that deletion removes the subject's data.
  A follow relationship is data about the interaction between two actors — persisting it after
  one actor is hard-deleted is a privacy gap. Follower counts that remain non-zero for voided
  actors also mislead admin tooling.
- Recommended mitigation: Add to Phase 9 of the hard delete chain:
  `DELETE FROM vc.actor_follows WHERE following_actor_id = v_actor_id`
  (removes records of other users following the deleted VPORT — the VPORT stops appearing
  in any "who I follow" list). The reverse — `follower_actor_id = v_actor_id` (the VPORT
  following others) — may also warrant cleanup, but is lower priority. This is a Carnage sprint item.
- Rationale: Hard delete should remove the actor from the social graph entirely. Voiding the
  `vc.actors` row is the correct FK-preservation strategy, but the follow graph should be cleaned.
- Follow-up command: Carnage (extend Phase 9), DB (verify vc.actor_follows FK structure)
- CISSP Domain:
  - Primary: Information Security Governance and Risk Management
  - Secondary: Access Control
```

---

## MITIGATION PLAN

| Finding ID | Severity | Action | Effort | Sprint | Follow-up Command |
|---|---|---|---|---|---|
| VENOM-DELETE-001 | HIGH | Remove `export` from `dalDeleteOwnedVportById`; remove from diagnostics surface contract | LOW | Immediate | SPIDER-MAN |
| VENOM-DELETE-002 | HIGH | Create tracked migration files for `soft_delete_vport`, `restore_vport`, `hard_delete_vport` RPCs | MEDIUM | P1 sprint | Carnage, DB |
| VENOM-DELETE-003 | HIGH | Extend hard delete chain with `vport.resources`, `vport.portfolio_items`, `vport.availability_exceptions`, `vport.availability_rules`, `notification.push_subscriptions` | MEDIUM | P1 sprint | Carnage, DB |
| VENOM-DELETE-004 | MEDIUM | Wire `invalidateVportSlugCache` + `invalidateActorSeoViewCache` into delete controllers; verify `public_actor_seo_v` filters `is_deleted` | LOW | Immediate | LOGAN, DB |
| VENOM-DELETE-005 | MEDIUM | Add controller-layer ownership assertion to `ctrlHardDeleteVport` / `ctrlSoftDeleteVport` | MEDIUM | P1 sprint | Wolverine, SPIDER-MAN |
| VENOM-DELETE-006 | MEDIUM | Add server-side delete audit log table; log hard delete attempts before execution | MEDIUM | P2 sprint | Carnage, LOGAN |
| VENOM-DELETE-007 | LOW | Replace wildcard CORS in Edge Function with app-origin env var | LOW | Immediate | LOGAN |
| VENOM-DELETE-008 | LOW | Consolidate delete DAL wrappers to single source file | LOW | P2 sprint | LOGAN, Wolverine |
| VENOM-DELETE-009 | LOW | Informational — verified safe; no action required | NONE | — | — |
| VENOM-DELETE-010 | LOW | Extend Phase 9 to delete `vc.actor_follows WHERE following_actor_id = v_actor_id` | LOW | P2 sprint | Carnage, DB |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings |
|---|---|
| Access Control | DELETE-001, DELETE-004, DELETE-005, DELETE-006, DELETE-007, DELETE-009, DELETE-010 |
| Software Development Security | DELETE-001, DELETE-002, DELETE-003, DELETE-005, DELETE-008 |
| Information Security Governance and Risk Management | DELETE-003, DELETE-004, DELETE-010 |
| Security Operations | DELETE-002, DELETE-006, DELETE-008, DELETE-009 |
| Communications and Network Security | DELETE-007 |

---

## FINDINGS MATRIX

| Finding | ID | Sev | Exploitability | RLS Dependency | Cascade Risk | Sprint |
|---|---|---|---|---|---|---|
| Deprecated DAL function remains exported + active in diagnostics | DELETE-001 | HIGH | LOW | ASSUMED | None | Immediate |
| Delete RPCs not tracked in migrations (unverifiable grants + DR hazard) | DELETE-002 | HIGH | LOW | UNVERIFIED | Blast on DB reset | P1 |
| Incomplete cascade — 4 tables + push subscriptions orphaned | DELETE-003 | HIGH | LOW | ASSUMED | Multi-actor data residue | P1 |
| TTL cache not invalidated on delete (cache invalidation dead code) | DELETE-004 | MEDIUM | LOW | UNVERIFIED | None | Immediate |
| No controller-layer ownership assertion on delete operations | DELETE-005 | MEDIUM | LOW | REQUIRED | Regression risk | P1 |
| Hard delete confirmation is UI-only; no server-side audit trail | DELETE-006 | MEDIUM | LOW | REQUIRED | None | P2 |
| Edge Function uses wildcard CORS origin | DELETE-007 | LOW | LOW | NONE | None | Immediate |
| Delete DAL wrappers duplicated across two DAL files | DELETE-008 | LOW | LOW | REQUIRED | Patch divergence | P2 |
| Citizen delete Edge Function — verified safe (informational) | DELETE-009 | LOW | NONE | VERIFIED | None | — |
| Actor follows not cleaned up on VPORT hard delete | DELETE-010 | LOW | LOW | ASSUMED | Social graph residue | P2 |

---

## GOVERNANCE VERDICT

**VENOM status for delete-lifecycle: BLOCKED**

Three HIGH findings must be addressed before this module can be marked VERIFIED:

1. **DELETE-001** — Deprecated DAL function remains exported and active in the production bundle
2. **DELETE-002** — Delete RPCs have no tracked migrations (DR hazard + unverifiable grants)
3. **DELETE-003** — Incomplete cascade leaves orphaned data across 4+ tables

The two MEDIUM findings (DELETE-004, DELETE-005) should be addressed in P1 sprint before
this module can advance to VERIFIED. The LOW findings (DELETE-007, DELETE-008, DELETE-010)
can be addressed in P2.

**Recommended VENOM column value: BLOCKED**

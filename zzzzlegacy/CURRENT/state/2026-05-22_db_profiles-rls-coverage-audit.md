# DATABASE REVIEW — Profiles Module RLS Coverage Audit

**Application Scope:** VCSM
**Date:** 2026-05-22
**Reviewer:** DB
**Trigger:** CEREBRO-directed verification of vcsm.profiles.architecture.md — RLS coverage for owner-gated writes
**Mode:** READ-ONLY ANALYSIS ONLY — no schema changes were made or proposed for execution
**Status:** GAPS IDENTIFIED

---

## SCOPE DECLARATION

Review scope: VCSM only (single root)
Tables reviewed via DAL code analysis (no direct DB connection — code-based RLS assumption map):
- `vc.posts`
- `vc.post_media`
- `vc.post_mentions`
- `vc.actors`
- `vc.actor_follows`
- `vc.actor_owners`
- `vport.rates`
- `vport.profiles`
- `vport.services` (implied by upsertVportServicesByActor.dal.js)
- `vport.fuel_prices` (implied by vportFuelPrices.write.dal.js)

---

## PRIOR RLS AUDIT EVIDENCE

The following existing audit and migration artifacts were confirmed present in the repository:

| Artifact | Path | Relevance |
|---|---|---|
| vc.posts INSERT gap | `_HISTORY/db/snapshots/2026-05-19_16-00_db_vc-posts-insert-rls-gap.md` | CRITICAL — confirmed INSERT policy gap |
| Carnage ownership hardening | `_ACTIVE/audits/migrations/2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md` | Pending fix proposal for vc.posts INSERT |
| vport RLS full schema | `_HISTORY/db/snapshots/2026-05-14_18-45_db_vport-rls-full-schema-audit.md` | vport schema RLS state as of 2026-05-14 |
| feed RLS delta | `_ACTIVE/audits/migrations/2026-05-18_carnage_feed-dal-rls-delta.md` | Feed table RLS alignment |
| vc.posts privacy RLS migration | `apps/VCSM/supabase/migrations/20260510020000_vc_posts_privacy_rls.sql` | SELECT policy exists for privacy |
| BlackWidow feed adversarial | `_ACTIVE/audits/migrations/2026-05-18_blackwidow_feed-dal-rls-adversarial.md` | Red team findings on feed RLS |

---

## DATABASE REVIEW ITEMS

---

### DATABASE REVIEW ITEM — DR-001

- **Object:** `vc.posts` — INSERT policy
- **Application Scope:** VCSM
- **Current behavior:** The `posts_insert_actor_owner` RLS policy does NOT verify actor ownership via the `vc.actor_owners` table according to the existing audit at `2026-05-19_16-00_db_vc-posts-insert-rls-gap.md`. The policy allows authenticated users to INSERT posts for any `actor_id` without verifying they are an owner of that actor.
- **Problem:** Any authenticated user can create posts on behalf of any actor's identity. Actor impersonation via feed post is possible at the database level. A malicious authenticated user who knows a target actor's UUID can create posts that appear in that actor's feed.
- **Why it matters:** This is the foundation of feed trust. If RLS permits unauthorized INSERTs on `vc.posts`, the entire feed publishing contract is broken at the DB layer. Application-layer ownership checks can be bypassed by direct Supabase client calls.
- **Recommended improvement:** Add `actor_id IN (SELECT actor_id FROM vc.actor_owners WHERE user_id = auth.uid())` to the INSERT policy. This ensures only authenticated owners of the actor can create posts on its behalf.
- **Rationale:** RLS must enforce actor ownership at the DB layer, not just at the application layer.
- **Risk if unchanged:** Feed contamination — any authenticated Citizen can post as any actor. **RELEASE-BLOCKING.**
- **Example SQL proposal (text only, do not run):**
  ```sql
  -- Existing gap — INSERT policy example that may be incorrect:
  -- CREATE POLICY posts_insert_actor_owner ON vc.posts FOR INSERT
  --   WITH CHECK (auth.uid() IS NOT NULL);
  
  -- Corrected policy proposal (text only, for manual review and Carnage migration):
  CREATE POLICY posts_insert_actor_owner ON vc.posts
    FOR INSERT
    WITH CHECK (
      actor_id IN (
        SELECT actor_id
        FROM vc.actor_owners
        WHERE user_id = auth.uid()
      )
    );
  ```
- **Prior audit cross-reference:** `2026-05-19_16-00_db_vc-posts-insert-rls-gap.md`, Carnage proposal `2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md`
- **Follow-up command:** Carnage (migration execution required)
- **Severity:** CRITICAL — RELEASE-BLOCKING

---

### DATABASE REVIEW ITEM — DR-002

- **Object:** `vport.services` — INSERT/UPDATE policy (ownership enforcement)
- **Application Scope:** VCSM
- **Current behavior:** `upsertVportServices.controller.js` contains the comment `// Ownership enforced by RLS` with no controller-level ownership assertion. `upsertVportServicesByActor.dal.js` resolves a `profileId` from `actorId` and upserts service rows on `vport.services` using a unique constraint on `(profile_id, key)`. No app-layer identity comparison exists in either file.
- **Problem:** The `vport.services` table RLS policy coverage is unverified in available audit artifacts. The vport RLS schema audit at `2026-05-14_18-45_db_vport-rls-full-schema-audit.md` covers the vport schema as of 2026-05-14 — it is unclear whether `vport.services` ownership INSERT/UPDATE policy verifies actor ownership via `actor_owners` or via `vport.profiles`.
- **Why it matters:** If `vport.services` RLS only filters by authenticated session without an actor_owners check, any authenticated user who knows a target actorId can upsert services for any VPORT — overwriting existing service catalogs. This is a data integrity and business logic risk.
- **Recommended improvement:** Verify `vport.services` has a RLS policy checking that the authenticated user is an owner of the associated actor via `actor_owners`. If not present, a Carnage migration is required.
- **Rationale:** Write operations on business-critical tables (services catalog) must have RLS enforcing actor ownership, as the controller layer currently provides no app-layer defense.
- **Risk if unchanged:** Unauthorized service upserts across any VPORT whose actorId is known. **HIGH risk.**
- **Example SQL proposal (text only, do not run):**
  ```sql
  -- Proposed policy pattern for vport.services (text only, for manual review):
  CREATE POLICY services_upsert_owner ON vport.services
    FOR ALL
    USING (
      profile_id IN (
        SELECT vp.id
        FROM vport.profiles vp
        JOIN vc.actor_owners ao ON ao.actor_id = vp.actor_id
        WHERE ao.user_id = auth.uid()
      )
    )
    WITH CHECK (
      profile_id IN (
        SELECT vp.id
        FROM vport.profiles vp
        JOIN vc.actor_owners ao ON ao.actor_id = vp.actor_id
        WHERE ao.user_id = auth.uid()
      )
    );
  ```
- **Follow-up command:** Carnage (verify and migrate if gap confirmed)
- **Severity:** HIGH — requires verification against actual RLS policy

---

### DATABASE REVIEW ITEM — DR-003

- **Object:** `vc.posts` — SELECT policy (privacy enforcement)
- **Application Scope:** VCSM
- **Current behavior:** Migration `20260510020000_vc_posts_privacy_rls.sql` confirms that a SELECT RLS policy exists for privacy enforcement on `vc.posts`. However, the application's `useProfileGate.js` implements privacy gating entirely at the client layer using `useActorPrivacy()`, `useFollowStatus()`, and `useBlockStatus()`. The controller `getActorPostsController` (via the profiles path) does not appear to add server-side privacy verification before returning posts.
- **Problem:** The SELECT policy exists, but it is unclear whether it correctly handles:
  1. Private profiles (`actor_privacy.is_private = true`) — does the policy block non-followers?
  2. Blocked actors — does the policy block both directions of blocking?
  3. Self-view — does the policy correctly permit owners to see their own posts regardless of privacy?
- **Why it matters:** Client-side privacy gating (`useProfileGate.js`) can be bypassed via direct API calls or browser state manipulation. If the SELECT RLS policy has any gaps (e.g., only filters on `is_private` but not follow status), private profile posts leak to non-followers who bypass the client gate.
- **Recommended improvement:** Read and verify the content of `20260510020000_vc_posts_privacy_rls.sql`. Confirm the policy covers: (1) private profile + non-follower block, (2) block relationship in both directions, (3) self-view passthrough. If any case is missing, a Carnage migration is required.
- **Rationale:** Defense-in-depth — server RLS must enforce what the client gate attempts to enforce.
- **Risk if unchanged:** Private profile post content accessible to non-followers via direct API. **HIGH risk.**
- **Example SQL proposal (text only, do not run):**
  ```sql
  -- Reference pattern only — actual policy may differ:
  -- Verify these cases are covered in the existing migration:
  -- CASE 1: Public profile — allow all reads
  -- CASE 2: Private profile — allow only owner + followers
  -- CASE 3: Blocked actor — deny reads in both directions
  -- CASE 4: Self-view — always allow
  ```
- **Follow-up command:** Carnage (verify policy completeness; migrate if gaps found)
- **Severity:** HIGH — requires policy content verification

---

### DATABASE REVIEW ITEM — DR-004

- **Object:** `vport.fuel_prices` — owner-gated write
- **Application Scope:** VCSM
- **Current behavior:** `vportFuelPrices.write.dal.js` upserts fuel prices. `submitFuelPriceSuggestion.controller.js` has a two-layer owner check on the owner-write path (explicit identity comparison + comment expecting RLS enforcement). The controller check is present at the app layer ✓. However, the DAL-level write has no app-layer identity check.
- **Problem:** The RLS policy on `vport.fuel_prices` for the owner-write path is unverified in available audit artifacts. If the policy only checks session authentication (not actor ownership), a direct Supabase client call with a known `profile_id` could upsert official fuel prices without going through the controller.
- **Why it matters:** Gas stations display official prices to the public. Unauthorized writes could inject false prices that affect consumer trust and the VPORT's reputation.
- **Recommended improvement:** Verify `vport.fuel_prices` or equivalent table has RLS requiring actor ownership for the `is_official = true` or owner-write path.
- **Rationale:** Price data is trust-critical for gas station VPORTs.
- **Risk if unchanged:** False fuel price injection by authenticated users who know a gas station's `profile_id`. **MEDIUM-HIGH risk.**
- **Example SQL proposal (text only, do not run):**
  ```sql
  -- Proposed pattern for owner fuel price writes (text only):
  CREATE POLICY fuel_prices_owner_write ON vport.fuel_prices
    FOR INSERT
    WITH CHECK (
      profile_id IN (
        SELECT vp.id
        FROM vport.profiles vp
        JOIN vc.actor_owners ao ON ao.actor_id = vp.actor_id
        WHERE ao.user_id = auth.uid()
      )
    );
  ```
- **Follow-up command:** Carnage (verify existing policy; migrate if owner enforcement missing)
- **Severity:** MEDIUM-HIGH

---

### DATABASE REVIEW ITEM — DR-005

- **Object:** Multiple profiles DAL files — `select('*')` prohibition verification
- **Application Scope:** VCSM
- **Current behavior:** VCSM architecture contract prohibits `select('*')` — all DAL files must use explicit column lists. The profiles module has 72 DAL files, many of them reading from complex multi-table scenarios.
- **Problem:** Given the size of the profiles module (72 DAL files), unreviewed DAL files may contain `select('*')` calls that return more columns than needed, increasing data transfer and exposing columns that should not reach the client.
- **Why it matters:** Over-broad SELECTs increase payload size on a high-traffic module (profile is "visited frequently" per the source document). They also return internal fields (deleted_at, created_at, internal flags) that clients should not receive.
- **Recommended improvement:** Run a static analysis scan across all 72 profiles DAL files for `.select('*')` patterns. Any found must be replaced with explicit column lists.
- **Rationale:** Architecture contract + data minimization principle.
- **Risk if unchanged:** Internal fields leaked to client; excess bandwidth on a hot-path module.
- **Example SQL proposal:** N/A — this is a DAL code audit concern, not a schema change.
- **Follow-up command:** LOGAN (code audit for select('*') in 72 profiles DAL files)
- **Severity:** MEDIUM

---

### DATABASE REVIEW ITEM — DR-006

- **Object:** `vc.actor_follows` — `readFollowState.dal.js`
- **Application Scope:** VCSM
- **Current behavior:** `readFollowState.dal.js` reads from `vc.actor_follows` (named `actor_follows` in the schema reference). The DAL includes UUID validation before the query but no authentication check.
- **Problem:** The follow state read is used to gate profile visibility. If `vc.actor_follows` RLS permits reads by any authenticated user (not just the actors involved), follow state could be enumerated for any pair of actors — revealing social graph topology.
- **Why it matters:** Social graph information (who follows whom) is sensitive for actors with private profiles. If a private profile user's follower list can be enumerated by any authenticated user, privacy expectations are violated.
- **Recommended improvement:** Verify `vc.actor_follows` SELECT policy restricts reads to: (1) the follower actor's owner, (2) the followed actor's owner, or (3) public reads only for follow counts, not identity mapping.
- **Rationale:** Social graph topology should be protected for private-profile actors.
- **Risk if unchanged:** Social graph enumeration for private actors. **MEDIUM risk.**
- **Follow-up command:** Carnage (if RLS gap confirmed)
- **Severity:** MEDIUM

---

## RLS ASSUMPTION MAP — PROFILES MODULE

| Table | Schema | Write Auth Status | Read Auth Status | App-Layer Check | RLS Assumed | DB Verified | Risk |
|---|---|---|---|---|---|---|---|
| `vc.posts` | vc | CRITICAL GAP (INSERT) | Policy exists (privacy migration) | No (profiles reads only) | YES | PARTIAL | HIGH |
| `vc.post_media` | vc | N/A (profiles reads only) | Unknown | No | YES | NO | MEDIUM |
| `vport.services` | vport | UNVERIFIED — controller trusts RLS | Unknown | NO | YES | NO | HIGH |
| `vport.rates` | vport | Partial — controller has check | Unknown | PARTIAL | YES | NO | MEDIUM |
| `vport.fuel_prices` | vport | Partial — controller has check | Unknown | PARTIAL | YES | NO | MEDIUM |
| `vc.actor_owners` | vc | N/A (ownership check only) | Restricted by explicit params | Partial | YES | NO | MEDIUM |
| `vc.actor_follows` | vc | N/A (profiles reads only) | Unknown | No | YES | NO | MEDIUM |
| `vport.profiles` | vport | N/A (read-only in profiles) | Unknown | No | YES | NO | LOW |
| `public.profiles` | public | N/A (read-only in profiles) | Known — fix migration exists | No | YES | PARTIAL | LOW |

---

## DB FINAL STATUS

**Critical gaps confirmed (from existing audits):** 1 — `vc.posts` INSERT ownership RLS
**Unverified tables (write paths):** `vport.services`, `vport.fuel_prices`, `vport.rates`
**Unverified tables (read paths):** `vc.actor_follows`, `vport.profiles`, `vc.post_media`
**Recommended next command:** Carnage (execute ownership hardening migration for vc.posts; verify vport.services and vport.fuel_prices policies)

**RELEASE-BLOCKING items:** DR-001 (vc.posts INSERT RLS gap — confirmed from prior audit, Carnage proposal pending at 2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md)

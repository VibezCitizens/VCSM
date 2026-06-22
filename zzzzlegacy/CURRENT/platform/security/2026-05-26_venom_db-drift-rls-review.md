# VENOM SECURITY REPORT — DB Drift RLS Review
**Date:** 2026-05-26  
**Reviewer:** VENOM  
**Trigger:** CARNAGE + DB migration reconciliation identified 4 active security findings from live DB policy drift  
**Input:** `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-26_18-00_db_migration-reconciliation.md`  
**Scope:** VCSM  
**Findings:** 0 CRITICAL | 0 HIGH | 3 MEDIUM | 1 LOW  

---

## VENOM TARGET

**Feature / Route / Engine:** Database RLS policy state — drift between local migration files and live DB  
**Application Scope:** VCSM  
**Reason for review:** 19 LOCAL_ONLY migrations identified; 3 with PARTIAL drift (objects mismatched or missing) and 1 with legacy policy accumulation. Security posture of affected tables must be classified before migration history registration proceeds.  
**Primary trust boundary:** Authenticated actor boundary (PostgREST authenticated role vs anon role)

---

## SECURITY SURFACE

**Entry point:** PostgREST API surface (Supabase auto-generated REST + RPC endpoints)  
**Auth source:** Supabase Auth JWT → `auth.uid()`, resolved via `vc.actor_owners` to `actorId`  
**Authorization layer:** RLS policies on `vport.availability_rules`, `platform.media_assets`, `moderation.actions`, `vport.fuel_price_submissions`  
**Identity surface:** `actor_owners` (expected), `auth.uid()` direct (where present), `{public}` role bypasses (risky)  
**Sensitive objects involved:** Booking availability windows, media asset lifecycle, actor moderation records, fuel price submission records

---

## TRUST BOUNDARY TRACE

**Client input:** REST/RPC requests from authenticated Supabase client  
**Validated at:** PostgREST role gate (anon vs authenticated) → RLS policy evaluation  
**Identity resolved at:** `auth.uid()` in RLS USING/WITH CHECK clauses; `vc.actor_owners` join for actor ownership  
**Authorization enforced at:** RLS policies per table (DB layer only — no app-layer secondary enforcement identified)  
**Data returned to:** VCSM React client (authenticated actor session)

---

## SECURITY RISK FINDINGS

**Missing authorization:** F-002 — media_assets restrictive soft-delete UPDATE policy missing; broad column UPDATE permitted  
**Identity misuse:** F-001, F-004 — {public} role policies bypass PostgREST role gate, shifting all enforcement burden onto SECURITY DEFINER function conditions  
**Sensitive data exposure:** F-003 — moderation.actions policy condition equivalence unverified; potential INSERT scope mismatch  
**Unsafe debug leakage:** NONE detected  
**Policy assumption risks:** F-001 — legacy policies on `vport.availability_rules` co-exist with new policies, creating OR-semantics accumulation risk  
**Dependency boundary risks:** F-001, F-004 — PERMISSIVE mode OR semantics mean legacy {public} policies always evaluate alongside new {authenticated} ones  

---

## FINDING F-001 — vport.availability_rules: Legacy {public} Write Policies + Undropped Legacy Policies

**VENOM SECURITY FINDING**

- **Location:** `vport.availability_rules` — policies `availability_rules_manage_neutral` (ALL, {public}), `availability_rules_select_neutral` (SELECT, {public}), `availability_rules_delete` (DELETE, {public}), `availability_rules_insert` (INSERT, {public}), `availability_rules_update` (UPDATE, {public})
- **Application Scope:** VCSM
- **Current behavior:**
  - Three write policies (delete, insert, update) are assigned to the `{public}` role. In PostgREST's role model, `{public}` applies to both anon and authenticated sessions. Their conditions call `SECURITY DEFINER` functions (`actor_can_manage_profile`, `current_actor_can_manage_resource`) which return false for anon callers (because `vc.current_actor_id()` returns NULL when no auth JWT is present). So no anon write is permitted in practice.
  - Two legacy policies (`availability_rules_manage_neutral` ALL, `availability_rules_select_neutral` SELECT) were supposed to be dropped by migration 20260515010000 but were not. They remain live alongside the new policies.
  - `availability_rules_select_neutral` ({public}, SELECT) allows unauthenticated read of active rules (`is_active = true`) without an auth check, by design for public booking calendar display.
  - In PERMISSIVE RLS mode, all matching policies evaluate with OR semantics. The presence of {public} write policies means any role reaching the table has at least one policy evaluate its write attempt — enforcement falls entirely to the SECURITY DEFINER guard conditions.

- **Risk:** PostgREST's role-based GRANT check is bypassed for {public} policies. If `actor_can_manage_profile()` or `current_actor_can_manage_resource()` ever returns a permissive result due to a function bug or search_path drift, the {public} role would provide no secondary enforcement gate. Additionally, the two legacy policies not dropped by 20260515010000 create policy accumulation — `availability_rules_manage_neutral` (ALL cmd) overlaps with all write operations.
- **Severity:** MEDIUM
- **Exploitability:** LOW
- **Attack Preconditions:**
  - A bug must be introduced into `actor_can_manage_profile()` or `current_actor_can_manage_resource()` that makes them return true for a NULL actorId
  - OR an anon caller must reach the table and have the SECURITY DEFINER guard function evaluate incorrectly
  - No current active exploit path identified — risk is forward-looking / defense-in-depth gap
- **Blast Radius:** Multi-actor — all vport.availability_rules records for all VPORTs. If the guard functions fail, any anon caller could INSERT/UPDATE/DELETE availability windows.
- **Why it matters:**
  - Booking availability windows directly control which time slots are bookable. Unauthorized writes to this table would allow an attacker to block or manufacture available slots for any VPORT.
  - The {public} role policies survive `supabase db push` migrations that target only {authenticated} — they persist silently unless explicitly dropped.
  - Policy accumulation across audit cycles creates confusion for future reviewers and hides the actual enforcement model.
- **Recommended mitigation:**
  1. Drop `availability_rules_manage_neutral` and `availability_rules_select_neutral` (incomplete cleanup from 20260515010000)
  2. Change `availability_rules_delete`, `availability_rules_insert`, `availability_rules_update` from `{public}` to `{authenticated}`
  3. Re-create these policies scoped to `TO authenticated` with the same SECURITY DEFINER guard conditions
  4. Register in a new cleanup migration (CARNAGE Phase 6, Cleanup Migration A)
- **Rationale:** Matches the pattern established by migrations 20260515010000–20260515020000 which correctly used {authenticated} for the new resource/availability policy set. Defense-in-depth requires that both PostgREST role gate AND RLS policy conditions enforce the boundary.
- **Follow-up command:** CARNAGE (Phase 6 Cleanup Migration A already planned), THOR (release gate)

**CISSP Domain:**
- **Primary:** Identity and Access Management (Domain 5) — Role assignment on RLS policies determines effective authentication enforcement layer
- **Secondary:** Security Architecture and Engineering (Domain 3) — Defense-in-depth gap when {public} role bypasses PostgREST role gate; Software Development Security (Domain 8) — Legacy policy accumulation from incomplete migration cleanup

**Trust Boundary:** Authenticated VPORT Owner (mis-scoped to Public Visitor via {public} role)

---

## FINDING F-002 — platform.media_assets: Missing Restrictive Soft-Delete UPDATE Policy

**VENOM SECURITY FINDING**

- **Location:** `platform.media_assets` — missing policy `"actor owner can soft delete media asset"` (UPDATE, authenticated, restricted to status='deleted' columns only). Current live state: `media_assets_vc_owner_update` (UPDATE, {public}, no column restriction)
- **Application Scope:** VCSM
- **Current behavior:**
  - `media_assets_vc_owner_update` allows an actor to UPDATE **any column** on their own media assets (owner_source='vc' AND EXISTS actor_owners, {public} role). This includes `storage_key`, `owner_actor_id`, `status`, and all metadata columns.
  - Migration 20260519200000 intended to add a column-restrictive soft-delete policy that limits UPDATE to only `status`, `deleted_at`, `deleted_by_actor_id`, `updated_at`, and enforces that `status = 'deleted'` in the WITH CHECK.
  - The migration was applied out-of-band but the CREATE POLICY was never executed — only the broader policy exists.
  - The column-level GRANT `GRANT UPDATE (status, deleted_at, deleted_by_actor_id, updated_at) ON platform.media_assets TO authenticated` was also not verified as present.

- **Risk:** An authenticated actor with ownership over a media asset can:
  - Change `storage_key` to point to a different storage object (media reference corruption)
  - Change `owner_actor_id` to reassign the asset to a different actor (ownership transfer outside intended flow)
  - Set `status` to arbitrary values beyond 'deleted' (lifecycle integrity violation)
  - Overwrite any audit metadata column
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - Authenticated VCSM account required
  - Must own at least one media asset (normal upload flow)
  - Must know or guess the UUID of the media asset to target (available from their own dashboard)
  - Can modify their own assets only — no cross-actor exposure
- **Blast Radius:** Single actor — an actor can only modify assets they own. No cross-actor data exposure. Risk is data integrity of the media registry (storage_key corruption, owner_actor_id reassignment).
- **Why it matters:**
  - If `storage_key` is writable by the actor, they can make their media record point to any storage path — corrupting the media registry for their profile or VPORT.
  - If `owner_actor_id` is writable, an actor could re-assign a media asset's ownership to another actor they do not own — breaking the actor ownership model for media.
  - Soft-delete lifecycle loses meaning if `status` can be set to arbitrary values (e.g., 'active', 'archived', 'flagged') directly by the actor.
  - The principle of least privilege requires the soft-delete UPDATE path to be restricted to the lifecycle columns only.
- **Recommended mitigation:**
  1. Apply the column-level GRANT: `GRANT UPDATE (status, deleted_at, deleted_by_actor_id, updated_at) ON platform.media_assets TO authenticated`
  2. Create the restrictive soft-delete policy (see CARNAGE Phase 1, Fix 1a SQL proposal)
  3. Evaluate whether `media_assets_vc_owner_update` should be dropped, narrowed, or supplemented with explicit column restrictions
  4. Verify `media_assets_vc_owner_update` role is also {public} — if so, re-create as {authenticated} for defense-in-depth
- **Rationale:** Principle of least privilege — actors should only be able to write the minimum columns required for the soft-delete operation. The media registry is a trusted source of truth for VPORT portfolio display.
- **Follow-up command:** CARNAGE (Phase 1 Fix 1a), ELEKTRA (verify media DAL write paths), THOR (release gate)

**CISSP Domain:**
- **Primary:** Identity and Access Management (Domain 5) — Ownership-scoped UPDATE enforcement; actor cannot exceed intended column write scope
- **Secondary:** Asset Security (Domain 2) — Media asset column write surface; protecting storage_key and owner_actor_id from unauthorized modification; Software Development Security (Domain 8) — Missing column-level grant and incomplete policy application

**Trust Boundary:** Authenticated VPORT Owner (excessive column UPDATE surface within own-actor scope)

---

## IDENTITY SURFACE WARNING — F-002

**Location:** `platform.media_assets` — `media_assets_vc_owner_update` policy  
**Current identity surface:** `owner_actor_id` compared via `EXISTS actor_owners WHERE actor_owners.actor_id = media_assets.owner_actor_id AND actor_owners.user_id = auth.uid()` — correct actor ownership check  
**Expected identity surface:** Same (actor_owners join via auth.uid()) — identity surface is correct  
**Risk:** Identity check is correct; the risk is column scope, not identity resolution  
**Suggested correction:** Add column-level restrictions or supplementary policy; do not change identity surface

---

## FINDING F-003 — moderation.actions: Policy Name and Condition Mismatch

**VENOM SECURITY FINDING**

- **Location:** `moderation.actions` — migration 20260518020000 defined `"actions_select_own_actor"` (SELECT) and `"actions_insert_own_actor"` (INSERT). Live DB has: `actions_delete_own_hide`, `actions_insert_self_hide`, `actions_select_own`, `moderation_actions_insert_moderator`, `moderation_actions_select_moderator`, `moderation_actions_update_moderator` (DELETE, INSERT×2, SELECT×2, UPDATE).
- **Application Scope:** VCSM
- **Current behavior:**
  - The policies from migration 20260518020000 were never applied. Instead, a different policy set exists on the live table — apparently applied via SQL editor with different naming conventions.
  - `"actions_insert_self_hide"` suggests narrower INSERT scope (only self-hide actions) vs. the migration's intent of any actor_id in actor_owners.
  - `"actions_select_own"` (SELECT, authenticated) covers actor-level SELECT but condition is unverified.
  - Moderator-specific policies (`moderation_actions_insert_moderator`, `moderation_actions_select_moderator`, `moderation_actions_update_moderator`) are present and not in the original migration — these appear to be enhancements.
  - The actual USING/WITH CHECK conditions for the live policies have not been inspected (requires `pg_policies.qual` inspection).
- **Risk:** If `actions_insert_self_hide` is narrower than intended (only allows inserting self-hide moderation records), then:
  - Users may be blocked from legitimate actor-level moderation actions that are not self-hides
  - The moderation flow may silently fail at the DB layer rather than returning an explicit auth error
  - Conversely, if conditions are broader than intended, users could insert moderation actions for actor_ids they don't own
- **Severity:** MEDIUM
- **Exploitability:** LOW (uncertainty — risk depends on actual conditions which are unverified)
- **Attack Preconditions:**
  - Authenticated VCSM account required
  - Must understand the moderation.actions schema and which actor_ids can be targeted
  - If INSERT is restricted to self-hide only: no escalation possible, only potential legitimate functionality block
  - If INSERT is over-broad: could INSERT moderation records for other actors — requires actor_id knowledge
- **Blast Radius:** Single actor (own moderation records if correctly scoped) or Multi-actor (if INSERT condition is over-broad and allows cross-actor moderation record insertion).
- **Why it matters:**
  - `moderation.actions` governs what moderation events are recorded per actor. Incorrect INSERT scope means either legitimate moderation actions fail silently or users can fabricate moderation records for other actors.
  - The architecture contract requires actor ownership to be verified through `vc.actor_owners` — unverified conditions on this table may deviate from the canonical identity model.
  - The policy name drift (`self_hide` vs `own_actor`) suggests the live state may have evolved past the migration's intent without a tracking migration to document the change.
- **Recommended mitigation:**
  1. Run condition inspection (CARNAGE Phase 1, Fix 1b): `SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname = 'moderation' AND tablename = 'actions'`
  2. Compare `actions_insert_self_hide` USING/WITH CHECK against migration 20260518020000 intent
  3. If equivalent or stronger: mark migration as superseded, INSERT history record
  4. If weaker or non-equivalent: apply canonical policies from migration, then INSERT history record
  5. Document moderator policies (`moderation_actions_insert_moderator` etc.) in a tracked migration to explain their origin
- **Rationale:** Architecture contract requires all ownership enforcement to use `vc.actor_owners` join pattern. Unverified policy conditions on moderation tables are a security audit gap.
- **Follow-up command:** DB (condition inspection query), CARNAGE (Phase 1 Fix 1b), ELEKTRA (verify moderation DAL paths)

**CISSP Domain:**
- **Primary:** Security Assessment and Testing (Domain 6) — Live policy conditions unverified; no audit evidence that conditions match architectural intent
- **Secondary:** Identity and Access Management (Domain 5) — actor_owners-based ownership enforcement on moderation records; Software Development Security (Domain 8) — policy naming drift and missing tracking migration

**Trust Boundary:** Authenticated Citizen → Moderation subsystem (INSERT scope unclear)

---

## FINDING F-004 — vport.fuel_price_submissions: Legacy {public} Policy Accumulation

**VENOM SECURITY FINDING**

- **Location:** `vport.fuel_price_submissions` — legacy policies: `fuel_price_submissions_insert_own` ({public}, INSERT), `fuel_price_submissions_select_own` ({public}, SELECT), `citizen_insert_fuel_price_submission` (legacy), `citizen_select_fuel_price_submission` (legacy), `owner_update_fuel_price_submission` (legacy). Co-exist alongside new canonical policies from migration 20260526010000.
- **Application Scope:** VCSM
- **Current behavior:**
  - `fuel_price_submissions_insert_own` ({public}) has WITH CHECK including `auth.uid() IS NOT NULL` — anon callers are blocked at evaluation time.
  - `fuel_price_submissions_select_own` ({public}) uses `vc.current_actor_id()` which returns NULL for anon — no rows visible to anon.
  - The three older legacy policies (`citizen_*`, `owner_*`) predate the canonical naming convention and use `vc.current_actor_id()` pattern.
  - All 5 legacy policies co-exist alongside the 4 new policies from 20260526010000 (`fuel_price_submissions_select_manager`, `fuel_price_submissions_select_submitter`, `fuel_price_submissions_insert_citizen`, `fuel_price_submissions_update_manager`).
  - In PERMISSIVE mode, the effective policy set is the union of all matching policies via OR semantics.

- **Risk:** Policy accumulation creates governance debt and audit confusion. If both legacy and new policies allow the same operations, any future change to one set does not cleanly define the access model. The {public} role on INSERT/SELECT bypasses PostgREST role gate for fuel_price_submissions.
- **Severity:** LOW
- **Exploitability:** LOW
- **Attack Preconditions:**
  - `fuel_price_submissions_insert_own` requires `auth.uid() IS NOT NULL` → anon is blocked
  - No current active exploit path — risk is forward-looking governance debt
  - Would require a function-level bug in `vc.current_actor_id()` or `auth.uid()` behavior change
- **Blast Radius:** Single actor (own submissions only). Legacy policies are functionally restricted to the submitting actor.
- **Why it matters:**
  - Policy accumulation across 3+ audit cycles is a security hygiene issue. Future reviewers cannot determine which policy set is authoritative.
  - Mixed {public}/{authenticated} roles on the same table create maintenance risk — changes to one role's policies must account for the other role's policies to remain coherent.
  - If a future migration drops the new policies but leaves the legacy ones, the table falls back to legacy behavior silently.
- **Recommended mitigation:**
  1. After confirming the new policies from 20260526010000 cover all access paths, drop all 5 legacy policies
  2. Write as Cleanup Migration B (CARNAGE Phase 6): dedicated `20260527020000_cleanup_fuel_price_submissions_legacy_policies.sql`
  3. Register the cleanup migration in history after applying
- **Rationale:** Single authoritative policy set per table. Legacy accumulation must be resolved before the table's RLS state can be considered clean for future audit.
- **Follow-up command:** CARNAGE (Phase 6 Cleanup Migration B)

**CISSP Domain:**
- **Primary:** Security Architecture and Engineering (Domain 3) — Defense-in-depth relies on clear, non-redundant policy sets; PERMISSIVE OR semantics make policy accumulation a structural risk
- **Secondary:** Security Operations (Domain 7) — Policy accumulation creates audit complexity and operational confusion for future security reviewers

**Trust Boundary:** Authenticated Citizen (mis-scoped to Public Visitor via {public} role on legacy INSERT/SELECT policies)

---

## MITIGATION PLAN

| Risk | Recommended Change | Why It Works | Layer to Fix | Follow-up |
|---|---|---|---|---|
| F-001: {public} write policies on availability_rules + undropped legacy policies | Drop legacy policies; re-create write policies as {authenticated} | Enforces PostgREST role gate before RLS evaluation; eliminates redundant legacy policies | DB (SQL editor cleanup migration) | CARNAGE Phase 6A, THOR |
| F-002: Missing soft-delete restriction on media_assets | Apply column-level GRANT + create restrictive UPDATE policy; evaluate broad policy for narrowing | Enforces least-privilege on UPDATE path; prevents storage_key and owner_actor_id reassignment | DB (SQL editor Phase 1 fix) | CARNAGE Phase 1, ELEKTRA |
| F-003: moderation.actions condition mismatch | Inspect live conditions; mark as superseded or apply canonical policies | Verifies ownership model matches architecture contract | DB (inspection first, then decision) | DB inspection, CARNAGE Phase 3 |
| F-004: fuel_price_submissions legacy policy accumulation | Drop 5 legacy policies after verifying new policies cover all paths | Single authoritative policy set; eliminates {public} role legacy accumulation | DB (SQL editor cleanup migration) | CARNAGE Phase 6B |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No policy/governance violations at the contract level detected beyond scope of findings |
| Asset Security | 1 | F-002: media asset column write surface; storage_key and owner_actor_id over-exposure |
| Security Architecture and Engineering | 3 | F-001, F-003, F-004: {public} role bypass, defense-in-depth gap, policy accumulation |
| Communication and Network Security | 0 | PostgREST endpoint surface not examined in this scope |
| Identity and Access Management | 3 | F-001, F-002, F-003: Role assignment issues, UPDATE scope, actor_owners enforcement verification |
| Security Assessment and Testing | 1 | F-003: Unverified policy conditions; no audit evidence of equivalence to migration intent |
| Security Operations | 1 | F-004: Legacy policy accumulation creates audit complexity |
| Software Development Security | 3 | F-001, F-002, F-003: Incomplete migration cleanup, missing policy application, naming drift |

**CISSP Completion Check:**
- ✅ All findings assigned CISSP domains
- ✅ CISSP summary table included
- ⚠️ Security and Risk Management: covered implicitly by governance drift classification but no contract-level violations detected in this scope
- ⚠️ Communication and Network Security: out of scope for this review (DB-layer analysis only; endpoint surface deferred to HAWKEYE)

---

## RECOMMENDED COMMAND CHAIN

Based on findings above:

1. **CARNAGE** (complete) → Phase 1 schema fixes + Phase 6 cleanup migrations
2. **DB** → Run condition inspection query for `moderation.actions` (Fix 1b) before Phase 3 registration
3. **ELEKTRA** → Verify DAL code paths for `platform.media_assets` write operations, `vport.availability_rules` write operations, and `moderation.actions` insert paths against confirmed RLS state
4. **HAWKEYE** → Verify API endpoint contracts for booking availability, media soft-delete, and moderation action paths
5. **THOR** → Release gate decision after all specialist reviews complete

---

## COMPLETION CHECKLIST

- [x] Trust boundaries traced for all 4 findings
- [x] Auth + authorization inspected per finding
- [x] Identity surfaces verified (actor_owners join pattern confirmed correct; {public} role misuse flagged)
- [x] Concrete risks surfaced with severity, exploitability, blast radius
- [x] CISSP domains assigned to each finding
- [x] CISSP summary table produced
- [x] Remained fully read-only
- [x] Mitigations proposed as text only — no code changes, no DB modifications

---

*VENOM analysis complete — read-only security review.*  
*No database changes were made. No source code was modified.*  
*Generated: 2026-05-26*

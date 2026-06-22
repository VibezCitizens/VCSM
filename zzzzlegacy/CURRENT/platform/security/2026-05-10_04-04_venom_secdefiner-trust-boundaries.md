# VENOM — SECURITY DEFINER Trust Boundary Review
**Date:** 2026-05-10  
**Timestamp:** 04-04  
**Mode:** Read-only — analysis only, no changes applied  
**Application Scope:** VCSM + ENGINE  
**Trigger:** SECURITY DEFINER elimination planning session (Carnage/DB/VENOM joint review)  
**Cross-reference (migration plan):** `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-10_04-04_carnage_secdefiner-rls-elimination.md`

---

## VENOM TARGET

```
Feature / Route / Engine: SECURITY DEFINER function surface across all schemas
Application Scope: VCSM + ENGINE
Reason for review: 140 SECURITY DEFINER functions identified — elevated privilege surface must be audited for trust boundary violations, identity misuse, and authorization bypass
Primary trust boundary: PostgreSQL RLS vs SECURITY DEFINER bypass
```

---

## SECURITY SURFACE

```
Entry point: Supabase PostgREST RPC endpoint (/rpc/<function_name>)
Auth source: Supabase JWT → auth.uid()
Authorization layer: PostgreSQL RLS policies (partially) + SECURITY DEFINER functions
Identity surface: auth.uid() (correct), uid parameters (risky — see findings)
Sensitive objects: public.profiles, vc.actors, vc.notifications, learning.* tenant data
```

---

## TRUST BOUNDARY TRACE

```
Client input: RPC call to /rpc/<function_name> with parameters
Validated at: Supabase API layer (JWT verification only) → PostgreSQL function execution
Identity resolved at: auth.uid() inside function bodies (where implemented)
Authorization enforced at: VARIES — some functions enforce it, several do not
Data returned to: Client (PostgREST response)
```

---

## SECURITY RISK FINDINGS

```
Missing authorization: public.admin_delete_user_everywhere — no auth guard
Identity misuse: public.mark_all_messages_seen, public.get_unread_message_total — uid as parameter
Sensitive data exposure: vc.read_actor_profile — returns PII (email, birthdate, age, sex, is_adult)
Unsafe debug leakage: None identified in SECURITY DEFINER surface
Policy assumption risks: Supabase default EXECUTE grant — anon reaches all public.* functions
Dependency boundary risks: 15 legacy social functions writing to dead/removed tables
```

---

## VENOM SECURITY FINDINGS

---

### F-01 — admin_delete_user_everywhere: No Authorization Guard

**VENOM SECURITY FINDING**
- **Location:** `public.admin_delete_user_everywhere(p_user_id uuid)` — full_schema.sql
- **Application Scope:** VCSM
- **Current behavior:** Function accepts any `p_user_id` and executes a full cascading deletion of that user's data across all tables. The function body has no `auth.uid()` check, no role check, and no admin gate. Any authenticated (or anon, if EXECUTE not revoked) caller can invoke this with any UUID.
- **Risk:** Complete user data deletion by any authenticated actor. A single API call from any logged-in user can permanently destroy another user's account, posts, conversations, and all associated data.
- **Severity:** CRITICAL
- **Why it matters:** This is a privilege escalation to the highest destructive operation available — user account deletion — with zero authorization. In a social platform, this means any member can silently erase any other member.
- **Recommended mitigation:**
  1. Immediately: `REVOKE EXECUTE ON FUNCTION public.admin_delete_user_everywhere(uuid) FROM anon, authenticated;`
  2. Add internal admin check before any deletion logic: verify caller is in `learning.platform_admins` or is the `service_role`
  3. Add audit log entry before any deletion — record who called, what was deleted, and when
  4. Long-term: move to server-side admin panel only — never expose via PostgREST RPC
- **Rationale:** Functions that delete data across all user tables must be gated behind a verified admin role check inside the function body, not just trusted to callers.
- **Follow-up command:** DB (add platform_admins check + audit log), BUGSBUNNY (verify no active exploit), Carnage (Batch 5 hardening SQL)
- **CISSP Domain:**
  - **Primary:** Identity and Access Management (5)
  - **Secondary:** Security and Risk Management (1), Software Development Security (8)

---

### F-02 — mark_all_messages_seen: Parameter-Based Identity — No Auth Check

**VENOM SECURITY FINDING**
- **Location:** `public.mark_all_messages_seen(uid uuid)` — full_schema.sql line ~7070
- **Application Scope:** VCSM
- **Current behavior:**
  ```sql
  UPDATE profiles SET last_seen = now() WHERE id = uid;
  ```
  Takes `uid` as a parameter. No `auth.uid()` check. Any caller can pass any UUID and update that profile's `last_seen` timestamp.
- **Risk:** Any authenticated caller can impersonate any user's online presence. They can set `last_seen = now()` for any profile, manipulating presence indicators, read receipts, and "last seen" displays for any user on the platform.
- **Severity:** CRITICAL
- **Why it matters:** Presence spoofing — making it appear any user was recently active — is a trust violation that can affect harassment investigations, evidence of stalking, or platform integrity features. The parameter-based uid pattern is a classic authorization bypass.
- **Recommended mitigation:**
  1. Immediately: `REVOKE EXECUTE ON FUNCTION public.mark_all_messages_seen(uuid) FROM anon, authenticated;`
  2. Rewrite signature to `public.mark_all_messages_seen()` with no parameter — use `auth.uid()` internally
  3. After rewriting, migrate any application callers passing `uid` to use the new parameterless signature
- **Rationale:** Functions that write to a user's own profile state must derive identity from `auth.uid()`, never from a caller-supplied parameter.
- **Follow-up command:** Carnage (Batch 1 revoke + Batch 5 rewrite), BUGSBUNNY (verify active callers)
- **CISSP Domain:**
  - **Primary:** Identity and Access Management (5)
  - **Secondary:** Software Development Security (8)

---

### F-03 — get_unread_message_total: Parameter-Based Identity — Suspected No Auth Check

**VENOM SECURITY FINDING**
- **Location:** `public.get_unread_message_total(uid uuid)`
- **Application Scope:** VCSM
- **Current behavior:** Takes `uid` as parameter. Function body not fully inspected, but the signature pattern matches `mark_all_messages_seen` — a uid-as-parameter function that likely reads `vc.inbox_entries WHERE user_id = uid` without verifying `uid = auth.uid()`.
- **Risk:** Any authenticated caller can query any user's unread count, leaking information about another user's messaging activity and inbox state.
- **Severity:** CRITICAL (pending body verification — if body has `auth.uid()` check, downgrade to HIGH)
- **Why it matters:** Unread message counts are private user data. Exposing them to arbitrary callers reveals communication patterns and activity levels of any user on the platform.
- **Recommended mitigation:**
  1. Immediately: `REVOKE EXECUTE ON FUNCTION public.get_unread_message_total(uuid) FROM anon, authenticated;`
  2. Inspect function body — if no `WHERE uid = auth.uid()` guard, rewrite to parameterless signature
  3. Compare to `public.unread_total()` (no-param version, has `auth.uid()` inside) — consolidate to one
- **Rationale:** Same pattern risk as F-02. Any uid-parameter read function must verify the parameter against auth.uid().
- **Follow-up command:** DB (inspect function body), Carnage (Batch 1 revoke)
- **CISSP Domain:**
  - **Primary:** Identity and Access Management (5)
  - **Secondary:** Asset Security (2)

---

### F-04 — public.profiles: Private Profiles Exposed to Anon via Broad Policy

**VENOM SECURITY FINDING**
- **Location:** `public.profiles` table — policy `profiles_public_read` (role: public, FOR SELECT, USING: true)
- **Application Scope:** VCSM
- **Current behavior:** All profiles — including profiles where `private = true` or `publish = false` or `discoverable = false` — are readable by the `anon` (unauthenticated) role via PostgREST direct table access.
- **Risk:** Users who set their profile to private have an expectation that their data is not publicly visible. Any unauthenticated request to `/profiles?id=eq.<uuid>` returns full profile data including display_name, username, photo_url, bio, and the `private` flag itself.
- **Severity:** HIGH
- **Why it matters:** Privacy is a core user trust feature. A private profile being readable by anyone — including unauthenticated bots and scrapers — breaks the platform's privacy promise and may have legal implications (GDPR, CCPA) depending on jurisdiction.
- **Recommended mitigation:**
  1. Drop `profiles_public_read` policy
  2. Replace with `profiles_discoverable_read` — USING (publish = true AND discoverable = true AND NOT private)
  3. Add `profiles_self_read` — USING (id = auth.uid()) for authenticated users to read their own profile
  4. Review all application code that currently reads profiles directly — ensure no breakage
- **Rationale:** Public-readable data must be explicitly marked as discoverable. Private-by-default is the correct default for profile data.
- **Follow-up command:** Carnage (Batch 2 policy SQL), DB (verify policy coverage)
- **CISSP Domain:**
  - **Primary:** Asset Security (2)
  - **Secondary:** Identity and Access Management (5), Security and Risk Management (1)

---

### F-05 — learning.courses: Broad `true` Policies Break Multi-Tenant Isolation

**VENOM SECURITY FINDING**
- **Location:** `learning.courses` table — policies `authenticated can insert courses` (USING: true) and `authenticated can view courses` (USING: true)
- **Application Scope:** WENTREX (learning schema)
- **Current behavior:** Any authenticated user can SELECT all courses across all organizations, and INSERT a course into any organization. The org-scoped policies that should restrict access (e.g., `can_current_user_access_course`) exist but are PERMISSIVE — meaning the `true` policies are OR'd with them and always win.
- **Risk:** Complete multi-tenant isolation failure. A student in Organization A can read all courses in Organization B. Any authenticated user can insert a course into any organization they do not belong to.
- **Severity:** HIGH
- **Why it matters:** Wentrex is a multi-tenant LMS. Tenant isolation is the core security property — violating it means students, parents, and external users can read other organizations' course content, assignments, and curriculum.
- **Recommended mitigation:**
  1. Drop both `true` policies immediately
  2. Replace INSERT with: `WITH CHECK (learning.can_current_user_manage_organization(organization_id))`
  3. Replace SELECT with: `USING (learning.can_current_user_access_course(id))`
  4. Test with a user in Org A attempting to read Org B courses — must receive empty result
- **Rationale:** In a multi-tenant system, PERMISSIVE `true` policies must never exist on tenant-scoped tables. All policies on such tables must be restrictive or scoped.
- **Follow-up command:** Carnage (Batch 2 policy SQL), DB (audit all other learning.* `true` policies)
- **CISSP Domain:**
  - **Primary:** Security Architecture and Engineering (3)
  - **Secondary:** Identity and Access Management (5), Security and Risk Management (1)

---

### F-06 — vc.read_actor_profile: PII Returned with No Per-Caller Auth Check

**VENOM SECURITY FINDING**
- **Location:** `vc.read_actor_profile(p_actor_id uuid)` — full_schema.sql
- **Application Scope:** VCSM
- **Current behavior:** Returns `email`, `birthdate`, `age`, `sex`, `is_adult` for any actor ID. The function has `SET search_path` but no internal auth check. Any authenticated caller passing any actor_id receives full PII for that actor.
- **Risk:** PII exposure. Any authenticated user on the platform can retrieve the email address, birthdate, age, sex, and adult status of any other user.
- **Severity:** HIGH
- **Why it matters:** Email addresses, birthdates, and sex/adult flags are sensitive personal data. Exposing them to all authenticated callers enables targeted harassment, doxxing, age circumvention, and other platform safety violations.
- **Recommended mitigation:**
  1. Remove PII fields (email, birthdate, age, sex, is_adult) from the returned column set for public callers
  2. Create a separate admin-only / self-only function that returns PII — callable only with a verified owner role
  3. Replace with direct RLS-gated SELECT on `vc.actors` + `public.profiles` — apply self-only policy for PII columns
  4. The presentation function (display_name, username, photo_url, bio) is safe for authenticated access and can replace this function entirely
- **Rationale:** PII fields must never be exposed through a general-purpose profile read function callable by any session.
- **Follow-up command:** Carnage (Batch 2+3 migration), BUGSBUNNY (check for active callers reading PII fields)
- **CISSP Domain:**
  - **Primary:** Asset Security (2)
  - **Secondary:** Identity and Access Management (5), Communication and Network Security (4)

---

### F-07 — Supabase Default EXECUTE Grant: Anon Reaches All Public SECURITY DEFINER Functions

**VENOM SECURITY FINDING**
- **Location:** PostgreSQL default grants — Supabase applies `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated` by default
- **Application Scope:** VCSM
- **Current behavior:** Every SECURITY DEFINER function in `public.*` schema is callable by unauthenticated (`anon`) clients via PostgREST `/rpc/<function_name>`. This includes `admin_delete_user_everywhere`, `mark_all_messages_seen`, `get_unread_message_total`, all legacy social functions, and all notification helpers.
- **Risk:** The anon role (unauthenticated HTTP clients, bots, scrapers) can invoke any public.* function. Combined with missing auth guards inside function bodies (F-01, F-02, F-03), this creates a completely unauthenticated attack surface for account deletion, presence spoofing, and data reading.
- **Severity:** HIGH
- **Why it matters:** Defense in depth requires that functions with SECURITY DEFINER be explicitly access-controlled at both the EXECUTE grant level AND inside the function body. Relying on callers to "not know about" a function is not a security control.
- **Recommended mitigation:**
  1. Revoke anon EXECUTE from all non-anon-designed public.* functions (see Batch 1 SQL)
  2. Keep anon EXECUTE only for explicitly designed anon-accessible functions (vc.lovedrop_*, wanders.redeem_inbox_share_link)
  3. Apply authenticated-only EXECUTE for all social/profile/notification functions
  4. Add `search_path` to all public.* SECURITY DEFINER functions (missing search_path is a secondary attack vector)
- **Rationale:** Principle of least privilege — EXECUTE grants should be the minimum required for each function's callers. Default-grant-all is a Supabase footgun that requires explicit remediation.
- **Follow-up command:** Carnage (Batch 1 revoke SQL), DB (verify grant state after application)
- **CISSP Domain:**
  - **Primary:** Identity and Access Management (5)
  - **Secondary:** Security Architecture and Engineering (3), Communication and Network Security (4)

---

### F-08 — Legacy Social Functions: Dead Code with Live SECURITY DEFINER Privilege

**VENOM SECURITY FINDING**
- **Location:** `public.block_user`, `public.follow_user` (x2), `public.cancel_friend_request` (x2), `public.respond_friend_request` (x2), `public.send_friend_request` (x2), `public.is_blocked`, `public.react_to_post`, `public.start_direct_conversation`
- **Application Scope:** VCSM
- **Current behavior:** 13 SECURITY DEFINER functions writing to `public.user_blocks`, `public.followers`, `public.friends`, `public.friend_requests` — tables that no longer appear in the current schema or row count inventory. The functions remain callable via PostgREST with elevated privileges despite being dead code.
- **Risk:** Dead SECURITY DEFINER functions are an unreduced attack surface. Even if they fail silently due to missing target tables, they remain explorable entry points, may generate confusing error messages exposing schema structure, and consume elevated privilege slots unnecessarily.
- **Severity:** MEDIUM
- **Why it matters:** Every SECURITY DEFINER function is a potential escalation point. Keeping dead code with elevated privileges violates the principle of least privilege and increases the attack surface without benefit.
- **Recommended mitigation:**
  1. Batch 1: `REVOKE EXECUTE FROM anon, authenticated` on all 13 functions (immediate, low-risk)
  2. Batch 4: `DROP FUNCTION` on all 13 after verifying no application callers remain
  3. Grep application code for `.rpc('block_user')`, `.rpc('follow_user')`, etc. before dropping
- **Rationale:** Dead code with elevated runtime privileges is categorically unnecessary risk.
- **Follow-up command:** BUGSBUNNY (grep for active callers), Carnage (Batch 4 drop SQL)
- **CISSP Domain:**
  - **Primary:** Security Operations (7)
  - **Secondary:** Software Development Security (8), Security and Risk Management (1)

---

### F-09 — vc.read_actor_profile: vportId Used as Identity Surface in Authorization Helper

**IDENTITY SURFACE WARNING**
- **Location:** `vc.is_vport_owner(p_vport_id uuid)` — takes `vportId` as parameter, not `actorId`
- **Application Scope:** VCSM
- **Current identity surface:** `p_vport_id` (vport UUID)
- **Expected identity surface:** `p_actor_id` (actor UUID — the canonical identity surface per architecture contract)
- **Risk:** Using `vportId` as an authorization surface creates ambiguity when the same vport is controlled by multiple actors, or when actor ownership is transferred. The canonical ownership model is `actor_owners` keyed by `actor_id`, not vport_id.
- **Recommended mitigation:** Replace `is_vport_owner(p_vport_id)` call sites with `is_actor_owner(p_actor_id)` where p_actor_id is the vport actor. If vport_id input is unavoidable, resolve it to actor_id first: `vc.actor_id_for_vport(p_vport_id)` then check `is_actor_owner`.
- **Follow-up command:** BUGSBUNNY (find call sites of is_vport_owner)
- **CISSP Domain:**
  - **Primary:** Identity and Access Management (5)
  - **Secondary:** Software Development Security (8)

---

### F-10 — schemas with Zero RLS Policies: moderation, notification, identity, vport, reviews

**VENOM SECURITY FINDING**
- **Location:** `moderation.*`, `notification.*`, `identity.*`, `vport.*`, `reviews.*`, `omd.*`, `metrics.*`, `zubappnexrn.*` schemas
- **Application Scope:** VCSM
- **Current behavior:** These schemas have tables with either RLS disabled (unrestricted PostgREST access) or RLS enabled with zero policies (completely inaccessible via PostgREST — which is a different problem). Their function and policy surface was not included in the primary all_rls_policies.csv inventory.
- **Risk:**
  - If RLS disabled: any authenticated (or anon) request can read/write any row in any table
  - If RLS enabled + zero policies: data is locked out — legitimate application features may be silently broken
  - `moderation.*` in particular: moderation data (user reports, moderator actions) exposed to all users is a CRITICAL operational risk
- **Severity:** HIGH (moderation/identity), MEDIUM (notification, vport, reviews), UNKNOWN (omd, metrics, zubappnexrn)
- **Why it matters:** Schemas that fall outside the primary RLS review are the most likely to be overlooked in security audits — and therefore the most likely to have policy gaps.
- **Recommended mitigation:**
  1. Run DB review targeting each schema individually: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'moderation'`
  2. For moderation: enable RLS + restrict all SELECT/INSERT/UPDATE/DELETE to `learning.is_current_user_platform_admin()` or equivalent
  3. For notification: enable RLS + scope to `actor_id = vc.current_actor_id()`
  4. For reviews: inspect why FORCE RLS + zero policies was applied — likely intentional lockout, but verify
  5. For vport, identity: audit each table's sensitivity and apply appropriate scoping
- **Rationale:** Every schema with user-facing or sensitive data must have an explicit RLS policy plan. "Not yet reviewed" is not a security posture.
- **Follow-up command:** DB (per-schema RLS audit), Carnage (Batch 2 policy additions)
- **CISSP Domain:**
  - **Primary:** Security Architecture and Engineering (3)
  - **Secondary:** Security Assessment and Testing (6), Asset Security (2)

---

### F-11 — vc.mark_read and vc.open_conversation: p_actor_id Parameter Not Verified Against auth.uid()

**VENOM SECURITY FINDING**
- **Location:** `vc.mark_read(p_conversation_id uuid, p_actor_id uuid, p_last_message_id uuid)` and `vc.open_conversation(p_conversation_id uuid, p_actor_id uuid)`
- **Application Scope:** VCSM
- **Current behavior:** Both functions accept `p_actor_id` as an explicit parameter. If the function body does not verify that `p_actor_id` is an actor owned by `auth.uid()`, any authenticated caller can mark another actor's conversation as read or fake an open event on behalf of any actor.
- **Risk:** Conversation state spoofing — marking another user's messages as read, manipulating "open" tracking for any conversation participant.
- **Severity:** MEDIUM (pending body verification — if body has ownership check, downgrade to LOW)
- **Why it matters:** "Seen" and "opened" states are used for read receipts and conversation presence. Spoofing these can deceive other conversation participants about whether their messages were read.
- **Recommended mitigation:**
  1. Inspect function bodies — verify presence of: `vc.ensure_actor_ownership(p_actor_id)` or equivalent ownership check
  2. If check is missing: add `IF NOT vc.is_actor_owner(p_actor_id) THEN RAISE EXCEPTION 'not actor owner'; END IF;` at function start
- **Follow-up command:** DB (inspect function bodies), Carnage (Batch 5 hardening)
- **CISSP Domain:**
  - **Primary:** Identity and Access Management (5)
  - **Secondary:** Software Development Security (8)

---

### F-12 — public.create_tenant_bootstrap: Duplicate of learning.create_tenant_bootstrap — Verify Auth Gate

**VENOM SECURITY FINDING**
- **Location:** `public.create_tenant_bootstrap(...)` — mirrors `learning.create_tenant_bootstrap`
- **Application Scope:** WENTREX + VCSM
- **Current behavior:** A public-schema wrapper around tenant bootstrap provisioning. If the `public.*` version has weaker auth guards than the `learning.*` version (e.g., no caller verification), any authenticated user could bootstrap a new tenant organization.
- **Risk:** Unauthorized tenant creation — any authenticated user can create a new organization, bypass invite flows, and gain elevated roles within the newly created org.
- **Severity:** MEDIUM (pending body verification)
- **Why it matters:** Multi-tenant platforms must gate organization creation behind an admin verification or invitation system. Unrestricted org creation is a privilege escalation path.
- **Recommended mitigation:**
  1. Inspect `public.create_tenant_bootstrap` body — verify it checks that `p_caller_user_id = auth.uid()` and that the caller has the right to create a tenant
  2. If no guard: add admin check or restrict to `service_role` only and remove from PostgREST exposure
  3. Consolidate with `learning.create_tenant_bootstrap` — having two versions creates maintenance drift
- **Follow-up command:** DB (inspect function body), Carnage (Batch 5 hardening)
- **CISSP Domain:**
  - **Primary:** Identity and Access Management (5)
  - **Secondary:** Security and Risk Management (1)

---

## MITIGATION PLAN

```
MITIGATION PLAN

Risk: Three CRITICAL functions with no/wrong auth guards
Recommended change: REVOKE EXECUTE immediately (Batch 1), then rewrite with auth.uid() guards (Batch 5)
Why it works: Removes PostgREST access surface while code is being fixed
Layer to fix: Database (REVOKE), then PostgreSQL function body (rewrite)
Follow-up command: Carnage (Batch 1 + 5 SQL)

Risk: Private profiles exposed to anon
Recommended change: Drop broad `true` policy, replace with scoped discoverable-only + self-read policy
Why it works: PostgREST uses RLS policies for direct table access — correct policies restrict what anon can fetch
Layer to fix: Database (RLS policy change)
Follow-up command: Carnage (Batch 2 SQL)

Risk: Multi-tenant isolation broken in learning.courses
Recommended change: Drop broad `true` policies, replace with org-scoped policies using learning helper functions
Why it works: PERMISSIVE policies are OR'd — removing the `true` policy makes the narrower policies effective
Layer to fix: Database (RLS policy change)
Follow-up command: Carnage (Batch 2 SQL)

Risk: PII returned by vc.read_actor_profile to any caller
Recommended change: Remove PII from function return columns, replace with direct RLS-gated query
Why it works: Direct table access with RLS ensures caller identity is enforced at policy level
Layer to fix: Application (Batch 3 migration) + Database (Batch 4 drop)
Follow-up command: Carnage (Batch 3 + 4), BUGSBUNNY (find callers)
```

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | F-01, F-05, F-08 | Policy violations, dead privilege surface, governance gaps |
| Asset Security | F-04, F-06 | Private profile PII exposure, actor profile PII leak |
| Security Architecture and Engineering | F-05, F-07, F-10 | Multi-tenant isolation, default grant surface, zero-policy schemas |
| Communication and Network Security | F-06, F-07 | PostgREST RPC exposure, anon-reachable endpoints |
| Identity and Access Management | F-01, F-02, F-03, F-06, F-07, F-09, F-11, F-12 | Missing auth guards, uid-as-parameter, vportId identity surface, ownership bypass |
| Security Assessment and Testing | F-10 | Schemas outside primary RLS review — assessment gap |
| Security Operations | F-08 | Dead code with live elevated privileges |
| Software Development Security | F-02, F-03, F-08, F-09, F-11 | Parameter-based identity, dead DEFINER functions, identity surface misuse |

## CISSP Completion Statement

All 8 CISSP domains have been covered:
- **Security and Risk Management:** Covered by F-01 (no admin gate), F-05 (tenant isolation), F-08 (dead privilege surface)
- **Asset Security:** Covered by F-04 (private profiles), F-06 (PII in read_actor_profile)
- **Security Architecture and Engineering:** Covered by F-05 (isolation), F-07 (default grants), F-10 (schema gaps)
- **Communication and Network Security:** Covered by F-06 and F-07 (RPC/PostgREST exposure)
- **Identity and Access Management:** Highest concentration — 8 findings touch IAM
- **Security Assessment and Testing:** F-10 flags the gap in schema coverage as an assessment finding
- **Security Operations:** F-08 addresses dead privileged code and audit surface
- **Software Development Security:** F-02, F-03, F-08, F-09, F-11 address coding patterns

No CISSP domain is out of scope for this review. All 8 domains have at least one finding.

---

*VENOM report complete. All findings are analysis-only. No code, schema, or policies were modified.*  
*Migration plan: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-10_04-04_carnage_secdefiner-rls-elimination.md`*

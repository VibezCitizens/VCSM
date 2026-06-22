# VENOM V2 SECURITY REVIEW — settings

## Output Metadata

| Field | Value |
|---|---|
| Category Key | APPS/VCSM/features/settings |
| Feature | settings |
| Command | VENOM |
| Ticket | TICKET-VENOM-SETTINGS-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/settings/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_settings-security-review.md |
| Timestamp | 2026-06-04T19:48:00 |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                | Generated At                  | Age  | Freshness | Confidence | Status |
|--------------------|-------------------------------|------|-----------|------------|--------|
| write-surface-map  | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map            | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map  | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map  | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map| 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map| 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map  | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 16 | Primary attack surface inventory |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 7 | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 1 | Edge function surface inventory |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 24 | Security path inventory |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Route→write chain resolution |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 16 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 7 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 1 | Edge caller chain resolution |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total surfaces in scope: 16 write + 7 rpc + 1 edge
Total security paths in scope: 24
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 24

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: settings
Scan Date: 2026-06-04T19:48:25.152Z

Write Surfaces: 16
  INSERT:    0
  UPDATE:    9  (profiles ×7, actor_privacy_settings ×1, profile_public_details ×1)
  DELETE:    0
  UPSERT:    1  (actor_privacy_settings)
  RPC:       5  (soft_delete_citizen_account, soft_delete_vport, restore_vport,
                  hard_delete_vport, set_business_card_publish_state)
  EDGE_FN:   1  (delete-citizen-account)

RPC Calls: 7
  Schema: moderation:block_actor, moderation:unblock_actor,
          vport:soft_delete_vport, vport:restore_vport,
          vport:hard_delete_vport, vport:soft_delete_citizen_account,
          vport:set_business_card_publish_state

Edge Functions: 1
  Functions: delete-citizen-account

Security Paths: 24
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 24
  Access=protected: 0
  Access=public: 0
  Access=unknown: 24

Execution Paths Resolved: 0 / 24
```

NOTE: ALL 24 security paths have confidence=LOW (route chain unresolved by scanner).
Per Rule V-002, all LOW confidence surfaces receive HIGH priority review.
Manual tracing was performed for each surface below.

---

## 4. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| edge_function delete-citizen-account at account.write.dal.js | edge-function-map | HIGH | YES — line 24, no session check inside DAL; Edge Function holds service role | [SOURCE_VERIFIED] | VEN-SETTINGS-001 |
| RPC soft_delete_citizen_account at account.write.dal.js | rpc-map | HIGH | YES — line 5, no caller-supplied params; relies on DB auth context | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| RPC soft_delete_vport at account.write.dal.js | rpc-map | HIGH | YES — line 44, p_vport_id client-supplied; DB RPC must verify ownership | [SOURCE_VERIFIED] | VEN-SETTINGS-002 |
| RPC restore_vport at account.write.dal.js | rpc-map | HIGH | YES — line 61, p_vport_id client-supplied; controller has NO ownership gate | [SOURCE_VERIFIED] | VEN-SETTINGS-002 |
| RPC hard_delete_vport at account.write.dal.js | rpc-map | HIGH | YES — line 78, controller has ownership gate BUT hook at line 107 omits callerActorId | [SOURCE_VERIFIED] | VEN-SETTINGS-003 |
| RPC block_actor (moderation) at blocks.dal.js | rpc-map | HIGH | YES — line 42-45, actorId accepted from caller; controller checks callerActorId===actorId | [SOURCE_VERIFIED] | VEN-SETTINGS-004 |
| RPC unblock_actor (moderation) at blocks.dal.js | rpc-map | HIGH | YES — line 58-61, actorId accepted from caller; controller checks callerActorId===actorId | [SOURCE_VERIFIED] | VEN-SETTINGS-004 |
| UPSERT actor_privacy_settings at visibility.dal.js | write-surface-map | HIGH | YES — line 40-57, actorId caller-supplied; no session bind in DAL; controller has ownership gate | [SOURCE_VERIFIED] | VEN-SETTINGS-005 |
| UPDATE vport.profiles at profile.write.dal.js (vport mode) | write-surface-map | HIGH | YES — line 31-41, session verified at DAL; owner_user_id=uid guard present | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| UPDATE profiles at profile.write.dal.js (user mode) | write-surface-map | HIGH | YES — line 54-70, subjectId from caller param; NO session bind in DAL user mode; subjectId from hook=user.id | [SOURCE_VERIFIED] | VEN-SETTINGS-006 |
| UPDATE profiles at profileMediaAsset.write.dal.js (photo) | write-surface-map | HIGH | YES — line 17-23, session resolved internally at DAL line 17; .eq('id', uid) | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| UPDATE profiles at profileMediaAsset.write.dal.js (banner) | write-surface-map | HIGH | YES — line 26-34, session resolved internally at DAL line 17; .eq('id', uid) | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| RPC set_business_card_publish_state at vports.write.dal.js | rpc-map | HIGH | YES — line 11-14, vportId from caller; controller has ownership gate; SECURITY DEFINER at DB | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| UPDATE vport.profiles (business card settings) at vports.write.dal.js | write-surface-map | HIGH | YES — line 40-50, session verified, owner_user_id=uid guard; controller also has ownership gate | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| UPDATE vport.profiles (directory visible) at vports.write.dal.js | write-surface-map | HIGH | YES — line 63-83, session verified, owner_user_id=uid guard; controller also has ownership gate | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| UPDATE profile_public_details at vports.write.dal.js | write-surface-map | HIGH | YES — line 94-117, re-verifies ownership at line 102-109 before secondary write | [SOURCE_VERIFIED] | VERIFIED_SAFE |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/settings/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER
§5 Security Rules declared: 0
§5 Rules verified in source: N/A — contract is PLACEHOLDER, no §5 declared
§5 Rules unenforced: N/A — PLACEHOLDER
§9 Must Never Happen declared: 0
§9 Invariants protected in source: N/A — contract is PLACEHOLDER, no §9 declared
§9 Invariants unprotected: N/A — PLACEHOLDER
```

BEHAVIOR.md exists but is a PLACEHOLDER with no §5 Security Rules and no §9 Must Never Happen invariants declared.
This is treated as MISSING_BEHAVIOR_CONTRACT for purposes of VENOM coverage.
All findings below are UNANCHORED — no behavior contract to cross-check against.

---

## 6. Trust Boundary Findings

---

### VEN-SETTINGS-001 — Missing Ownership Gate: ctrlSoftDeleteVport and ctrlRestoreVport

```
VENOM SECURITY FINDING
- Finding ID: VEN-SETTINGS-001
- Location:
    apps/VCSM/src/features/settings/account/controller/account.controller.js:19-21
    apps/VCSM/src/features/settings/account/controller/account.controller.js:34-36
    apps/VCSM/src/features/settings/account/dal/account.write.dal.js:41-56 (soft_delete_vport)
    apps/VCSM/src/features/settings/account/dal/account.write.dal.js:58-73 (restore_vport)
- Application Scope: VCSM
- Platform Surface: PWA / Supabase RPC
- Trust Boundary: Authenticated Citizen / Authenticated VPORT Owner
- Boundary Violated: Any authenticated citizen may attempt to soft-delete or restore
  any VPORT by supplying an arbitrary vportId — no app-layer ownership gate exists
  in ctrlSoftDeleteVport or ctrlRestoreVport.
- Contract Violated: Actor Ownership Contract / VPORT Lifecycle Contract
- Current behavior:
    ctrlSoftDeleteVport({ vportId }) calls dalDeleteMyVport(vportId) without
    verifying the caller owns the VPORT. ctrlRestoreVport({ vportId }) calls
    dalRestoreVport(vportId) with identical gap.
    Both are called from useAccountController and useVportsController.
    ctrlHardDeleteVport HAS the ownership gate (lines 26-31) — the soft delete and
    restore paths do not.
- Risk: An authenticated citizen who knows or guesses a target vportId could trigger
  soft deletion or restoration of a VPORT they do not own, provided the DB RPC
  is the only enforcement layer. If the DB RPC (soft_delete_vport / restore_vport)
  enforces auth.uid() ownership, exploitation is blocked at DB level. However,
  the absence of an app-layer gate violates defense-in-depth and places all
  enforcement burden on the unverified DB RPC.
- Severity: HIGH
- Exploitability: MEDIUM
  (requires knowledge of target vportId UUID; DB RPC may block at DB layer —
  unverified without DB inspection)
- Attack Preconditions:
    - Authenticated Citizen account required
    - Target vportId UUID known or enumerated
    - DB RPC must NOT enforce ownership internally (or must be bypassable)
- Blast Radius:
    - Per-VPORT: any VPORT could be soft-deleted or spuriously restored
    - VPORT Lifecycle: lifecycle state corrupted for victim VPORT
    - Platform trust: Citizen can disrupt competitor VPORTs
- Identity Leak Type: None
- Cache Trust Type: VPORT Lifecycle-sensitive
- RLS Dependency: UNVERIFIED — soft_delete_vport and restore_vport RPCs not
  inspected at DB level. App-layer provides no fallback.
- Why it matters: A VPORT deactivation action is irreversible from the victim's
  perspective until support intervenes. Lifecycle corruption could remove a business
  from the platform without their consent.
- Recommended mitigation:
    Add assertActorOwnsVportActorController({ requestActorId: callerActorId,
    targetActorId: vportActorId }) to both ctrlSoftDeleteVport and ctrlRestoreVport,
    mirroring the pattern already in ctrlHardDeleteVport. Callers (hooks) must pass
    callerActorId and vportActorId.
- Rationale: ctrlHardDeleteVport already enforces this correctly. Parity is required.
  The DB RPC cannot be the sole ownership fence — any DB schema change could break it.
- Follow-up command: DB (verify soft_delete_vport and restore_vport RPCs enforce
  auth.uid() ownership), SPIDER-MAN (add regression test for unauthorized soft-delete
  attempt)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
    Primary: Identity and Access Management
    Secondary: Security Architecture and Engineering, Software Development Security
```

---

### VEN-SETTINGS-002 — ctrlSoftDeleteCitizenAccount: Edge Function Invoked Without App-Layer Session Proof

```
VENOM SECURITY FINDING
- Finding ID: VEN-SETTINGS-002
- Location:
    apps/VCSM/src/features/settings/account/dal/account.write.dal.js:23-39
    apps/VCSM/src/features/settings/account/controller/account.controller.js:15-17
- Application Scope: VCSM
- Platform Surface: PWA / Edge Function
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Edge Function invoked via DAL with no pre-flight session
  assertion in the app layer. The Edge Function (delete-citizen-account) holds
  the service role key.
- Contract Violated: Actor Ownership Contract
- Current behavior:
    dalDeleteCitizenAccountFull() calls supabase.functions.invoke('delete-citizen-account')
    via HTTP POST with no Authorization header verification in the DAL or controller.
    The JWT is forwarded by the Supabase client automatically. The Edge Function
    is responsible for validating the JWT and extracting auth.uid(). No app-layer
    pre-check confirms the session is valid before the invocation.
- Risk: If the Edge Function does not strictly verify the JWT (e.g., missing
  verify_jwt=true, or weak error handling), an unauthenticated or impersonated
  invocation could trigger account deletion. Additionally, no confirmation
  that the calling user is the same user whose account is deleted is enforced
  in the app layer — the Edge Function must be the sole authority.
- Severity: HIGH
- Exploitability: LOW
  (Supabase client forwards JWT automatically; Edge Function likely validates it;
  requires Edge Function misconfiguration to exploit directly)
- Attack Preconditions:
    - Edge Function deployed without verify_jwt=true, or with weak JWT validation
    - Or: attacker intercepts session token of victim
- Blast Radius:
    - Single citizen account permanently deleted (irreversible)
    - If Edge Function lacks JWT validation: any caller can delete any account
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (Edge Function uses service role key, bypasses RLS by design)
- Why it matters: Account deletion is permanent and irreversible. The Edge Function
  holds the service role key. A misconfigured function = platform-wide account
  deletion capability with no owner verification.
- Recommended mitigation:
    1. Add app-layer session pre-check before invoking the Edge Function:
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('Not authenticated');
    2. Verify the Edge Function has verify_jwt=true in its config.
    3. Route to ELEKTRA for Edge Function source inspection.
- Rationale: Defense-in-depth requires the app layer to confirm session validity
  before delegating to a service-role-capable function.
- Follow-up command: ELEKTRA (inspect Edge Function source for JWT validation),
  DB (verify Edge Function config has verify_jwt=true)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
    Primary: Identity and Access Management
    Secondary: Security Architecture and Engineering, Security Operations
```

---

### VEN-SETTINGS-003 — useAccountController: ctrlHardDeleteVport Called Without callerActorId

```
VENOM SECURITY FINDING
- Finding ID: VEN-SETTINGS-003
- Location:
    apps/VCSM/src/features/settings/account/hooks/useAccountController.js:107
    apps/VCSM/src/features/settings/account/controller/account.controller.js:23-32
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Controller ownership gate is present but bypassed in the
  Account tab's hook due to missing callerActorId argument.
- Contract Violated: Actor Ownership Contract
- Current behavior:
    useAccountController.hardDeleteVport(targetVportId) calls:
      ctrlHardDeleteVport({ vportId: targetVportId })
    — no callerActorId field supplied.
    ctrlHardDeleteVport (line 25) throws immediately:
      'ctrlHardDeleteVport: callerActorId is required'
    This means hard delete from the Account tab ALWAYS fails with an error,
    never completing. The Account tab's hard delete is silently broken.
    Note: useVportsController.hardDeleteVport correctly supplies callerActorId
    (line 99) — that path works.
- Risk: The broken path means users cannot hard-delete VPORTs from the Account tab
  settings screen. While not an exploitable privilege escalation, it is a security-
  adjacent defect: the ownership gate throws for the wrong reason (missing arg)
  rather than actually verifying ownership. If the controller is changed to make
  callerActorId optional, the ownership gate would silently disappear.
- Severity: MEDIUM
  (not currently exploitable — throws before the DB call — but creates confusion
  about which code path is authoritative for hard delete)
- Exploitability: LOW
  (the missing arg causes an immediate throw, preventing exploitation)
- Attack Preconditions:
    - Developer relaxes callerActorId requirement in controller
    - Then the Account tab path could delete any VPORT
- Blast Radius:
    - Single VPORT: permanent deletion possible if controller is weakened
    - User experience: Account tab hard delete is currently non-functional
- Identity Leak Type: None
- Cache Trust Type: VPORT Lifecycle-sensitive
- RLS Dependency: UNVERIFIED
- Why it matters: Code that throws for incorrect reasons can mislead future
  developers into removing or softening the guard. The broken path could become
  an unguarded deletion path if the controller signature is changed.
- Recommended mitigation:
    Update useAccountController.hardDeleteVport to pass callerActorId from
    identity?.actorId, matching the pattern in useVportsController:
      await ctrlHardDeleteVport({ vportId: targetVportId, callerActorId: actorId })
- Rationale: Both paths for hard delete should behave consistently and correctly.
- Follow-up command: SPIDER-MAN (add regression test for Account tab hard delete path)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
    Primary: Software Development Security
    Secondary: Identity and Access Management, Security Assessment and Testing
```

---

### VEN-SETTINGS-004 — blocks.dal.js: Client-Supplied actorId Passed Directly to moderation.block_actor RPC

```
VENOM SECURITY FINDING
- Finding ID: VEN-SETTINGS-004
- Location:
    apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js:35-48 (dalInsertBlock)
    apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js:51-64 (dalDeleteBlockByTarget)
    apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js:71
    apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js:104
- Application Scope: VCSM
- Platform Surface: PWA / Supabase RPC
- Trust Boundary: Authenticated Citizen / Authenticated VPORT Owner
- Boundary Violated: actorId (the blocker) is passed as a client-controlled
  parameter (p_blocker_actor_id) to the moderation.block_actor RPC. The app-layer
  ownership check compares callerActorId === actorId, but both values originate
  from the same hook call — an attacker who can control actorId at the hook level
  could block as any actor.
- Contract Violated: Actor Ownership Contract / Public Identity Surface Contract
- Current behavior:
    Blocks.controller.js validates callerActorId === actorId (lines 71, 104).
    callerActorId is sourced from identity?.actorId in the hook.
    actorId is a parameter passed into ctrlBlockActor/ctrlUnblockActor by the caller.
    The comparison is string equality only — not verified against auth.uid() or
    actor_owners at the controller layer.
    The moderation.block_actor DB RPC receives p_blocker_actor_id as a caller-supplied
    value. If the RPC does NOT internally verify p_blocker_actor_id === resolved
    actor for auth.uid(), then any authenticated user could block as any actor
    by passing a forged actorId.
- Risk: If the DB RPC trusts p_blocker_actor_id without verifying it matches
  the caller's authenticated session actor, a citizen could forge blocks as another
  actor (e.g., as a large VPORT, causing moderation harm to the victim of the block).
- Severity: HIGH
- Exploitability: MEDIUM
  (controller check exists but relies only on string comparison; exploitation
  requires caller to also control the callerActorId value, which in practice
  comes from session — but if session is leaked or the check is bypassed, the
  DB RPC is the last line of defense)
- Attack Preconditions:
    - Authenticated Citizen account required
    - Ability to pass arbitrary actorId to ctrlBlockActor (e.g., via direct
      controller invocation, not through the UI hook — diagnostics file exposes
      ctrlBlockActor directly)
    - DB RPC moderation.block_actor must not validate auth.uid()
- Blast Radius:
    - Multi-actor: any actor could be blocked from any other actor's perspective
    - Feed-wide: forged blocks would suppress content globally
    - Moderation integrity: block system corrupted
- Identity Leak Type: Actor correlation
- Cache Trust Type: Moderation-sensitive
- RLS Dependency: UNVERIFIED — moderation.block_actor RPC not inspected;
  it may internally resolve caller actor from auth.uid(), which would block exploitation
- Why it matters: The block system directly affects content visibility for all
  citizens on the platform. A forged block can silence legitimate actors or create
  a harassment mechanism.
- Recommended mitigation:
    1. DB: Verify that moderation.block_actor RPC resolves the blocker from auth.uid()
       internally, ignoring or rejecting the p_blocker_actor_id parameter if it
       does not match the authenticated session.
    2. If the RPC trusts p_blocker_actor_id: enforce that the app layer derives
       actorId from auth.uid() → actor_owners rather than accepting it as a parameter.
    3. Remove or guard ctrlBlockActor direct export from the diagnostics group
       surface contract (settingsPrivacyFeature.group.js line 9-10).
- Rationale: The blocker identity should be derived from auth context, not accepted
  as a client-supplied parameter.
- Follow-up command: DB (inspect moderation.block_actor RPC source for auth.uid()
  resolution), ELEKTRA (trace p_blocker_actor_id parameter chain)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
    Primary: Identity and Access Management
    Secondary: Security Architecture and Engineering, Asset Security
```

---

### VEN-SETTINGS-005 — dalSetActorPrivacy: actorId Caller-Supplied, No Session Bind at DAL Layer

```
VENOM SECURITY FINDING
- Finding ID: VEN-SETTINGS-005
- Location:
    apps/VCSM/src/features/settings/privacy/dal/visibility.dal.js:40-57
    apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js:14-27
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vc.actor_privacy_settings)
- Trust Boundary: Authenticated Citizen / Authenticated VPORT Owner
- Boundary Violated: actorId is accepted as a caller parameter in dalSetActorPrivacy
  and upserted directly as the row key. No session-bound verification exists at
  the DAL layer.
- Contract Violated: Actor Ownership Contract
- Current behavior:
    dalSetActorPrivacy(actorId, isPrivate) upserts on actor_id = actorId.
    actorId comes from caller — no auth.getUser() call in DAL.
    Controller layer (actorPrivacy.controller.js:18-20) performs ownership
    verification: if callerActorId !== actorId, calls assertActorOwnsVportActorController.
    The controller ownership check is the ONLY gate.
    RLS on vc.actor_privacy_settings is UNVERIFIED.
- Risk: If the controller is bypassed or its ownership check is weakened, any
  authenticated citizen could set privacy state for any actor. The DAL provides
  no fallback defense.
- Severity: MEDIUM
  (controller ownership check is present and enforced in the production path;
  risk is conditional on controller bypass or future weakening)
- Exploitability: LOW
  (controller correctly enforces ownership; not directly exploitable in current code)
- Attack Preconditions:
    - Controller ownership check removed or weakened
    - Or: direct DAL invocation bypassing controller
    - Or: RLS on vc.actor_privacy_settings is absent or overly permissive
- Blast Radius:
    - Per-actor: privacy state flipped for any actor
    - Feed-wide: content visibility policy corrupted
    - SEO: private actors exposed to indexing
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive, Moderation-sensitive
- RLS Dependency: UNVERIFIED — vc.actor_privacy_settings RLS policy not inspected
- Why it matters: Privacy state directly controls content visibility. If an actor
  can be forced to public, their content is exposed without consent.
- Recommended mitigation:
    Add session verification to dalSetActorPrivacy: resolve auth.uid() and verify
    the actorId belongs to that user via actor_owners before executing the upsert.
    Alternatively, ensure vc.actor_privacy_settings has RLS that restricts writes
    to the actor's owner session.
- Rationale: Defense-in-depth requires the DAL to not blindly trust caller-supplied
  identity fields on write operations.
- Follow-up command: DB (inspect RLS on vc.actor_privacy_settings)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
    Primary: Security Architecture and Engineering
    Secondary: Identity and Access Management, Software Development Security
```

---

### VEN-SETTINGS-006 — profile.write.dal.js (User Mode): No Session Bind in DAL — Relies Entirely on Caller-Supplied subjectId

```
VENOM SECURITY FINDING
- Finding ID: VEN-SETTINGS-006
- Location:
    apps/VCSM/src/features/settings/profile/dal/profile.write.dal.js:54-70
    apps/VCSM/src/features/settings/profile/controller/saveProfile.controller.js:3-16
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (profiles)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: User-mode profile update uses .eq('id', subjectId) where
  subjectId is entirely caller-supplied with no session verification in the DAL.
  Unlike the vport mode (which calls auth.getUser() at line 18), the user mode
  (lines 54-70) does not.
- Contract Violated: Actor Ownership Contract
- Current behavior:
    updateProfile(subjectId, 'user', data) at lines 54-70 calls:
      supabase.from('profiles').update(payload).eq('id', subjectId)
    No auth.getUser() is called in this branch. The RLS on public.profiles is the
    only database-side guard.
    In the normal UI path: subjectId = user?.id from useAuth() in useProfileController
    (line 54: return user?.id || null). This is correctly session-derived.
    However, the legacy saveProfile.controller.js passes profileId received
    from the UI draft object — the origin is trusted but not verified at DAL.
    The diagnostics group (settingsProfileFeature.group.js line 193) calls
    saveProfileCore() with context.userId — correctly derived — but this
    demonstrates the DAL accepts any UUID.
- Risk: If RLS on public.profiles does not enforce auth.uid() = id on UPDATE,
  and a caller supplies an arbitrary subjectId, the DAL will attempt to update
  that profile row. The defense relies entirely on RLS.
- Severity: MEDIUM
  (RLS on profiles is expected to exist; exploitation requires both the controller
  to be bypassed AND RLS to be absent/misconfigured)
- Exploitability: LOW
  (normal app path correctly derives subjectId from session; risk is architectural)
- Attack Preconditions:
    - Caller supplies arbitrary subjectId bypassing the hook
    - RLS on public.profiles must not enforce owner = auth.uid()
- Blast Radius:
    - Per-user: profile display_name, bio, photo_url, banner_url overwritten
    - Feed-wide: impersonation via modified display name
- Identity Leak Type: None directly; enables identity spoofing
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: REQUIRED — user-mode DAL relies entirely on RLS for ownership
  enforcement. UNVERIFIED whether policy is present.
- Why it matters: The vport mode correctly adds a session bind (.eq('owner_user_id', userId))
  but the user mode does not. Asymmetric security design is a maintenance risk.
- Recommended mitigation:
    Add session verification to the user-mode branch of updateProfile:
      const { data: authSession } = await supabase.auth.getUser();
      const uid = authSession?.user?.id;
      if (!uid) throw new Error('Not authenticated');
      // use .eq('id', uid) instead of .eq('id', subjectId)
    This aligns user-mode security with vport-mode security design.
- Rationale: The vport-mode branch already implements this pattern (lines 18-35).
  User mode should match.
- Follow-up command: DB (inspect RLS on public.profiles for UPDATE policy),
  ELEKTRA (verify no bypass path exists for subjectId injection)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
    Primary: Software Development Security
    Secondary: Security Architecture and Engineering, Identity and Access Management
```

---

### VEN-SETTINGS-007 — MISSING_BEHAVIOR_CONTRACT: settings BEHAVIOR.md is PLACEHOLDER

```
VENOM SECURITY FINDING
- Finding ID: VEN-SETTINGS-007
- Location: ZZnotforproduction/APPS/VCSM/features/settings/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: Engineering governance
- Boundary Violated: No §5 Security Rules or §9 Must Never Happen invariants
  are declared for a feature with 16 write surfaces, 7 RPCs, 1 Edge Function,
  and account/VPORT deletion capabilities.
- Contract Violated: Behavior Contract Governance
- Current behavior:
    BEHAVIOR.md exists but contains only:
    "Status: PLACEHOLDER — Behavior contract pending source review."
    No security rules are declared. VENOM cannot cross-check any invariants.
    All findings above are UNANCHORED — no declared contract to verify against.
- Risk: Future developers have no declared security invariants to maintain.
  Security rules for actor ownership, session verification, and lifecycle
  restrictions are implicit in code only — not captured as testable contract items.
  This allows security regressions to go undetected by SPIDER-MAN or VENOM.
- Severity: HIGH
  (settings manages account deletion, VPORT lifecycle, privacy state, and block
  actions — all high-risk surfaces without a documented security contract)
- Exploitability: LOW (governance gap, not directly exploitable)
- Attack Preconditions: N/A — governance finding
- Blast Radius:
    - Platform-wide: no defined invariants for any settings security surface
    - Regression risk: any future change could silently remove a security gate
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Settings is one of the highest-risk features on the platform
  (account deletion, VPORT lifecycle, privacy controls, blocking). Without a
  declared behavior contract, there is no authoritative reference for what
  must never happen.
- Recommended mitigation:
    Populate BEHAVIOR.md §5 Security Rules and §9 Must Never Happen with at minimum:
    - §5: Actor must own the VPORT before soft-delete, restore, or hard-delete
    - §5: Account deletion must require authenticated session
    - §5: Block/unblock must verify caller owns blocker actor
    - §5: Privacy settings write must verify actor ownership
    - §9: A Citizen must never be able to soft-delete or restore a VPORT they do not own
    - §9: Account deletion must never be possible without an authenticated session
    - §9: block_actor must never forge a block from an actor the caller does not own
- Rationale: Every security finding above should be anchored to a declared §9 invariant.
- Follow-up command: Wolverine (BEHAVIOR.md intake for settings feature)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
    Primary: Security and Risk Management
    Secondary: Security Assessment and Testing, Software Development Security
```

---

## 7. Source Verification Summary

```
Total surfaces in scope: 16 write + 7 rpc + 1 edge = 24
Surfaces source-verified: 24 / 24

Source files read:
  apps/VCSM/src/features/settings/account/dal/account.write.dal.js
  apps/VCSM/src/features/settings/account/controller/account.controller.js
  apps/VCSM/src/features/settings/account/hooks/useAccountController.js
  apps/VCSM/src/features/settings/account/hooks/useVportAccountOps.js
  apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js
  apps/VCSM/src/features/settings/privacy/dal/visibility.dal.js
  apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js
  apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js
  apps/VCSM/src/features/settings/privacy/hooks/useActorPrivacy.js
  apps/VCSM/src/features/settings/privacy/hooks/useMyBlocks.jsx
  apps/VCSM/src/features/settings/profile/dal/profile.write.dal.js
  apps/VCSM/src/features/settings/profile/dal/profileMediaAsset.write.dal.js
  apps/VCSM/src/features/settings/profile/controller/profile.controller.js
  apps/VCSM/src/features/settings/profile/controller/saveProfile.controller.js
  apps/VCSM/src/features/settings/profile/controller/recordProfileMediaAsset.controller.js
  apps/VCSM/src/features/settings/profile/hooks/useProfileController.js
  apps/VCSM/src/features/settings/profile/adapter/UserProfileTab.jsx
  apps/VCSM/src/features/settings/vports/dal/vports.write.dal.js
  apps/VCSM/src/features/settings/vports/controller/vportBusinessCard.controller.js
  apps/VCSM/src/features/settings/vports/controller/vportBusinessCardSettings.controller.js
  apps/VCSM/src/features/settings/vports/controller/vportDirectoryVisibility.controller.js
  apps/VCSM/src/features/settings/vports/controller/vportSocialSettings.controller.js
  apps/VCSM/src/features/settings/vports/hooks/useVportsController.js
  apps/VCSM/src/dev/diagnostics/groups/settingsAccountFeature.group.js
  apps/VCSM/src/dev/diagnostics/groups/settingsPrivacyFeature.group.js
  apps/VCSM/src/dev/diagnostics/groups/settingsProfileFeature.group.js

CRITICAL findings: 0
HIGH findings: 4 — all [SOURCE_VERIFIED]: YES
MEDIUM findings: 3 — all [SOURCE_VERIFIED]: YES
LOW findings: 0
```

---

## 8. Confidence Summary

```
HIGH confidence surfaces (scanner): 16 write + 7 rpc + 1 edge = 24
LOW confidence paths (route unresolved): 24 / 24
[SOURCE_VERIFIED] findings: 7 / 7
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
SCANNER_STALE findings: 0

Note: ALL 24 security paths had confidence=LOW (route chain unresolved).
Per Rule V-002, each was manually traced to its controller/hook callers.
Manual tracing resolved all caller chains. No UNRESOLVED_CALL_CHAIN findings.
```

Verified Safe Surfaces (no finding emitted):
- soft_delete_citizen_account RPC: no caller-supplied params; DB auth context only
- profileMediaAsset photo/banner writes: session resolved internally via auth.getUser()
- vport-mode profile update: session verified at DAL + owner_user_id guard
- business card settings update: dual ownership (controller + DAL owner_user_id)
- directory visibility update: dual ownership (controller + DAL owner_user_id)
- profile_public_details sync: re-verifies ownership before secondary write
- set_business_card_publish_state RPC: SECURITY DEFINER at DB + controller ownership gate

---

## 9. THOR Impact

```
THOR Release Blockers: NONE
  (No CRITICAL findings; HIGH findings are architectural hardening, not active exploits
  in current code paths provided RLS is present)

Highest Open Severity: HIGH

Recommended THOR Gate:
  VEN-SETTINGS-001 (soft/restore VPORT ownership gap) should be resolved before
  any VPORT lifecycle feature launch.
  VEN-SETTINGS-007 (missing behavior contract) should be resolved before the next
  VENOM or SPIDER-MAN pass can be meaningfully anchored.

Deferred to DB verification:
  VEN-SETTINGS-001, VEN-SETTINGS-004, VEN-SETTINGS-005 all depend on unverified
  DB-level RLS or RPC ownership enforcement. DB command must confirm before
  severity can be downgraded to LOW.
```

---

## 10. Required Follow-Up Commands

| Command | Scope | Reason |
|---|---|---|
| DB | moderation.block_actor RPC | Verify p_blocker_actor_id vs auth.uid() enforcement |
| DB | moderation.unblock_actor RPC | Verify p_blocker_actor_id vs auth.uid() enforcement |
| DB | vport.soft_delete_vport RPC | Verify ownership enforcement at DB layer |
| DB | vport.restore_vport RPC | Verify ownership enforcement at DB layer |
| DB | vc.actor_privacy_settings RLS | Verify UPDATE policy restricts to actor owner |
| DB | public.profiles RLS | Verify UPDATE policy on user-mode path |
| ELEKTRA | delete-citizen-account Edge Function | Inspect verify_jwt config and JWT validation logic |
| SPIDER-MAN | account settings: hard delete path | Add regression: Account tab hard delete with/without callerActorId |
| SPIDER-MAN | VPORT lifecycle: unauthorized soft-delete | Add regression: attempt soft-delete of unowned VPORT |
| SPIDER-MAN | block_actor: forge blocker actorId | Add regression: block_actor with mismatched callerActorId |
| Wolverine | BEHAVIOR.md intake for settings | Populate §5 and §9 with declared security invariants |

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-SETTINGS-001 | No ownership gate on soft-delete/restore VPORT | Controller | P1 | App | DB, SPIDER-MAN |
| VEN-SETTINGS-002 | Edge Function invoked without app-layer session pre-check | DAL / Edge Function | P1 | App + DB | ELEKTRA |
| VEN-SETTINGS-003 | Hard delete hook omits callerActorId — path broken | Hook (UI) | P2 | App | SPIDER-MAN |
| VEN-SETTINGS-004 | block_actor passes client-supplied actorId to DB RPC | DAL + DB | P1 | App + DB | DB, ELEKTRA |
| VEN-SETTINGS-005 | dalSetActorPrivacy has no session bind — relies on RLS | DAL + RLS | P2 | App + DB | DB |
| VEN-SETTINGS-006 | User-mode profile update has no session bind at DAL | DAL | P2 | App + DB | DB, ELEKTRA |
| VEN-SETTINGS-007 | settings BEHAVIOR.md is PLACEHOLDER | Documentation | P2 | Documentation | Wolverine |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-SETTINGS-007: missing behavior contract governs risk policy |
| Asset Security | 1 | VEN-SETTINGS-004 secondary: actor correlation via forged block identity |
| Security Architecture and Engineering | 5 | VEN-SETTINGS-001, 002, 004, 005, 006: trust boundary design gaps; defense-in-depth missing |
| Communication and Network Security | 0 | No public endpoint or routing findings; Edge Function JWT is a concern (covered under IAM) |
| Identity and Access Management | 6 | All six code findings involve actor identity or ownership verification gaps |
| Security Assessment and Testing | 2 | VEN-SETTINGS-003, 007: broken code path + missing behavior contract undermine test coverage |
| Security Operations | 1 | VEN-SETTINGS-002: Edge Function holds service role key — operational risk if misconfigured |
| Software Development Security | 4 | VEN-SETTINGS-003, 004, 005, 006: input validation, DAL trust patterns, caller chain bugs |

### CISSP Domain Notes

- Communication and Network Security: No findings scoped here. All surfaces use Supabase SDK
  with session-managed transport. The Edge Function JWT concern is captured under IAM (VEN-SETTINGS-002).
  This domain is OUT OF SCOPE for this feature review.
- All other 7 CISSP domains are meaningfully represented.
- CISSP coverage is HIGH for IAM, Software Development Security, and Security Architecture.
  Security Operations coverage is narrow (Edge Function only) — ELEKTRA should deepen this.
